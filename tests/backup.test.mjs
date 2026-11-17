import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {Engine,types} from '../lib/engine.mjs';
test('backup restores all registers, original audit and binary attachments into a fresh directory',()=>{
 const e=new Engine();e.seed();const id='a'.repeat(40),bytes=Buffer.from('Test drawing attachment');e.put('attachments',{id,name:'drawing.step',record:'demo-component',type:'components',size:bytes.length,unit:'Unit 1'});
 const backup={format:1,settings:e.settings(),records:Object.fromEntries(types.map(t=>[t,e.all(t)])),audit:e.db.prepare('SELECT * FROM audit').all(),attachments:{[id]:bytes.toString('base64')}};
 const dir=mkdtempSync(join(tmpdir(),'shakthi-backup-')),file=join(dir,'backup.json'),destination=join(dir,'restored');writeFileSync(file,JSON.stringify(backup));
 const result=spawnSync(process.execPath,['scripts/restore.mjs',file,destination],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const restored=new Engine(join(destination,'crm.sqlite'));for(const t of types)assert.equal(restored.all(t).length,e.all(t).length);assert.equal(restored.db.prepare('SELECT COUNT(*) n FROM audit').get().n,backup.audit.length);assert.equal(restored.get('attachments',id).size,bytes.length);assert.equal(restored.plan('demo-order',{id:'admin',role:'admin',unit:'all'}).material.kg,229.51);restored.db.close();
 const overwrite=spawnSync(process.execPath,['scripts/restore.mjs',file,destination],{encoding:'utf8'});assert.notEqual(overwrite.status,0);assert.match(overwrite.stderr,/NEW directory/);
});
