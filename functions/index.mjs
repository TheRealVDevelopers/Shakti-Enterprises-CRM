import {onRequest} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {defineSecret} from 'firebase-functions/params';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import http from 'node:http';
import {mkdirSync,writeFileSync} from 'node:fs';

const firebaseApp=initializeApp();
const adminPassword=defineSecret('SHAKTHI_ADMIN_PASSWORD');
const options={region:'asia-south1',memory:'1GiB',timeoutSeconds:120,maxInstances:1,concurrency:1,secrets:[adminPassword]};
let runtime;
async function ready(){
 if(!runtime)runtime=(async()=>{
  Object.assign(process.env,{NODE_ENV:'production',HOST:'127.0.0.1',PORT:'0',DATA_DIR:'/tmp/shakthi-crm',SECURE_COOKIES:'1',SESSION_COOKIE:'__session',FIRESTORE_BACKED:'1',ADMIN_PASSWORD:adminPassword.value()});
  const database=getFirestore(firebaseApp,'shakthi-crm');
  const catalogue=await database.collection('crmCatalogue').doc('reference').get();
  mkdirSync(process.env.DATA_DIR,{recursive:true});
  process.env.PRODUCT_CATALOGUE_FILE=process.env.DATA_DIR+'/catalogue.json';
  writeFileSync(process.env.PRODUCT_CATALOGUE_FILE,catalogue.exists?catalogue.data().json:JSON.stringify({families:[]}));
  const application=await import('./runtime/server.mjs');
  if(!application.server.listening)await new Promise(resolve=>application.server.once('listening',resolve));
  const {FirestoreBridge}=await import('./runtime/lib/firestore-bridge.mjs');
  return {...application,bridge:new FirestoreBridge(database,application.engine,application.sessions,process.env.DATA_DIR)};
 })();
 return runtime;
}

function forward(runtime,request){
 return new Promise((resolve,reject)=>{
  const headers={...request.headers,host:'shakthi-enterprises-2df21.web.app'};
  const origin=headers.origin;
  if(origin==='https://shakthi-enterprises-2df21.firebaseapp.com')headers.host='shakthi-enterprises-2df21.firebaseapp.com';
  delete headers['content-length'];delete headers['transfer-encoding'];delete headers.connection;
  const outgoing=http.request({host:'127.0.0.1',port:runtime.server.address().port,path:request.originalUrl||request.url,method:request.method,headers},incoming=>{
   const parts=[];incoming.on('data',part=>parts.push(part));incoming.on('end',()=>resolve({status:incoming.statusCode,headers:incoming.headers,body:Buffer.concat(parts)}));incoming.on('error',reject);
  });
  outgoing.on('error',reject);outgoing.end(request.rawBody);
 });
}

export const crmApi=onRequest({...options,invoker:'public'},async(request,response)=>{
 try{
  const application=await ready();
  const result=await application.bridge.run(async helpers=>{
   const path=(request.originalUrl||request.url).split('?')[0];
   const token=/__session=([a-f0-9]+)/.exec(request.headers.cookie||'')?.[1];
   const session=application.sessions.get(token),valid=session?.expires>Date.now();
   if(valid&&path.startsWith('/api/attachments/'))await helpers.download(path.split('/').at(-1));
   if(valid&&session.actor.role==='admin'&&path==='/api/backup')for(const file of application.engine.all('attachments'))await helpers.download(file.id);
   return forward(application,request);
  });
  for(const [name,value] of Object.entries(result.headers))if(!['connection','transfer-encoding','content-length','date'].includes(name)&&value!==undefined)response.setHeader(name,value);
  response.setHeader('Cache-Control','private, no-store');response.status(result.status).send(result.body);
 }catch(error){console.error('CRM request failed',error.code||error.name);response.status(503).json({error:'The workspace is temporarily unavailable. Please retry shortly.'});}
});

export const crmTaskRunner=onSchedule({...options,schedule:'every 1 minutes',timeZone:'Asia/Kolkata'},async()=>{
 const application=await ready();await application.bridge.run(async()=>{application.workspace.runDue();return {status:200};});
});
