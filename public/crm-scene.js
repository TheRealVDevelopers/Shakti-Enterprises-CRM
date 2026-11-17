// A missing GPU, unsupported WebGL, or a failed 3D download must not block the CRM.
export function createWorkspaceScene(canvas,load=()=>import('./precision-scene.js')){
 let disposed=false,scene=null,latest=[0,false];
 const fallback=()=>{if(!disposed){canvas.classList.add('scene-fallback');canvas.setAttribute('aria-label','Precision mould illustration');}};
 const ready=Promise.resolve().then(load).then(module=>{
  if(disposed)return;try{scene=module.createPrecisionScene(canvas,{studio:false});scene.update(...latest);}catch{fallback();}
 }).catch(fallback);
 return {ready,update(...args){latest=args;if(scene&&!disposed)try{scene.update(...args);}catch{fallback();}},dispose(){disposed=true;if(scene)try{scene.dispose();}catch{/* The business workspace remains usable even if GPU cleanup fails. */}}};
}
