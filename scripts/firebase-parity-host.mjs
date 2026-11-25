// Isolated HTTP harness around the actual deployed function handlers.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
assert.ok(process.env.GCLOUD_PROJECT?.startsWith('demo-'));
assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^127\.0\.0\.1:/);
const require=createRequire(new URL('../functions/package.json',import.meta.url));
const express=require('express'),app=express();
const {crmApi,crmTaskRunner}=await import('../functions/index.mjs');
app.use(express.raw({type:()=>true,limit:'8mb'}));
app.use((request,response,next)=>{
 request.rawBody=Buffer.isBuffer(request.body)?request.body:undefined;
 // The harness substitutes the real site's same-origin header only for loopback UI requests.
 if(request.headers.origin?.startsWith('http://127.0.0.1:'))request.headers.origin='https://shakthi-enterprises-2df21.web.app';
 next();
});
app.post('/_parity/tick',async(request,response)=>{await crmTaskRunner.run();response.json({ok:true});});
app.use('/api',(request,response)=>crmApi(request,response));
app.use(express.static(resolve(import.meta.dirname,'../public'),{extensions:['html']}));
const server=app.listen(0,'127.0.0.1',()=>console.log('PARITY_API_URL=http://127.0.0.1:'+server.address().port));
process.on('SIGTERM',()=>process.exit(0));
