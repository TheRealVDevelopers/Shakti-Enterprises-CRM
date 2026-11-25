import {cpSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),destination=resolve(root,'functions/runtime');
mkdirSync(resolve(destination,'public'),{recursive:true});
cpSync(resolve(root,'server.mjs'),resolve(destination,'server.mjs'));
cpSync(resolve(root,'lib'),resolve(destination,'lib'),{recursive:true});
for(const name of ['crm-routing.js','404.html'])cpSync(resolve(root,'public',name),resolve(destination,'public',name));
if(existsSync(resolve(root,'private/product-catalogue.json'))){mkdirSync(resolve(destination,'private'),{recursive:true});cpSync(resolve(root,'private/product-catalogue.json'),resolve(destination,'private/product-catalogue.json'));}
console.log('Prepared CRM function source. Local databases, sessions and uploads are excluded.');
