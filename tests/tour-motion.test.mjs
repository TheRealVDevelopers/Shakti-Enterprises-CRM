import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../public/factory-tour/tour-motion.js',import.meta.url),'utf8'),context);
const smooth=context.smoothTourStory;
test('tour easing converges in both directions without overshoot',()=>{
 for(const [from,to] of [[0,60],[60,0]]){
  let value=from;
  for(let frame=0;frame<100;frame++){
   const next=smooth(value,to,16,false);assert.ok(next>=Math.min(value,to)&&next<=Math.max(value,to));value=next;
  }
  assert.equal(value,to);
 }
});
test('tour easing has consistent timing across displays and honours reduced motion',()=>{
 let slow=0,fast=0;
 for(let i=0;i<30;i++)slow=smooth(slow,60,1000/30,false);
 for(let i=0;i<120;i++)fast=smooth(fast,60,1000/120,false);
 assert.ok(Math.abs(slow-fast)<.01);assert.equal(smooth(0,60,16,true),60);assert.equal(smooth(null,35,16,false),35);
});
