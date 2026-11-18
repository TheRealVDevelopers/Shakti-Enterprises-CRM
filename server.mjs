import http from 'node:http';
import { readFileSync,writeFileSync,mkdirSync,existsSync,statSync } from 'node:fs';
import { resolve,extname,join } from 'node:path';
import { randomBytes,scryptSync,timingSafeEqual } from 'node:crypto';
import {fileURLToPath} from 'node:url';
import { Engine,roles,types } from './lib/engine.mjs';
import {Workspace,unitNames,detectPhoto} from './lib/workspace.mjs';
import {canonicalPagePath} from './public/crm-routing.js';

const projectRoot=fileURLToPath(new URL('.',import.meta.url));
const root=resolve(projectRoot,'public'),data=resolve(process.env.DATA_DIR || resolve(projectRoot,'data'));mkdirSync(data,{recursive:true});mkdirSync(join(data,'uploads'),{recursive:true});
export const engine=new Engine(join(data,'crm.sqlite'));
const demo=!process.env.ADMIN_PASSWORD;
if(demo)engine.seed();
const workspace=new Workspace(engine);
const scheduler=setInterval(()=>workspace.runDue(),30000);scheduler.unref();
const sessions=new Map(),attempts=new Map();
const password=process.env.ADMIN_PASSWORD || 'shakthi-demo';
if(!demo&&password.length<14)throw new Error('ADMIN_PASSWORD must have at least 14 characters');
const salt=randomBytes(16),hash=scryptSync(password,salt,64);
const users=process.env.CRM_USERS?JSON.parse(process.env.CRM_USERS):[];
for(const u of users){if(!roles[u.role]||u.role==='admin'||!['Unit 1','Unit 2','all'].includes(u.unit)||!u.password||u.password.length<14)throw new Error('CRM_USERS requires named non-admin users with a valid role, unit and password of 14+ characters');u.salt=randomBytes(16);u.hash=scryptSync(u.password,u.salt,64);delete u.password;}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.ttf':'font/ttf','.pdf':'application/pdf'};
function send(res,status,body,type='application/json'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(body):body);}
async function body(req){let s='';for await(const chunk of req){s+=chunk;if(s.length>8_000_000){const e=new Error('Upload exceeds 8 MB request limit');e.status=413;throw e;}}return s?JSON.parse(s):{};}
function actor(req){const token=/crm_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1],session=sessions.get(token);if(!session||session.expires<Date.now()){const e=new Error('Sign in required');e.status=401;throw e;}return session.actor;}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try{
    const url=new URL(req.url.startsWith('/')?'http://localhost'+req.url:req.url,'http://localhost');
    if(url.pathname.startsWith('/api/')){
      if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(res,403,{error:'Cross-origin requests denied'});
      if(url.pathname==='/api/config')return send(res,200,{demo,roles:Object.keys(roles),unitNames});
      if(url.pathname==='/api/login'&&req.method==='POST'){
        const b=await body(req),key=req.socket.remoteAddress,rate=attempts.get(key)||{count:0,time:Date.now()};if(Date.now()-rate.time>60000){rate.count=0;rate.time=Date.now();}attempts.set(key,rate);if(++rate.count>15)return send(res,429,{error:'Too many attempts. Try again in a minute.'});
        let a,valid=false;
        if(demo){valid=timingSafeEqual(scryptSync(String(b.password || ''),salt,64),hash)&&!!roles[b.role];a={id:b.role==='operator'?'demo-operator':`demo-${b.role}`,name:`Demo ${b.role}`,role:b.role,unit:b.role==='admin'||b.role==='accounts'?'all':b.unit==='Unit 2'?'Unit 2':'Unit 1'};}
        else if(b.username==='admin'){valid=timingSafeEqual(scryptSync(String(b.password || ''),salt,64),hash);a={id:'admin',name:'Owner',role:'admin',unit:'all'};}
        else{const u=users.find(u=>u.id===b.username);if(u){valid=timingSafeEqual(scryptSync(String(b.password || ''),u.salt,64),u.hash);a={id:u.id,name:u.name,role:u.role,unit:u.unit};}}
        if(!valid)return send(res,401,{error:'Invalid sign-in details'});
        const token=randomBytes(32).toString('hex');sessions.set(token,{actor:a,expires:Date.now()+8*3600000});res.setHeader('Set-Cookie',`crm_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.SECURE_COOKIES==='1'?'; Secure':''}`);return send(res,200,{actor:a,demo});
      }
      const a=actor(req);
      if(url.pathname==='/api/logout'){const t=/crm_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];sessions.delete(t);res.setHeader('Set-Cookie','crm_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(res,200,{ok:true});}
      if(url.pathname==='/api/state'){workspace.runDue();return send(res,200,{...engine.snapshot(a),...workspace.snapshot(a),unitNames,actor:a,demo});}
      if(url.pathname==='/api/workspace/status'&&req.method==='POST')return send(res,200,workspace.status(await body(req),a));
      if(url.pathname.startsWith('/api/workspace/')&&req.method==='POST')return send(res,200,workspace.save(url.pathname.split('/').at(-1),await body(req),a));
      if(url.pathname==='/api/plan') {engine.allowed(a,'plan');return send(res,200,engine.plan(url.searchParams.get('order'),a));}
      if(url.pathname.startsWith('/api/records/')&&req.method==='POST')return send(res,200,engine.save(url.pathname.split('/').at(-1),await body(req),a));
      if(url.pathname.startsWith('/api/actions/')&&req.method==='POST')return send(res,200,engine.act(url.pathname.split('/').at(-1),await body(req),a));
      if(url.pathname==='/api/attachments'&&req.method==='POST'){
        const b=await body(req);if(!types.includes(b.type)||['notes','tasks','attachments'].includes(b.type))throw new Error('Invalid record type');engine.allowed(a,b.type);engine.scope(a,engine.get(b.type,b.record));
        if(!/\.(pdf|png|jpg|jpeg|webp|step|stp|csv)$/i.test(b.name))throw new Error('Allowed attachments: PDF, images, STEP and CSV');
        const bytes=Buffer.from(b.content || '','base64');if(bytes.length>5_000_000)throw new Error('Attachment limit is 5 MB');
        const photo=Boolean(b.photo);const photoMime=detectPhoto(bytes,b.name);if(photo&&(!['components','machines','staff','moulds'].includes(b.type)||!photoMime))throw new Error('Choose a valid PNG, JPEG or WebP photo for a product, machine, mould or employee');
        const id=randomBytes(20).toString('hex'),name=String(b.name).replace(/[^a-zA-Z0-9._ -]/g,'_');writeFileSync(join(data,'uploads',id),bytes);
        return send(res,200,engine.put('attachments',{id,name,type:b.type,record:b.record,size:bytes.length,photo,mime:photoMime,unit:engine.get(b.type,b.record).unit||a.unit},a,'attachment uploaded'));
      }
      if(url.pathname.startsWith('/api/attachments/')){const f=engine.get('attachments',url.pathname.split('/').at(-1));engine.scope(a,engine.get(f.type,f.record));if(['invoices','receipts','credits'].includes(f.type)&&!['admin','accounts'].includes(a.role))return send(res,403,{error:'Access denied'});const inline=url.searchParams.get('view')==='1'&&f.photo&&f.mime;res.setHeader('Content-Disposition',`${inline?'inline':'attachment'}; filename="${f.name}"`);return send(res,200,readFileSync(join(data,'uploads',f.id)),inline?f.mime:'application/octet-stream');}
      if(url.pathname==='/api/backup'){engine.allowed(a,'*');const snapshot={format:1,at:new Date().toISOString(),settings:engine.settings(),records:Object.fromEntries(types.map(t=>[t,engine.all(t)])),audit:engine.db.prepare('SELECT * FROM audit').all(),attachments:Object.fromEntries(engine.all('attachments').map(f=>[f.id,readFileSync(join(data,'uploads',f.id)).toString('base64')]))};res.setHeader('Content-Disposition','attachment; filename="shakthi-backup.json"');return send(res,200,snapshot);}
      return send(res,404,{error:'Endpoint not found'});
    }
    let pathname=decodeURIComponent(url.pathname);if(/[\\\x00-\x1f\x7f]/.test(pathname))return send(res,400,{error:'Invalid page path'});const canonical=canonicalPagePath(pathname,url.search);if(canonical){res.writeHead(308,{Location:canonical,'Cache-Control':'no-store'});return res.end();}
    if(pathname==='/')pathname='/index.html';if(!extname(pathname))pathname+='.html';const file=resolve(root,`.${pathname}`);if(!file.startsWith(root+ '\\')&&!file.startsWith(root+'/'))return send(res,403,{error:'Forbidden'});
    if(!existsSync(file)||!statSync(file).isFile())return send(res,404,readFileSync(join(root,'404.html')),'text/html');
    send(res,200,readFileSync(file),mime[extname(file).toLowerCase()] || 'application/octet-stream');
  }catch(e){send(res,e.status || 400,{error:e.message});}
});
const port=Number(process.env.PORT || 4173);
server.listen(port,'127.0.0.1',()=>console.log(`Shakthi Enterprises: http://127.0.0.1:${server.address().port}\n${demo?'DEMO MODE: illustrative data, password shakthi-demo. Set ADMIN_PASSWORD and a fresh DATA_DIR for business use.':'Business mode: sign in with configured accounts.'}`));
