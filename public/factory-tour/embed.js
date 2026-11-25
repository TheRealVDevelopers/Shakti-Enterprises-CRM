// Preserve the source tour's camera, timeline, room controls and close-up algorithms.
// Only viewport transport is bridged to the containing company page.
if(parent!==window){
 const origin=location.origin;
 const nativeScroll=window.scrollTo.bind(window);
 const tourElement=document.querySelector('.tour');
 const travel=()=>Math.max(1,tourElement.offsetHeight-innerHeight);
 const send=message=>parent.postMessage(message,origin);
 document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();send({type:'factory-go',progress:0,smooth:true});});
 window.scrollTo=options=>send({type:'factory-go',progress:options.top/travel(),smooth:options.behavior==='smooth'});
 addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==origin||event.data?.type!=='factory-scroll'||!Number.isFinite(event.data.progress))return;
  nativeScroll({top:Math.max(0,Math.min(1,event.data.progress))*travel(),behavior:'instant'});
 });
 addEventListener('wheel',event=>{
  if(document.querySelector('dialog[open]'))return;
  event.preventDefault();
  send({type:'factory-wheel',delta:event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1)});
 },{passive:false});
 let touchY=null;
 addEventListener('touchstart',event=>{touchY=event.touches[0]?.clientY??null;},{passive:true});
 addEventListener('touchmove',event=>{
  if(document.querySelector('dialog[open]')||event.target.closest('input,button,a,details'))return;
  const y=event.touches[0]?.clientY;
  if(touchY!==null&&Number.isFinite(y)){event.preventDefault();send({type:'factory-wheel',delta:touchY-y});}
  touchY=y;
 },{passive:false});
 addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||event.target.closest('input,button,a,summary'))return;
  const delta={ArrowDown:80,ArrowUp:-80,PageDown:innerHeight*.85,PageUp:-innerHeight*.85,' ':innerHeight*.85}[event.key];
  if(delta!==undefined){event.preventDefault();send({type:'factory-wheel',delta});}
  if(event.key==='Home'||event.key==='End'){event.preventDefault();send({type:'factory-go',progress:event.key==='Home'?0:1,smooth:false});}
 });
 document.querySelector('#forward').addEventListener('click',()=>{
  if(!scenes.some(scene=>scene.time>wanted+.28))send({type:'factory-finish'});
 });
 send({type:'factory-ready'});
}
