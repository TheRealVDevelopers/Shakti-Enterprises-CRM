import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {Engine} from '../lib/engine.mjs';
import {FirestoreBridge} from '../lib/firestore-bridge.mjs';

function store(){
 const data=new Map();
 const collection=name=>({name,doc:id=>({path:name+'/'+id}),where:(field,operator,value)=>({name,field,value})});
 return {data,fail:false,collection,async runTransaction(callback){
  const writes=[];
  const value=await callback({get:async ref=>ref.path?{exists:data.has(ref.path),data:()=>structuredClone(data.get(ref.path))}:{docs:[...data].filter(([path,row])=>path.startsWith(ref.name+'/')&&(!ref.field||row[ref.field]===ref.value)).map(([,row])=>({data:()=>structuredClone(row)}))},set:(ref,row)=>writes.push(()=>data.set(ref.path,structuredClone(row))),delete:ref=>writes.push(()=>data.delete(ref.path))});
  if(this.fail){this.fail=false;throw Error('Simulated commit failure');}for(const write of writes)write();return value;
 }};
}
function runtime(t,db){
 const directory=mkdtempSync(join(tmpdir(),'shakthi-firestore-')),engine=new Engine(),sessions=new Map();
 t.after(()=>{engine.db.close();rmSync(directory,{recursive:true,force:true});});
 return {engine,sessions,directory,bridge:new FirestoreBridge(db,engine,sessions,directory)};
}

test('records, settings, audit and sessions survive a fresh backend instance',async t=>{
 const db=store(),first=runtime(t,db);
 await first.bridge.run(async()=>{
  first.engine.put('components',{id:'part-1',code:'P-1',name:'Approved part'});
  first.engine.db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify({currency:'INR',taxConfirmed:true}));
  first.sessions.set('token',{actor:{id:'owner',role:'admin',unit:'all'},expires:Date.now()+60000});return {status:200};
 });
 const second=runtime(t,db);
 await second.bridge.run(async()=>{assert.equal(second.engine.get('components','part-1').name,'Approved part');assert.equal(second.engine.settings().taxConfirmed,true);assert.equal(second.sessions.get('token').actor.role,'admin');assert.equal(second.engine.db.prepare('SELECT COUNT(*) AS n FROM audit').get().n,1);return {status:200};});
});

test('failed commits and failed actions cannot leak uncommitted records into later requests',async t=>{
 const db=store(),app=runtime(t,db);
 await app.bridge.run(async()=>({status:200}));
 db.fail=true;
 await assert.rejects(app.bridge.run(async()=>{app.engine.put('components',{id:'failed',name:'Not committed'});return {status:200};}),/commit failure/);
 await app.bridge.run(async()=>{assert.throws(()=>app.engine.get('components','failed'));app.engine.put('components',{id:'rejected',name:'Rejected action'});return {status:400};});
 await app.bridge.run(async()=>{assert.throws(()=>app.engine.get('components','rejected'));return {status:200};});
});

test('private uploaded files persist in bounded chunks and survive cold starts',async t=>{
 const db=store(),first=runtime(t,db),bytes=Buffer.alloc(1_100_000,47),id='upload-123';
 mkdirSync(join(first.directory,'uploads'));writeFileSync(join(first.directory,'uploads',id),bytes);
 await first.bridge.run(async()=>{first.engine.put('attachments',{id,name:'product.png',type:'components',record:'part-1',photo:true});return {status:200};});
 assert.ok([...db.data].filter(([path])=>path.startsWith('crmFiles/')).every(([,row])=>row.content.length<700000));
 const second=runtime(t,db);
 await second.bridge.run(async helpers=>{await helpers.download(id);assert.deepEqual(readFileSync(join(second.directory,'uploads',id)),bytes);return {status:200};});
});

test('overlapping revisions reload canonical state instead of overwriting another instance',async t=>{
 const db=store(),first=runtime(t,db),second=runtime(t,db);
 await first.bridge.run(async()=>{first.engine.put('components',{id:'one',name:'First'});return {status:200};});
 await second.bridge.run(async()=>{second.engine.put('components',{id:'two',name:'Second'});return {status:200};});
 await first.bridge.run(async()=>{assert.equal(first.engine.all('components').length,2);return {status:200};});
});
