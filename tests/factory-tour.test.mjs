import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

test('factory tour scroll bridge seeks rooms, rejects unrelated messages and exits into company content',()=>{
 const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 const frame=document.querySelector('#factory-tour'),shell=document.querySelector('#journey');
 const posts=[],scrolls=[];const child={postMessage:(...args)=>posts.push(args)};
 Object.defineProperty(frame,'contentWindow',{value:child});Object.defineProperty(shell,'offsetHeight',{value:31000});shell.getBoundingClientRect=()=>({top:-1000,bottom:30000});
 let finished=false;document.querySelector('#capabilities').scrollIntoView=()=>finished=true;
 window.scrollTo=options=>scrolls.push(options);window.scrollBy=options=>scrolls.push(options);
 const origin='http://127.0.0.1:4173';
 vm.runInNewContext(readFileSync(new URL('../public/factory-tour-home.js',import.meta.url),'utf8'),{document,window,location:{origin},innerHeight:1000,scrollY:1000,addEventListener:window.addEventListener.bind(window),requestAnimationFrame:fn=>fn()});
 assert.equal(posts.at(-1)[0].progress,1/30);
 function message(data,source=child,sender=origin){const event=new window.Event('message');Object.assign(event,{data,source,origin:sender});window.dispatchEvent(event);}
 message({type:'factory-go',progress:.5,smooth:true});assert.equal(scrolls.at(-1).top,15000);assert.equal(scrolls.at(-1).behavior,'smooth');
 const count=scrolls.length;message({type:'factory-go',progress:1},{},origin);message({type:'factory-go',progress:1},child,'https://unrelated.invalid');message({type:'factory-go',progress:NaN});assert.equal(scrolls.length,count);
 message({type:'factory-wheel',delta:500});assert.equal(scrolls.at(-1).top,500);
 message({type:'factory-finish'});assert.equal(finished,true);
});
