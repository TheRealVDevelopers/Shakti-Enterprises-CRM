import {createPrecisionScene} from './workspace-battery-scene.js';
const banner=document.querySelector('.page-banner');
if(banner){const canvas=document.createElement('canvas');canvas.className='inner-scene';banner.append(canvas);const scene=createPrecisionScene(canvas,{studio:false});addEventListener('pagehide',event=>{if(!event.persisted)scene.dispose();});}
