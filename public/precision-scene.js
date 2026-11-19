import * as THREE from './vendor/three.module.min.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';

// An original, illustrative mould assembly and manufacturing studio.
// All geometry, materials and labels are generated locally.
export function createPrecisionScene(canvas,{studio=true}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{canvas.classList.add('scene-fallback');return {update(){},dispose(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0xf4f2e8,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,100);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 const ambient=new THREE.HemisphereLight(0xffffff,0xb5b299,2.1);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xfff9eb,4.5);key.position.set(-5,8,9);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;key.shadow.normalBias=.035;key.shadow.bias=-.0001;key.shadow.radius=5;scene.add(key);
 const rim=new THREE.DirectionalLight(0xe3f7ed,2);rim.position.set(5,2,-2);scene.add(rim);
 const mat=(color,metalness=0,roughness=.4)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const white=new THREE.MeshPhysicalMaterial({color:0xf7f8f3,roughness:.27,metalness:.12,clearcoat:.5,clearcoatRoughness:.3}),steel=mat(0xbec6c4,.92,.22),chrome=mat(0xd6deda,.98,.12),green=mat(0x075b42,.65,.28),deep=mat(0x062f25,.5,.32),copper=mat(0xb6945e,.85,.24),wood=mat(0x9f7954,.05,.7),black=mat(0x242e2a,.5,.5);
 const mesh=(geometry,material,parent,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(w,h,d,r,material,parent,x=0,y=0,z=0)=>mesh(new RoundedBoxGeometry(w,h,d,3,r),material,parent,x,y,z);
 const cyl=(r,length,material,parent,x,y,z)=>{const o=mesh(new THREE.CylinderGeometry(r,r,length,40),material,parent,x,y,z);o.rotation.x=Math.PI/2;return o;};
 const assembly=new THREE.Group();scene.add(assembly);const plates=[];
 for(let i=0;i<3;i++){
  const plate=new THREE.Group();assembly.add(plate);plates.push(plate);
  box(2.8,3.9,i===1?.52:.32,.13,i===0?white:i===1?deep:steel,plate);
  if(i===0){
   box(1.82,2.75,.07,.12,green,plate,0,0,.2);
   box(1.62,2.55,.05,.10,deep,plate,0,0,.245);
   for(const y of [-.55,.55]){
    cyl(.48,.045,steel,plate,0,y,.29);cyl(.38,.055,deep,plate,0,y,.32);
    const ring=mesh(new THREE.TorusGeometry(.39,.024,12,64),chrome,plate,0,y,.36);
    cyl(.15,.06,copper,plate,0,y,.36);
    for(let a=0;a<4;a++){const angle=a*Math.PI/2;cyl(.035,.035,chrome,plate,Math.cos(angle)*.3,y+Math.sin(angle)*.3,.39);}
   }
   for(const y of [-1.54,1.54])box(.68,.015,.007,.003,copper,plate,0,y,.168);
  }else{
   box(1.92,2.82,.08,.06,i===1?steel:deep,plate,0,0,.30);
   for(const y of [-.55,.55]){cyl(.45,.08,i===1?copper:chrome,plate,0,y,.38);cyl(.29,.11,deep,plate,0,y,.43);}
  }
  for(const x of [-1.12,1.12])for(const y of [-1.62,1.62]){
   cyl(.13,.04,deep,plate,x,y,.19);cyl(.086,.065,copper,plate,x,y,.23);
   const screw=cyl(.055,.035,chrome,plate,x,y,.28);screw.geometry=new THREE.CylinderGeometry(.055,.055,.035,6);
  }
  for(const y of [-1.22,-1.02,-.82,-.62,-.42,-.22,0,.22,.42,.62,.82,1.02,1.22])box(.012,.02,.23,.003,black,plate,1.402,y,0);
 }
 const guides=new THREE.Group();assembly.add(guides);for(const x of [-1.12,1.12])for(const y of [-1.62,1.62])cyl(.055,3.9,chrome,guides,x,y,-.5);
 // A subtle brand plate made from a local canvas texture.
 const label=document.createElement('canvas');label.width=512;label.height=96;const ctx=label.getContext('2d');ctx.fillStyle='#f7f8f3';ctx.fillRect(0,0,512,96);ctx.fillStyle='#07563f';ctx.font='bold 46px Arial';ctx.textAlign='center';ctx.fillText('SHAKTHI',256,48);ctx.font='15px Arial';ctx.fillText('P R E C I S I O N   E N G I N E E R I N G',256,80);const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(.98,.185),new THREE.MeshBasicMaterial({map:texture}),plates[0],0,1.71,.164);
 const studioGroup=new THREE.Group();scene.add(studioGroup);
 if(studio){
  const wall=mesh(new THREE.PlaneGeometry(60,35),mat(0xf0eee3,0,.95),studioGroup,0,0,-4.5);wall.castShadow=false;
  box(10,.22,2.3,.05,wood,studioGroup,0,-3.4,-.4);
  for(const x of [-4.3,4.3])box(.13,3.1,.13,.02,deep,studioGroup,x,-5,-.45);
  box(3,.12,.9,.03,wood,studioGroup,4.9,1.0,-2.1);
  for(let i=0;i<6;i++){const book=box(.15,1,.65,.01,mat(i%2?0xdeddd2:0xd0d6c8),studioGroup,4.1+i*.17,1.57,-2.1);book.rotation.z=(i===0?-.18:0);}
  box(1.5,.08,.85,.02,mat(0xe4e1d4),studioGroup,-3,-3.22,-.3);
  for(let i=0;i<3;i++)box(.7,.2,.5,.06,i%2?white:green,studioGroup,2.8+i*.2,-3.1+i*.2,-.4);
  // A stylised studio plant, made from original geometry.
  const plant=new THREE.Group();plant.position.set(-6,-3.3,-1.3);studioGroup.add(plant);
  mesh(new THREE.CylinderGeometry(.5,.35,.85,40),mat(0xb29478,0,.9),plant,0,.43,0);
  mesh(new THREE.CylinderGeometry(.43,.43,.03,40),mat(0x403c2b,0,.95),plant,0,.86,0);
  for(let i=0;i<11;i++){
   const angle=i*2.4,height=1.3+(i%4)*.35,leaf=mesh(new THREE.SphereGeometry(1,16,16),mat(i%2?0x3d6641:0x456e3f,0,.65),plant,Math.cos(angle)*.31,.92+height/2,Math.sin(angle)*.25);
   leaf.scale.set(.14,height/2,.035);leaf.rotation.z=Math.cos(angle)*.32;leaf.rotation.x=Math.sin(angle)*.25;
  }
 }
 let progress=0,explode=0,targetExplode=0,manualExplode=null,rot=.14,drag=false,last=0,pointer={x:0,y:0},raf=0,visible=true,stopped=false,size={w:0,h:0};
 canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Interactive three-dimensional precision mould. Drag or use arrow keys to rotate.');
 canvas.addEventListener('pointerdown',e=>{drag=true;last=e.clientX;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
 canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;if(drag){rot+=(e.clientX-last)*.008;last=e.clientX;}if(reduced)draw(0);});
 canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rot+=e.key==='ArrowLeft'?-.16:.16;if(reduced)draw(0);}});
 const smooth=(a,b,t)=>a+(b-a)*t,clamp=v=>Math.min(1,Math.max(0,v));
 function draw(time){if(stopped)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;if(size.w!==r.width||size.h!==r.height){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();size={w:r.width,h:r.height};}
  const mobile=r.width<700,pull=clamp(progress/.38),detail=clamp((progress-.44)/.4);
  const easing=pull*pull*(3-2*pull);camera.position.set(0,studio?0.15:0,studio?smooth(mobile?15:8.6,mobile?20:15,easing):12);camera.lookAt(0,0,0);
  assembly.position.set(0,studio?smooth(mobile?-1.9:-2.6,0.1,easing):0,0);assembly.rotation.set(-.06+pointer.y*.08,rot+pointer.x*.15+detail*.4,.025);assembly.position.y+=reduced?0:Math.sin(time*.00065)*.04;
  explode=smooth(explode,manualExplode!==null?manualExplode:targetExplode||detail*.9,reduced?1:.07);
  plates.forEach((plate,i)=>{plate.position.z=(1-i)*(.46+explode*1.45);plate.position.x=(i-1)*explode*.15;});guides.scale.z=1+explode*.3;guides.visible=explode>.12;
  studioGroup.visible=studio&&progress>.12&&progress<.64;if(studio){studioGroup.position.y=smooth(-4,0,easing);studioGroup.position.z=-detail*10;}
  renderer.render(scene,camera);raf=0;if(!reduced&&visible)raf=requestAnimationFrame(draw);
 }
 const resize=new ResizeObserver(()=>{if(reduced||!raf)draw(0);});resize.observe(canvas);
 const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible&&!raf)draw(0);else if(!visible){cancelAnimationFrame(raf);raf=0;}});observer.observe(canvas);draw(0);
 return {update(p,open=false,manual=null){progress=clamp(p);targetExplode=open?1.45:0;manualExplode=manual===null?null:clamp(manual)*1.45;if(reduced)draw(0);},dispose(){stopped=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});environment.dispose();texture.dispose();renderer.dispose();}};
}
