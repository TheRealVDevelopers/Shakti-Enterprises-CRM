import {createBatteryScene} from './battery-scene.js';

export function createHeroBatteryScene(canvas){
 const model=createBatteryScene(canvas,{hero:true});let selected='case';
 canvas.classList.add('hero-battery');
 if(!model.available){canvas.classList.add('scene-fallback');canvas.setAttribute('aria-label','Tubular battery component study. Explore the detailed battery page for all parts.');}
 return {update(journey,expanded=false,manual=null){const automatic=Math.max(0,Math.min(1,(journey-.62)/.32));model.update(manual!==null?manual:expanded?1:automatic,selected,{journey});},select(part){selected=part;model.select?.(part);},dispose(){model.dispose();}};
}
