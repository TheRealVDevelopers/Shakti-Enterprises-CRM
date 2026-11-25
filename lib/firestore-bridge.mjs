import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';

const key=id=>Buffer.from(String(id)).toString('base64url');
const changed=(before,after)=>[...after].filter(([id,value])=>before.get(id)!==value);
export function captureRuntime(engine,sessions){
 return {
  records:new Map(engine.db.prepare('SELECT type,id,data FROM records').all().map(row=>[row.id,JSON.stringify(row)])),
  audit:new Map(engine.db.prepare('SELECT * FROM audit').all().map(row=>[String(row.id),JSON.stringify(row)])),
  settings:engine.db.prepare('SELECT data FROM settings WHERE id=1').get().data,
  sessions:JSON.stringify([...sessions].filter(([,session])=>session.expires>Date.now()))
 };
}
export function restoreRuntime(engine,sessions,records,audit,control){
 engine.db.exec('BEGIN IMMEDIATE');
 try{
  engine.db.exec('DELETE FROM records; DELETE FROM audit;');
  const record=engine.db.prepare('INSERT INTO records(type,id,data) VALUES(?,?,?)');
  for(const row of records)record.run(row.type,row.id,row.data);
  const entry=engine.db.prepare('INSERT INTO audit(id,at,actor,unit,action,record,before_data,after_data) VALUES(?,?,?,?,?,?,?,?)');
  for(const row of audit)entry.run(row.id,row.at,row.actor,row.unit,row.action,row.record,row.before_data,row.after_data);
  if(control.settings)engine.db.prepare('UPDATE settings SET data=? WHERE id=1').run(control.settings);
  engine.db.exec('COMMIT');
 }catch(error){engine.db.exec('ROLLBACK');throw error;}
 sessions.clear();for(const [token,session] of JSON.parse(control.sessions||'[]'))if(session.expires>Date.now())sessions.set(token,session);
}

// Firestore is authoritative. SQLite is a request-local calculation cache only.
// The control document serializes commits across cold starts and overlapping revisions.
export class FirestoreBridge {
 constructor(db,engine,sessions,directory){
  Object.assign(this,{db,engine,sessions,directory});this.revision=-1;this.queue=Promise.resolve();
  this.control=db.collection('crmRuntime').doc('control');this.records=db.collection('crmRecords');this.audit=db.collection('crmAudit');this.blobs=db.collection('crmFiles');
 }
 run(operation){
  const work=this.queue.then(async()=>{
   let committedRevision=-1;
   try{
    const result=await this.db.runTransaction(async transaction=>{
     const document=await transaction.get(this.control),control=document.exists?document.data():{},revision=control.revision||0;
     if(this.revision!==revision){
      const [records,audit]=await Promise.all([transaction.get(this.records),transaction.get(this.audit)]);
      restoreRuntime(this.engine,this.sessions,records.docs.map(doc=>doc.data()),audit.docs.map(doc=>doc.data()),control);
     }
     // A retry must reload canonical data even when the previous callback mutated the cache.
     this.revision=-1;
     const before=captureRuntime(this.engine,this.sessions);
     const helpers={
      download:async id=>{
       if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('Invalid attachment identifier');
       const parts=await transaction.get(this.blobs.where('file','==',id));
       const chunks=parts.docs.map(doc=>doc.data()).sort((a,b)=>a.index-b.index);
       if(!chunks.length)throw Error('Stored attachment was not found');
       mkdirSync(join(this.directory,'uploads'),{recursive:true});
       writeFileSync(join(this.directory,'uploads',id),Buffer.concat(chunks.map(chunk=>Buffer.from(chunk.content,'base64'))));
      }
     };
     const response=await operation(helpers);
     if(response?.status>=400){committedRevision=-1;return response;}
     const after=captureRuntime(this.engine,this.sessions),recordChanges=changed(before.records,after.records),auditChanges=changed(before.audit,after.audit);
     let dirty=!document.exists||recordChanges.length||auditChanges.length||before.settings!==after.settings||before.sessions!==after.sessions;
     for(const [id,serialized] of recordChanges){
      const row=JSON.parse(serialized);
      if(row.type==='attachments'&&!before.records.has(id)){
       const file=join(this.directory,'uploads',id);if(!existsSync(file))throw Error('Uploaded attachment is missing');
       const bytes=readFileSync(file),size=384*1024;
       for(let index=0,offset=0;offset<bytes.length;index++,offset+=size)transaction.set(this.blobs.doc(`${key(id)}-${index}`),{file:id,index,content:bytes.subarray(offset,offset+size).toString('base64')});
      }
      transaction.set(this.records.doc(key(id)),row);
     }
     for(const [id] of before.records)if(!after.records.has(id)){transaction.delete(this.records.doc(key(id)));dirty=true;}
     for(const [id,serialized] of auditChanges)transaction.set(this.audit.doc(id),JSON.parse(serialized));
     for(const [id] of before.audit)if(!after.audit.has(id)){transaction.delete(this.audit.doc(id));dirty=true;}
     if(dirty)transaction.set(this.control,{revision:revision+1,settings:after.settings,sessions:after.sessions,updatedAt:new Date().toISOString()});
     committedRevision=revision+(dirty?1:0);return response;
    });
    this.revision=committedRevision;return result;
   }catch(error){this.revision=-1;throw error;}
  });
  this.queue=work.catch(()=>{});return work;
 }
}
