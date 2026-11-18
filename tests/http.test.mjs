import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import {parseHTML} from 'linkedom';
import {workspaceRoutes} from '../public/crm-routing.js';
import {tmpdir} from 'node:os';
test('HTTP authentication, permissions, CSRF, sessions and static routes',async t=>{
 const child=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:'0',DATA_DIR:mkdtempSync(join(tmpdir(),'shakthi-http-')),ADMIN_PASSWORD:'test-owner-secret-12345',CRM_USERS:JSON.stringify([{id:'op1',name:'Operator',role:'operator',unit:'Unit 1',password:'test-operator-secret-12345'}])},stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill());
 const base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server startup timeout')),15000);child.stdout.on('data',d=>{const m=String(d).match(/http:\/\/127.0.0.1:\d+/);if(m){clearTimeout(timeout);resolve(m[0]);}});child.on('error',reject);child.on('exit',code=>{if(code)reject(Error('Server exited '+code));});});
 const request=async(path,body,cookie,origin)=>{const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0],body:r.headers.get('content-type')?.includes('json')?await r.json():await r.text()};};
 await t.test('API records require a session',async()=>assert.equal((await request('/api/state')).status,401));
 await t.test('business mode cannot sign in with a demo role',async()=>assert.equal((await request('/api/login',{role:'admin',password:'shakthi-demo'})).status,401));
 const admin=await request('/api/login',{username:'admin',password:'test-owner-secret-12345'});assert.equal(admin.status,200);assert.ok(admin.cookie);
 const op=await request('/api/login',{username:'op1',password:'test-operator-secret-12345',role:'admin',unit:'all'});assert.equal(op.status,200);assert.equal(op.body.actor.role,'operator');assert.equal(op.body.actor.unit,'Unit 1');
 await t.test('server ignores submitted role escalation',async()=>{const s=await request('/api/state',null,op.cookie);assert.equal(s.body.actor.role,'operator');assert.equal(s.body.invoices,undefined);});
 await t.test('operator cannot write accounting records',async()=>assert.equal((await request('/api/actions/receipt',{amount:1},op.cookie)).status,403));
 await t.test('cross-origin mutation fails',async()=>assert.equal((await request('/api/actions/settings',{currency:'USD'},admin.cookie,'https://external.invalid')).status,403));
 await t.test('admin backup contains all registers and audit',async()=>{const b=await request('/api/backup',null,admin.cookie);assert.equal(b.status,200);assert.equal(b.body.format,1);assert.ok(Array.isArray(b.body.records.orders));});
 await t.test('operator cannot download full backup',async()=>assert.equal((await request('/api/backup',null,op.cookie)).status,403));
 await t.test('website, CRM and original catalogue routes serve',async()=>{for(const path of ['/','/crm','/about','/infrastructure','/catalogue'])assert.equal((await request(path)).status,200);});
 await t.test('every linked page, script, stylesheet, image, font and local module responds correctly',async()=>{
  const targets=new Set(),root=resolve('public');
  for(const name of readdirSync(root).filter(n=>n.endsWith('.html'))){const {document}=parseHTML(readFileSync(join(root,name),'utf8'));const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length,name+' has duplicate section IDs');
   targets.add('/'+name);for(const el of document.querySelectorAll('[href],[src]')){const raw=el.getAttribute(el.hasAttribute('href')?'href':'src');if(!raw||/^(https?:|tel:|mailto:|data:)/.test(raw))continue;const url=new URL(raw,base+'/'+name);targets.add(url.pathname+url.search);if(url.hash&&url.pathname!=='/crm'&&url.pathname!=='/crm.html'){const filename=join(root,url.pathname==='/'?'index.html':extname(url.pathname)?url.pathname:url.pathname+'.html');const target=parseHTML(readFileSync(filename,'utf8')).document;assert.ok(target.getElementById(decodeURIComponent(url.hash.slice(1))),name+' links to missing section '+raw);}}
  }
  for(const name of readdirSync(root).filter(n=>n.endsWith('.css')||n.endsWith('.js'))){const content=readFileSync(join(root,name),'utf8');for(const match of content.matchAll(name.endsWith('.css')?/url\(['"]?([^)'"\s]+)['"]?\)/g:/(?:from\s*|import\(\s*)['"]([^'"]+)['"]/g)){const raw=match[1];if(raw.startsWith('data:')||raw.startsWith('http'))continue;targets.add(new URL(raw,base+'/'+name).pathname);}}
  for(const path of targets){const response=await fetch(base+path);assert.equal(response.status,200,path+' failed');const type=response.headers.get('content-type')||'';if(/\.js$/.test(path))assert.match(type,/javascript/,path);if(/\.css(?:\?|$)/.test(path))assert.match(type,/css/,path);await response.arrayBuffer();}
  assert.ok(targets.size>70,'Expected the complete website asset graph');
 });
 await t.test('trailing slash and conventional dashboard URLs redirect to the intended page',async()=>{
  for(const [path,target] of [['/about/','/about'],['/crm/?view=review','/crm?view=review'],['/index.html','/'],['/dashboard','/crm#overview'],['/overview','/crm#overview'],...workspaceRoutes.map(route=>['/crm/'+route,'/crm#'+route])]){const response=await fetch(base+path,{redirect:'manual'});assert.equal(response.status,308,path);assert.equal(response.headers.get('location'),target,path);}
  const repeated=await fetch(base+'//about/',{redirect:'manual'});assert.equal(repeated.headers.get('location'),'/about/');
 });
 await t.test('unknown paths remain a recoverable 404 and malformed paths do not crash the server',async()=>{assert.equal((await request('/no-such-page')).status,404);assert.equal((await request('/crm/no-such-module')).status,404);const response=await fetch(base+'/%5c%5cexternal.invalid/');assert.equal(response.status,400);assert.equal((await request('/')).status,200);});
 await t.test('private notes and task endpoints enforce operations and author boundaries',async()=>{
  const note=await request('/api/workspace/notes',{title:'Private operator handover',body:'Keep this in tooling.'},op.cookie);assert.equal(note.status,200);assert.equal(note.body.unit,'Unit 1');
  const state=await request('/api/state',null,op.cookie);assert.ok(state.body.notes.some(n=>n.id===note.body.id));
  const task=await request('/api/workspace/tasks',{title:'Review drawing',due:'2030-01-01T09:00:00+05:30',unit:'Unit 2'},op.cookie);assert.equal(task.status,200);assert.equal(task.body.unit,'Unit 1');
  assert.equal((await request('/api/workspace/tasks',{title:'No time'},op.cookie)).status,400);
  assert.equal((await request('/api/workspace/notes',{id:note.body.id,version:0,title:'Stale'},op.cookie)).status,409);
 });
 await t.test('record photos upload, render with authenticated image MIME, and respect operation boundaries',async()=>{
  const machine=await request('/api/records/machines',{code:'PHOTO-M',name:'Photo machine',unit:'Unit 2',tonnes:180},admin.cookie);assert.equal(machine.status,200);
  const content='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0YoAAAAASUVORK5CYII=';
  const photo=await request('/api/attachments',{name:'machine.png',type:'machines',record:machine.body.id,photo:true,content},admin.cookie);assert.equal(photo.status,200);assert.equal(photo.body.photo,true);assert.equal(photo.body.unit,'Unit 2');
  const r=await fetch(base+'/api/attachments/'+photo.body.id+'?view=1',{headers:{Cookie:admin.cookie}});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');assert.match(r.headers.get('content-disposition'),/^inline/);await r.arrayBuffer();
  assert.equal((await request('/api/attachments/'+photo.body.id+'?view=1')).status,401);
  assert.equal((await request('/api/attachments/'+photo.body.id+'?view=1',null,op.cookie)).status,403);
  const fake=await request('/api/attachments',{name:'fake.png',type:'machines',record:machine.body.id,photo:true,content:Buffer.from('<svg/>').toString('base64')},admin.cookie);assert.equal(fake.status,400);
  const download=await fetch(base+'/api/attachments/'+photo.body.id,{headers:{Cookie:admin.cookie}});assert.match(download.headers.get('content-disposition'),/^attachment/);await download.arrayBuffer();
 });
 await t.test('logout invalidates the server session',async()=>{await request('/api/logout',{},op.cookie);assert.equal((await request('/api/state',null,op.cookie)).status,401);});
});
