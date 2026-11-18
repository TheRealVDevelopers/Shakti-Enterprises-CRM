import {createBatteryScene} from './battery-scene.js';
// Retains the shared scene interface used by CRM panels and sign-in.
export function createPrecisionScene(canvas){
 const model=createBatteryScene(canvas,{compact:true});let selected='case';const select=e=>selected=e.detail.part;canvas.addEventListener('battery-part-select',select);
 if(!model.available){canvas.classList.add('scene-fallback');canvas.setAttribute('aria-label','Tubular battery illustration');}
 return {update(progress=0,expanded=false){model.update(expanded?1:0,selected);},dispose(){canvas.removeEventListener('battery-part-select',select);model.dispose();}};
}
