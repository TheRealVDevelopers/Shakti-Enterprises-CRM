import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {Engine,types} from '../lib/engine.mjs';
const [file,destination]=process.argv.slice(2);
if(!file)throw Error('Usage: node scripts/restore.mjs <backup.json> [fresh-data-directory]. Omit destination for verification only.');
const backup=JSON.parse(readFileSync(resolve(file),'utf8'));
if(backup.format!==1||!backup.records||!backup.settings||!Array.isArray(backup.audit))throw Error('Invalid backup format');
const ids=new Set();
for(const type of types){if(!Array.isArray(backup.records[type]))throw Error('Missing register: '+type);for(const r of backup.records[type]){if(typeof r.id!=='string'||!r.id||ids.has(r.id))throw Error('Missing / duplicate record ID');ids.add(r.id);if(typeof r.version!=='number')throw Error('Invalid record version');}}
for(const f of backup.records.attachments){if(!/^[a-f0-9]{40}$/.test(f.id)||typeof backup.attachments?.[f.id]!=='string')throw Error('Invalid or missing attachment');if(Buffer.from(backup.attachments[f.id],'base64').length!==f.size)throw Error('Attachment size mismatch');}
console.log('Verified backup:',Object.fromEntries(types.map(t=>[t,backup.records[t].length])));
if(destination){const target=resolve(destination);if(existsSync(target))throw Error('Restore requires a NEW directory. Existing data is never overwritten.');mkdirSync(join(target,'uploads'),{recursive:true});const e=new Engine(join(target,'crm.sqlite'));e.transaction(()=>{for(const type of types)for(const r of backup.records[type])e.db.prepare('INSERT INTO records VALUES(?,?,?)').run(type,r.id,JSON.stringify(r));e.db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(backup.settings));for(const a of backup.audit)e.db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?,?)').run(a.id,a.at,a.actor,a.unit,a.action,a.record,a.before_data,a.after_data);});for(const f of backup.records.attachments)writeFileSync(join(target,'uploads',f.id),Buffer.from(backup.attachments[f.id],'base64'));for(const t of types)if(e.all(t).length!==backup.records[t].length)throw Error('Restore count mismatch: '+t);e.db.close();console.log('Restored and count-verified:',target);}
