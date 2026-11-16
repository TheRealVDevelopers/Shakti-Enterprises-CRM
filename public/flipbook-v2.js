(()=>{
 const scene=document.getElementById('book-scene');if(!scene)return;
 const titles=['Cover','Company profile','Tool design & mould development','Materials & capabilities','Quality & industries','Injection moulding machinery','Tool room machinery','Contact & locations'];
 const left=document.getElementById('book-left'),right=document.getElementById('book-right'),leaf=document.getElementById('turning-leaf'),previous=document.getElementById('book-prev'),next=document.getElementById('book-next'),counter=document.getElementById('book-counter'),heading=document.getElementById('book-title'),view=document.getElementById('book-view'),play=document.getElementById('book-play'),focus=document.getElementById('book-focus'),edgePrev=document.getElementById('edge-prev'),edgeNext=document.getElementById('edge-next'),chapters=[...document.querySelectorAll('[data-book-page]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,spreads=[[null,0],[1,2],[3,4],[5,6],[7,null]],cache=new Map();
 let page=0,forcedSingle=false,busy=false,pendingTarget=null,playing=false,timer,expanded=false;
 function single(){return innerWidth<900||forcedSingle;}
 function spreadFor(index){return index===0?0:Math.ceil(index/2);}
 function last(){return single()?page===7:spreadFor(page)===4;}
 function picture(index){if(index===null)return '<div class="book-blank"><img src="/assets/logo.webp" alt="Shakthi Enterprises"><strong>Precision in Plastic.<br>Strength in Every Part.</strong><span>BANGALORE, INDIA · EST. 2006</span></div>';return `<img src="/assets/page-${index+1}.jpg" alt="Page ${index+1}: ${titles[index]}" width="990" height="1400" draggable="false">`;}
 function load(index){if(index===null)return Promise.resolve();if(!cache.has(index)){const image=new Image();image.src=`/assets/page-${index+1}.jpg`;cache.set(index,image.decode().catch(()=>{}));}return cache.get(index);}
 function schedule(){clearTimeout(timer);if(playing&&!document.hidden&&!busy)timer=setTimeout(()=>{if(last())setPlaying(false);else turn(1);},3300);}
 function setPlaying(value){playing=value;play.setAttribute('aria-pressed',String(value));play.textContent=value?'Ⅱ Pause preview':'▷ Play preview';schedule();}
 function render(){scene.classList.toggle('single',single());const spread=spreads[spreadFor(page)],visible=single()?[page]:spread.filter(x=>x!==null);left.innerHTML=single()?'':picture(spread[0]);right.innerHTML=picture(single()?page:spread[1]);counter.textContent=visible.length===1?`Page ${visible[0]+1} / 8`:`Pages ${visible[0]+1}–${visible[1]+1} / 8`;heading.textContent=visible.map(i=>titles[i]).join(' / ');previous.disabled=edgePrev.disabled=busy||page===0;next.disabled=edgeNext.disabled=busy||last();view.disabled=busy;chapters.forEach(chapter=>chapter.setAttribute('aria-current',String(visible.includes(Number(chapter.dataset.bookPage)))));view.setAttribute('aria-pressed',String(forcedSingle));view.textContent=forcedSingle?'Two-page spread':'Single page';document.getElementById('book-progress-fill').style.width=`${(Math.max(...visible)+1)/8*100}%`;scene.dataset.page=page;scene.classList.toggle('at-cover',page===0);load(Math.min(7,page+1));load(Math.min(7,page+2));}
 async function go(target){if(busy){pendingTarget=target;return;}target=Math.max(0,Math.min(7,target));if(target===page){schedule();return;}if(!single()&&spreadFor(target)===spreadFor(page)){page=target;render();schedule();return;}busy=true;clearTimeout(timer);previous.disabled=next.disabled=edgePrev.disabled=edgeNext.disabled=view.disabled=true;
  const forward=target>page,oldPage=page,wasSingle=single();scene.classList.add('is-turning');
  try{const old=spreads[spreadFor(page)],upcoming=spreads[spreadFor(target)];await Promise.all((wasSingle?[target]:upcoming).map(load));
   if(reduced){page=target;render();}
   else{
    leaf.classList.toggle('backward',!forward);leaf.classList.toggle('mobile-leaf',wasSingle);
    leaf.querySelector('.leaf-front').innerHTML=picture(wasSingle?page:forward?old[1]:old[0]);
    leaf.querySelector('.leaf-back').innerHTML=wasSingle?'<div class="paper-reverse"><img src="/assets/logo.webp" alt=""><span>SHAKTHI ENTERPRISES</span></div>':picture(forward?upcoming[0]:upcoming[1]);
    if(wasSingle)right.innerHTML=picture(target);else if(forward)right.innerHTML=picture(upcoming[1]);else left.innerHTML=picture(upcoming[0]);
    leaf.hidden=false;const sign=forward?-1:1;
    const frames=[{transform:'rotateY(0deg) rotateZ(0deg)',offset:0},{transform:`rotateY(${sign*35}deg) rotateZ(${sign*1.2}deg)`,offset:.28},{transform:`rotateY(${sign*100}deg) rotateZ(${sign*.7}deg)`,offset:.60},{transform:`rotateY(${sign*180}deg) rotateZ(0deg)`,offset:1}];
    await leaf.animate(frames,{duration:wasSingle?1000:1150,easing:'cubic-bezier(.25,.05,.22,1)',fill:'forwards'}).finished;
    page=target;render();leaf.hidden=true;leaf.getAnimations().forEach(animation=>animation.cancel());
   }
  }catch{page=oldPage;leaf.hidden=true;leaf.getAnimations().forEach(animation=>animation.cancel());setPlaying(false);}
  finally{busy=false;scene.classList.remove('is-turning');render();if(pendingTarget!==null){const queued=pendingTarget;pendingTarget=null;requestAnimationFrame(()=>go(queued));}else if(last())setPlaying(false);else schedule();}
 }
 function turn(direction){if(single())go(page+direction);else{const target=spreadFor(page)+direction;if(target>=0&&target<spreads.length)go(spreads[target].find(i=>i!==null));}}
 function manualTurn(direction){setPlaying(false);turn(direction);}
 previous.addEventListener('click',()=>manualTurn(-1));next.addEventListener('click',()=>manualTurn(1));edgePrev.addEventListener('click',()=>manualTurn(-1));edgeNext.addEventListener('click',()=>manualTurn(1));
 chapters.forEach(chapter=>chapter.addEventListener('click',()=>{setPlaying(false);go(Number(chapter.dataset.bookPage));}));
 scene.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();manualTurn(1);}if(event.key==='ArrowLeft'){event.preventDefault();manualTurn(-1);}});
 view.addEventListener('click',()=>{if(!busy){setPlaying(false);forcedSingle=!forcedSingle;render();}});
 play.addEventListener('click',()=>{if(playing)setPlaying(false);else{if(last())go(0);setPlaying(true);}});
 function focusMode(value){expanded=value;document.body.classList.toggle('book-reading-mode',value);focus.setAttribute('aria-pressed',String(value));focus.textContent=value?'Close reading mode ×':'Reading mode ⛶';requestAnimationFrame(()=>{if(!busy)render();});}
 focus.addEventListener('click',()=>focusMode(!expanded));document.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded&&!document.getElementById('image-dialog').open)focusMode(false);});
 let start=null;scene.addEventListener('touchstart',event=>{start={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};},{passive:true});scene.addEventListener('touchend',event=>{if(!start)return;const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))manualTurn(dx<0?1:-1);start=null;},{passive:true});
 function zoom(event){setPlaying(false);let index=page;if(!single()&&event){const rect=scene.getBoundingClientRect(),spread=spreads[spreadFor(page)];index=spread[event.clientX<rect.left+rect.width/2?0:1]??page;}window.showSiteImage?.(`/assets/page-${index+1}.jpg`,`Page ${index+1}: ${titles[index]}`);}
 scene.addEventListener('dblclick',event=>{if(!event.target.closest('button'))zoom(event);});document.getElementById('book-zoom').addEventListener('click',()=>zoom());
 let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!busy)render();},150);});document.addEventListener('visibilitychange',schedule);render();
})();
