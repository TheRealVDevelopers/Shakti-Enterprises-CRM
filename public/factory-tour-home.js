// The supplied film owns its viewport; the main page owns the scroll position.
const shell=document.querySelector('.factory-tour-shell');
const frame=document.querySelector('#factory-tour');
let pending=false;
function sync(){
 pending=false;
 const box=shell.getBoundingClientRect(),travel=Math.max(1,shell.offsetHeight-innerHeight);
 const progress=Math.max(0,Math.min(1,-box.top/travel));
 document.body.classList.toggle('in-factory-tour',box.top<=1&&box.bottom>=innerHeight-1);
 frame.contentWindow?.postMessage({type:'factory-scroll',progress},location.origin);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(sync);}}
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',schedule);
frame.addEventListener('load',sync);
addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
 const message=event.data;
 if(message?.type==='factory-ready'){sync();return;}
 if(message?.type==='factory-wheel'&&Number.isFinite(message.delta)){
  window.scrollBy({top:Math.max(-innerHeight*3,Math.min(innerHeight*3,message.delta)),behavior:'instant'});
 }
 if(message?.type==='factory-go'&&Number.isFinite(message.progress)){
  const progress=Math.max(0,Math.min(1,message.progress));
  window.scrollTo({top:scrollY+shell.getBoundingClientRect().top+progress*(shell.offsetHeight-innerHeight),behavior:message.smooth?'smooth':'instant'});
 }
 if(message?.type==='factory-finish')document.querySelector('#capabilities').scrollIntoView({behavior:'smooth'});
});
sync();
