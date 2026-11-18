import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraTargets,approach,nearestYaw} from '../public/battery-motion.js';

test('camera controls cannot zoom through the model or overturn the product',()=>{
 assert.deepEqual(cameraTargets({pitch:20,zoom:50,explode:4,yaw:2}),{pitch:.48,zoom:1.55,explode:1,yaw:2});
 assert.deepEqual(cameraTargets({pitch:-20,zoom:-5,explode:-1}),{pitch:-.32,zoom:.72,explode:0,yaw:-.08});
 assert.equal(cameraTargets({zoom:NaN}).zoom,1);
});
test('damped camera and assembly motion converges without overshoot and settles',()=>{
 let current={yaw:-.08,pitch:0,zoom:1,explode:0},target={yaw:2,pitch:.42,zoom:1.55,explode:1},settled=false;
 for(let frame=0;frame<90;frame++){const result=approach(current,target,16);assert.ok(result.value.explode>=current.explode&&result.value.explode<=1);assert.ok(result.value.zoom<=1.55);current=result.value;if(result.settled){settled=true;break;}}
 assert.ok(settled,'An idle viewer must stop requesting animation frames');
 assert.ok(Math.abs(current.yaw-target.yaw)<.001);
});
test('reduced motion is immediate and view presets take the shortest rotation',()=>{
 const target={yaw:1,pitch:.2,zoom:1.4,explode:.7};assert.deepEqual(approach({yaw:0,pitch:0,zoom:1,explode:0},target,16,true),{value:target,settled:true});
 const around=Math.PI*12+.1,wanted=nearestYaw(-.08,around);assert.ok(Math.abs(wanted-around)<.2);assert.ok(Math.abs(Math.sin(wanted)-Math.sin(-.08))<1e-9);
});
