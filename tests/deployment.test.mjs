import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';

for(const config of [{name:'production',NODE_ENV:'production',HOST:'127.0.0.1'},{name:'public listener',NODE_ENV:'development',HOST:'0.0.0.0'}]){
 test(`${config.name} refuses demo access before creating a database`,async()=>{
  const data=mkdtempSync(join(tmpdir(),'shakthi-deploy-refuse-'));
  const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,...config,ADMIN_PASSWORD:'',DATA_DIR:data,PORT:'0'},stdio:['ignore','pipe','pipe']});
  let error='';child.stderr.on('data',chunk=>error+=chunk);const[code]=await once(child,'exit');
  assert.notEqual(code,0);assert.match(error,/ADMIN_PASSWORD is required/);assert.equal(existsSync(join(data,'crm.sqlite')),false);
 });
}

test('production serves website and CRM together and persists records across restart',async t=>{
 const data=mkdtempSync(join(tmpdir(),'shakthi-deploy-persist-')),password=randomBytes(24).toString('hex');let child;
 t.after(()=>child?.kill());
 async function start(){
  child=spawn(process.execPath,['server.mjs'],{env:{...process.env,NODE_ENV:'production',HOST:'0.0.0.0',PORT:'0',DATA_DIR:data,ADMIN_PASSWORD:password,SECURE_COOKIES:'1',CRM_USERS:''},stdio:['ignore','pipe','pipe']});
  return await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error('Production startup timeout')),15000);child.stdout.on('data',chunk=>{log+=chunk;const match=log.match(/http:\/\/0\.0\.0\.0:(\d+)/);if(match){clearTimeout(timeout);resolve(`http://127.0.0.1:${match[1]}`);}});child.once('error',error=>{clearTimeout(timeout);reject(error);});child.once('exit',code=>{if(code){clearTimeout(timeout);reject(Error('Production server exited'));}});});
 }
 let base=await start();
 async function login(){const response=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password})});assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/Secure/);return response.headers.get('set-cookie').split(';')[0];}
 assert.deepEqual(await(await fetch(base+'/healthz')).json(),{ok:true});assert.equal((await(await fetch(base+'/api/config')).json()).demo,false);
 for(const route of ['/','/crm','/catalogue'])assert.equal((await fetch(base+route)).status,200);
 assert.equal((await fetch(base+'/api/state')).status,401);let cookie=await login();
 const created=await fetch(base+'/api/records/clients',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({code:'HOST-TEST',name:'Persistent deployment test'})});assert.equal(created.status,200);
 const exited=once(child,'exit');child.kill();await exited;base=await start();
 assert.equal((await fetch(base+'/api/state',{headers:{Cookie:cookie}})).status,401);
 cookie=await login();const state=await(await fetch(base+'/api/state',{headers:{Cookie:cookie}})).json();assert.ok(state.clients.some(client=>client.code==='HOST-TEST'));assert.equal(state.clients.some(client=>client.id==='demo-client'),false);
});
