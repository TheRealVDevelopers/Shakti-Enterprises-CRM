import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createRequire} from 'node:module';
import {mkdirSync,mkdtempSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {Engine} from '../lib/engine.mjs';
import {captureRuntime} from '../lib/firestore-bridge.mjs';

const project=process.env.GCLOUD_PROJECT||'demo-shakthi-parity';
assert.ok(project.startsWith('demo-'),'This check must never target a real Firebase project');
assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^127\.0\.0\.1:/,'A local Firestore emulator is required');
const root=resolve(import.meta.dirname,'..'),require=createRequire(new URL('../functions/package.json',import.meta.url));
const {initializeApp}=require('firebase-admin/app'),{getFirestore}=require('firebase-admin/firestore');
const database=getFirestore(initializeApp({projectId:project}),'shakthi-crm');
const engine=new Engine();engine.seed();const initial=captureRuntime(engine,new Map()),batch=database.batch();
for(const [id,row] of initial.records)batch.set(database.collection('crmRecords').doc(Buffer.from(id).toString('base64url')),JSON.parse(row));
for(const [id,row] of initial.audit)batch.set(database.collection('crmAudit').doc(id),JSON.parse(row));
batch.set(database.collection('crmRuntime').doc('control'),{revision:1,settings:initial.settings,sessions:'[]'});
const catalogue=existsSync(join(root,'private/product-catalogue.json'))?JSON.parse(readFileSync(join(root,'private/product-catalogue.json'),'utf8')):{families:[{id:'test-family',name:'Test family',image:'/assets/products/side-baffle.png',variants:[{size:'20 MM',units:['all'],prices:[{value:'3.50'}]}]}]};
batch.set(database.collection('crmCatalogue').doc('reference'),{json:JSON.stringify(catalogue)});
await batch.commit();engine.db.close();
mkdirSync(join(root,'tmp'),{recursive:true});
const password='isolated-parity-owner-test-12345',workerPassword='isolated-worker-test-12345';
let child,base,cookie='',checks=0;
async function start(){
 const directory=mkdtempSync(join(root,'tmp','cloud-parity-'));
 child=spawn(process.execPath,['scripts/firebase-parity-host.mjs'],{cwd:root,env:{...process.env,GCLOUD_PROJECT:project,FIREBASE_CONFIG:JSON.stringify({projectId:project}),SHAKTHI_ADMIN_PASSWORD:password,CRM_EMULATOR_DATA_DIR:directory,CRM_USERS:JSON.stringify([{id:'demo-operator',name:'Isolated operator',role:'operator',unit:'Unit 1',password:workerPassword}])},stdio:['ignore','pipe','pipe']});
 base=await new Promise((resolve,reject)=>{
  let output='';const timer=setTimeout(()=>reject(Error('Isolated API startup timed out')),30000);
  child.stdout.on('data',data=>{output+=data;const match=output.match(/PARITY_API_URL=(http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  child.stderr.on('data',data=>{const text=String(data);if(!text.includes('ExperimentalWarning')&&!text.includes('trace-warnings'))process.stderr.write(text);});
  child.once('error',reject);child.once('exit',code=>{if(code){clearTimeout(timer);reject(Error('Isolated API exited '+code));}});
 });
}
async function stop(){if(child&&!child.killed){const exited=once(child,'exit');child.kill();await exited;}}
async function request(path,body,session=cookie,origin='https://shakthi-enterprises-2df21.web.app'){
 const response=await fetch(base+path,{method:body?'POST':'GET',headers:{...(session?{Cookie:session}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},body:body?JSON.stringify(body):undefined});
 const bytes=Buffer.from(await response.arrayBuffer()),json=response.headers.get('content-type')?.includes('json')?JSON.parse(bytes):null;
 return {response,bytes,json,status:response.status};
}
async function ok(path,body,session=cookie){const result=await request(path,body,session);assert.equal(result.status,200,path+': '+(result.json?.error||result.status));checks++;return result.json;}
const act=(action,body)=>ok('/api/actions/'+action,body);
try{
 await start();assert.equal((await request('/api/state')).status,401);
 const login=await request('/api/login',{username:'admin',password});assert.equal(login.status,200);cookie=login.response.headers.get('set-cookie').split(';')[0];assert.ok(cookie.startsWith('__session='));
 let state=await ok('/api/state');assert.equal(state.productCatalogue.length,catalogue.families.length);
 const worker=await request('/api/login',{username:'demo-operator',password:workerPassword});assert.equal(worker.status,200);const workerCookie=worker.response.headers.get('set-cookie').split(';')[0];
 assert.equal((await request('/api/actions/receipt',{amount:100},workerCookie)).status,403);
 assert.equal((await request('/api/actions/settings',{},cookie,'https://untrusted.invalid')).status,403);
 const plan=await ok('/api/plan?order=demo-order');assert.equal(plan.free,2000);assert.equal(plan.material.kg,229.51);
 await act('reserve',{order:'demo-order'});
 const job=await act('schedule',{order:'demo-order',machine:'U1-M02',mould:'demo-mould',qty:8000,start:'2030-02-01T08:00:00Z',end:'2030-02-03T08:00:00Z',compatibilityReviewed:true,staff:'demo-operator'});
 const purchase=await ok('/api/records/purchases',{code:'PARITY-PURCHASE',name:'Isolated shortage top-up',unit:'Unit 1',material:'demo-material',qty:70,expected:'2030-02-01'});
 await act('purchaseApprove',{purchase:purchase.id});await act('purchaseReceive',{purchase:purchase.id,qty:70,batch:'PARITY-TOP-UP'});
 state=await ok('/api/state');const material=state.materials.find(item=>item.batch==='PARITY-TOP-UP');
 await act('acceptMaterial',{material:material.id,reference:'PARITY-QC'});
 await act('issueMaterial',{job:job.id,material:'demo-material',qty:160});await act('issueMaterial',{job:job.id,material:material.id,qty:69.51});
 const production=await ok('/api/actions/production',{job:job.id,date:'2030-02-02',total:8164,rejects:164,reason:'Isolated startup verification',shots:4082,runMinutes:2041},workerCookie);
 await act('quality',{production:production.id,accepted:8000,reference:'PARITY-FINAL-QC'});
 await act('closeJob',{job:job.id,outputKg:204.1,regrindKg:20.41,lossKg:5,reason:'Isolated mass reconciliation'});
 await act('reserve',{order:'demo-order'});
 const dispatch=await act('dispatch',{order:'demo-order',qty:6000,date:'2030-02-04',vehicle:'ISOLATED TEST',address:'Test destination'});
 await act('settings',{taxConfirmed:true,taxRate:0});state=await ok('/api/state');const invoice=state.invoices.find(item=>item.dispatch===dispatch.id);
 await act('issueInvoice',{invoice:invoice.id,date:'2030-02-04'});
 await act('receipt',{client:'demo-client',amount:30000,date:'2030-02-05',reference:'PARITY-PAYMENT',allocations:[{invoice:invoice.id,amount:30000}]});
 state=await ok('/api/state');assert.equal(state.invoices.find(item=>item.id===invoice.id).balance,42000);
 const note=await ok('/api/workspace/notes',{title:'Isolated handover',body:'Persistence verification',unit:'Unit 1'});
 await ok('/api/workspace/notes',{...note,body:'Updated handover'});assert.equal((await request('/api/workspace/notes',{...note,body:'Stale update'})).status,409);
 const photo=readFileSync(join(root,'public/assets/products/terminal-cap.png'));
 const attachment=await ok('/api/attachments',{name:'isolated-product.png',type:'staff',record:'demo-operator',photo:true,content:photo.toString('base64')});
 const image=await request('/api/attachments/'+attachment.id+'?view=1');assert.equal(image.status,200);assert.equal(image.response.headers.get('content-type'),'image/png');assert.ok(image.bytes.equals(photo));
 assert.equal((await request('/api/attachments/does-not-exist')).status,404);
 const other=await ok('/api/records/staff',{code:'PARITY-OTHER',name:'Isolated other operations',unit:'Unit 2'});
 const otherAttachment=await ok('/api/attachments',{name:'isolated.csv',type:'staff',record:other.id,content:Buffer.from('test').toString('base64')});
 assert.equal((await request('/api/attachments/'+otherAttachment.id,undefined,workerCookie)).status,403);
 const taskOrder=await ok('/api/records/orders',{code:'PARITY-TASK-ORDER',client:'demo-client',component:'demo-component',qty:500,rate:1,unit:'Unit 1',owner:'company',due:'2030-02-10'});
 const now=Date.now();const task=await ok('/api/workspace/tasks',{title:'Isolated approved schedule',unit:'Unit 1',due:new Date(now-1000).toISOString(),automation:'schedule',approved:true,payload:{order:taskOrder.id,machine:'U1-M02',mould:'demo-mould',qty:500,setupHours:.5,start:new Date(now+300000).toISOString(),end:new Date(now+172800000).toISOString(),compatibilityReviewed:true}});
 await ok('/_parity/tick',{});state=await ok('/api/state');const scheduled=state.tasks.find(item=>item.id===task.id);assert.equal(scheduled.status,'in progress');assert.ok(scheduled.job);
 await ok('/_parity/tick',{});assert.equal((await ok('/api/state')).tasks.find(item=>item.id===task.id).job,scheduled.job);
 const backup=await ok('/api/backup');assert.equal(backup.productCatalogue.families.length,catalogue.families.length);assert.equal(backup.attachments[attachment.id],photo.toString('base64'));
 await stop();await start();
 state=await ok('/api/state');assert.equal(state.invoices.find(item=>item.id===invoice.id).balance,42000);assert.ok(state.notes.some(item=>item.id===note.id));
 const coldImage=await request('/api/attachments/'+attachment.id+'?view=1');assert.equal(coldImage.status,200);assert.ok(coldImage.bytes.equals(photo));
 await ok('/api/logout',{});assert.equal((await request('/api/state')).status,401);
 console.log(`Cloud parity passed: ${checks} successful API checks plus permissions, stale-write rejection, scheduling idempotency and fresh-instance persistence. Production data was not accessed.`);
 if(process.argv.includes('--keep-open')){
  console.log('PARITY_TEST_UI='+base);console.log('Isolated UI login: admin / '+password);
  await new Promise(resolve=>process.once('SIGINT',resolve));
 }
}finally{await stop();await database.terminate();}
