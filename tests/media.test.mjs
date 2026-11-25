import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {serveMovie} from '../lib/media.mjs';

test('factory movies support exact byte seeking, suffixes, HEAD and invalid ranges',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'tour-media-')),file=join(directory,'movie.mp4');
 writeFileSync(file,'0123456789');
 const server=http.createServer((req,res)=>serveMovie(req,res,file));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.close();rmSync(directory,{recursive:true,force:true});});
 const url=`http://127.0.0.1:${server.address().port}`;
 for(const [range,expected] of [['bytes=2-5','2345'],['bytes=8-','89'],['bytes=-3','789'],['bytes=7-99','789']]){
  const response=await fetch(url,{headers:{Range:range}});
  assert.equal(response.status,206);assert.equal(response.headers.get('content-type'),'video/mp4');
  assert.equal(await response.text(),expected);
 }
 for(const range of ['bytes=20-','bytes=5-2','bytes=-0','bytes=0-1,4-5','bytes=-']){
  const response=await fetch(url,{headers:{Range:range}});assert.equal(response.status,416);assert.equal(response.headers.get('content-range'),'bytes */10');
 }
 const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'10');assert.equal(await head.text(),'');
});
