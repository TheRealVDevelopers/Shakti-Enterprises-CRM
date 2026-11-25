const $ = selector => document.querySelector(selector);
const rooms = [...document.querySelectorAll('.chapter')];
const tour = $('.tour');
const stage = $('.tour-stage');
const range = $('.tour-progress');
const notes = $('#roomInfo');
const index = $('#index');
const narrow = matchMedia('(max-aspect-ratio: 3/4)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const duration = scenes.at(-1).time;
const storyDuration = duration + addedTime;
const roomNames = ['Entrance', ...rooms.map(r=>r.querySelector('.caption small').textContent)];
const first = roomNames.map((_,i)=>scenes.findIndex(s=>s.room===i));
const film = $('.film'), poster = film.querySelector('img');
const video = document.createElement('video');
video.muted = true;
video.playsInline = true;
video.preload = 'auto';
video.setAttribute('aria-hidden','true');
film.append(video);
const unitCamera=createUnitCamera(film,go);
const sampleDrawer=createSampleDrawer(film,resinGuide,selectCard);
const mouldBench=createSampleDrawer(film,null,selectCard,mouldDisplay);

let current=-1;
let wanted=0;
let scheduled=false;
let ready=false;
let failed=false;
let lastFrame=-1;
let forceStill=false;
let renderedStory=null,lastRender=performance.now();

function selectMovie() {
  ready=false;
  failed=false;
  lastFrame=-1;
  film.classList.remove('film-ready');
  video.src='film/factory-'+(narrow.matches?'portrait':'wide')+'-web.mp4';
  updatePoster();
  video.load();
  schedule();
}
function updatePoster() {
  const stop=Math.max(current,0);
  poster.src=stopImage(stop,narrow.matches?'portrait':'wide');
  poster.alt=scenes[stop].label;
}
function stopImage(stop,edition='wide') {
  return scenes[stop].still.replace('{edition}',edition);
}
function seekFrame() {
  if (!ready || failed || video.seeking || forceStill) return;
  const frame=Math.round(sourceTime(wanted)*24);
  if (frame===lastFrame) return;
  const target=Math.min(frame/24,video.duration-.02);
  lastFrame=frame;
  if (Math.abs(video.currentTime-target)>.012) video.currentTime=target;
}
video.addEventListener('loadeddata',()=>{
  ready=true;
  seekFrame();
  if (!forceStill && !video.seeking) film.classList.add('film-ready');
});
video.addEventListener('seeked',()=>{
  if (!forceStill) film.classList.add('film-ready');
  seekFrame();
});
video.addEventListener('error',()=>{
  failed=true;
  film.classList.remove('film-ready');
  updatePoster();
});

const roomOrder=[0,1,2,8,4,5,6,3,7];
const roomButtons=roomOrder.map((i,visit)=>{
  const button=document.createElement('button');
  button.textContent=String(visit+1).padStart(2,'0')+' '+roomNames[i];
  button.onclick=()=>go(scenes[first[i]].time);
  $('.tour-stops').append(button);
  return button;
});
function go(seconds,animate=true) {
  goStory(storyAtMovie(seconds),animate);
}
function goStory(story,animate) {
  const top=tour.offsetTop+story/storyDuration*(tour.offsetHeight-stage.offsetHeight);
  window.scrollTo({top,behavior:animate&&!reduced.matches?'smooth':'instant'});
  schedule();
}
function closestScene(time) {
  let closest=0;
  scenes.forEach((scene,i)=>{
    if (Math.abs(time-scene.time)<Math.abs(time-scenes[closest].time)) closest=i;
  });
  return closest;
}
function passage(time) {
  if (time<4) return 'Entrance / through the front door';
  if (time<10) return 'Office / approach the desk';
  if (time<15.13) return 'Office / back through the doorway';
  if (time<19) return 'Production / turn towards the presses';
  if (time>=unitEntry && time<unitExit) return 'Tooling operations / press aisle';
  const destination=scenes.find(s=>s.time>time);
  return destination?'Aisle / '+destination.label:'Ready stock';
}
function describe(i) {
  const s=scenes[i];
  $('.site-title').hidden=i!==0;
  $('.enter-tour').hidden=i!==0;
  $('.tour-copy').hidden=i===0;
  $('.tour-copy h2').textContent=s.label;
  $('.tour-transport output').textContent=String(i+1).padStart(2,'0')+' / '+scenes.length;
  roomButtons.forEach((b,n)=>b.setAttribute('aria-current',String(s.time!==routeTime(32) && roomOrder[n]===s.room)));
  if (i===0) return;
  const inspect=$('#inspect');
  inspect.hidden=false;
  $('.tour-kicker').textContent=s.specification;
  $('.tour-copy p').textContent=s.narrative;
  inspect.textContent=s.time===4?'Approach the office':s.time===5.5?'Enter the office':s.time===31?'Approach the 40-tonne press':s.time===routeTime(32)?'Enter tool room I':s.time===routeTime(36)?'Approach the milling machine':s.time===routeTime(54)?'Look over the bench':s.detail?'Machine details':'Explore room';
}
const tag = $('.equipment-tag');
let displayed = null;
function selectCard(index) {
  if (!displayed || index<0 || index>=displayed.stop.cards.length) return;
  const story=displayed.stop.start+(index+.5)*readingInterval;
  goStory(story,true);
}
function showTag(active,unitPin) {
  if(active?.stop.kind!=='samples') sampleDrawer.hide();
  if(active?.stop.kind!=='mould-bench') mouldBench.hide();
  if(!active){tag.hidden=true;displayed=null;return;}
  const {stop,index:cardIndex,opacity}=active;
  const card=stop.cards[cardIndex];
  if(!displayed || displayed.stop!==stop || displayed.index!==cardIndex) {
    $('.tag-eyebrow').textContent=card.eyebrow;
    $('.tag-title').textContent=card.title;
    $('.tag-facts').textContent=card.facts;
    $('.tag-use').textContent=card.use;
    const multiple=stop.cards.length>1;
    for(const el of tag.querySelectorAll('.tag-prev,.tag-next,.tag-count'))el.hidden=!multiple;
    $('.tag-prev').disabled=cardIndex===0;
    $('.tag-next').disabled=cardIndex===stop.cards.length-1;
    $('.tag-count').textContent=(cardIndex+1)+' / '+stop.cards.length;
    $('.tag-details').textContent=stop.press?'Estimate parts/hour':stop.kind==='samples'?'Material guide':stop.kind==='mould-bench'?'How it works':stop.kind==='office'?'Enter the office':'Details';
    if (!reduced.matches && tag.animate) tag.querySelector('.tag-paper').animate([{transform:'translateY(4px)'},{transform:'translateY(0)'}],{duration:200});
  }
  displayed=active;
  tag.hidden=opacity<.4;
  tag.style.opacity=1;
  const exhibit=stop.kind==='samples'?sampleDrawer:stop.kind==='mould-bench'?mouldBench:null;
  const pin=exhibit?exhibit.update(active.progress,opacity):unitPin;
  const [x,y]=pin ? pin.map(n=>n/100) : filmPin(stop.pin);
  if(stop.kind==='mould-bench' && (x<.035 || x>.965 || y<.09 || y>.92)) tag.hidden=true;
  tag.style.setProperty('--pin-x',x*100+'%');tag.style.setProperty('--pin-y',y*100+'%');
  tag.classList.toggle('tag-left',x>=.48);
  tag.classList.toggle('tag-right',x<.48);
}
function filmPin(pin) {
  const [px,py]=narrow.matches && pin.length===4 ? pin.slice(2) : pin;
  const size=stage.getBoundingClientRect();
  const aspect=narrow.matches?720/1280:1440/810;
  const fit=getComputedStyle(video).objectFit==='contain'?Math.min:Math.max;
  const width=fit(size.width,size.height*aspect);
  const height=width/aspect;
  const x=Math.min(.90,Math.max(.10, .5+(px-.5)*width/size.width));
  const y=Math.min(.91,Math.max(.12, .5+(py-.5)*height/size.height));
  return [x,y];
}
$('.tag-prev').onclick=()=>selectCard(displayed.index-1);
$('.tag-next').onclick=()=>selectCard(displayed.index+1);
$('.tag-details').onclick=()=>$('#inspect').onclick();
function render() {
  scheduled=false;
  const targetStory=Math.max(0,Math.min(1,(scrollY-tour.offsetTop)/Math.max(1,tour.offsetHeight-stage.offsetHeight)))*storyDuration;
  const now=performance.now();
  const story=smoothTourStory(renderedStory,targetStory,now-lastRender,reduced.matches);
  renderedStory=story;lastRender=now;
  if(story!==targetStory)schedule();
  wanted=movieAtStory(story);
  const i=closestScene(wanted);
  if (current!==i) {
    current=i;
    describe(i);
    if (!ready || failed || forceStill) updatePoster();
  }
  forceStill=reduced.matches;
  if (forceStill) film.classList.remove('film-ready');
  else seekFrame();
  const distance=Math.abs(wanted-scenes[i].time);
  const opacity=forceStill?1:Math.max(0,Math.min(1,1-(distance-.64)/.69));
  const active= currentTag(story);
  const stationIndex=active?.stop.unit ? unitPresses.findIndex(s=>s.time===active.stop.time):-1;
  const unitPin=unitCamera.update(wanted,stationIndex,forceStill);
  showTag(active,unitPin);
  $('.tour-copy').hidden = i===0 || Boolean(active);
  $('.tour-copy').style.opacity=opacity;
  $('.site-title').style.opacity=opacity;
  $('.enter-tour').style.opacity=opacity;
  $('#inspect').disabled=opacity<.1;
  range.value=Math.round(story*100);
  const label=active?active.stop.cards[active.index].title:opacity>.5||forceStill?scenes[i].label:passage(wanted);
  $('#shot').textContent=label;
  range.setAttribute('aria-valuetext', active ? active.stop.cards[active.index].title : label);
  range.style.setProperty('--progress',story/storyDuration*100+'%');
  const next=scenes.find(s=>s.time>wanted+.28);
  $('#forward').textContent=next?'Next · '+next.label:'Finish tour';
  if(active?.stop.kind==='mould-bench' && active.index<mouldGuide.length-1)
    $('#forward').textContent='Next · '+mouldGuide[active.index+1].name;
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
rooms.forEach(r=>r.hidden=true);
range.max=Math.round(storyDuration*100);
tour.style.height='3100svh';
$('.enter-tour').onclick=()=>go(4);
$('#forward').onclick=()=>{
  if(displayed?.stop.kind==='mould-bench' && displayed.index<mouldGuide.length-1){selectCard(displayed.index+1);return;}
  const next=scenes.find(s=>s.time>wanted+.28);
  if(next)go(next.time);else $('footer').scrollIntoView();
};
range.oninput=()=>goStory(range.value/100,false);
$('#inspect').onclick=()=>{
  const s=scenes[current];
  if(s.time===4 && !displayed){go(5.5);return;}
  if(displayed?.stop.kind==='office' || s.time===5.5){go(10);return;}
  if(s.time===31 && !displayed){go(unitPresses[0].time);return;}
  if(s.time===routeTime(32)){go(routeTime(36));return;}
  if(s.time===routeTime(36) && !displayed){go(routeTime(40));return;}
  if(s.time===routeTime(54) && !displayed){go(routeTime(56));return;}
  const card=displayed?.stop.cards[displayed.index];
  const {room,detail}=s;
  const label=card?.title||s.label, narrative=card?.use||s.narrative, specification=card?.facts||s.specification;
  if(!room)return;
  $('#roomTitle').textContent=label;
  const body=document.createElement('div');
  body.className='room-notes';
  const figure=document.createElement('img');
  figure.className='detail-film-still';
  figure.src=stopImage(current);figure.alt=label+' in its factory bay';
  const tag=document.createElement('small');tag.textContent=specification;
  const text=document.createElement('p');text.textContent=narrative;
  if(displayed?.stop.kind==='samples') body.insertAdjacentHTML('beforeend',sampleDrawer.detail(displayed.index));
  else if(displayed?.stop.kind==='mould-bench') body.insertAdjacentHTML('beforeend',mouldBench.detail(displayed.index));
  else body.append(figure);
  body.append(tag,text);
  const source=rooms[room-1].querySelector('.notes');
  if(displayed?.stop.press){
    body.append(createOutputEstimate());
    const table=rooms[1].querySelector('table').cloneNode(true);
    body.append(table);
    const foot=document.createElement('p');
    foot.textContent='The operating register is unchanged. Confirm mould fit, shot capability and material before scheduling a job.';
    body.append(foot);
    if(displayed.stop.unit) {
      const credit=document.createElement('p');credit.textContent='Illustrated factory walkthrough. The current machine register is preserved on the company machinery page.';body.append(credit);
    }
  }else if(displayed?.stop.kind==='mould-bench') {
    const explanation=document.createElement('p');explanation.textContent=mouldGuide[displayed.index].detail;
    const note=document.createElement('small');note.textContent='Illustrated example from the mould-making display.';
    body.append(explanation,note);
  }else if(displayed?.stop.kind==='samples') {
    const glossary=document.createElement('dl');glossary.className='resin-glossary';
    for(const [code,name,use] of resinGuide){
      const term=document.createElement('dt'),desc=document.createElement('dd');
      term.textContent=code+' · '+name;desc.textContent=use;
      glossary.append(term,desc);
    }
    body.append(glossary);
    const note=document.createElement('p');note.textContent='Sample colours illustrate the compartments. The resin grade and batch label identify the production material.';body.append(note);
  }else if(room===1 || room===3 || room===6 || room===7){
    const items=source.querySelector('.items').cloneNode(true);
    // Keep the station photograph as the visual reference while reading.
    items.querySelectorAll('img, figure').forEach(el=>el.remove());
    body.append(items);
  }else if(detail){
    const reference=[...source.querySelectorAll('details')].find(d=>d.querySelector('summary').textContent===detail);
    if(reference){const explanation=reference.querySelector('p').cloneNode(true);body.append(explanation);}
  }
  $('.room-body').replaceChildren(body);
  notes.showModal();notes.scrollTop=0;
};
$('#closeRoom').onclick=()=>notes.close();
$('#indexButton').onclick=()=>index.showModal();
$('#closeIndex').onclick=()=>index.close();
// The index shows the wide masters used by the film, with direct access to each stop.
const directory=index.querySelector('nav');
directory.replaceChildren();
for(const [title, cover, targets] of [
  ['Entrance and office',4,[0,4,5.5,10]],
  ['Moulding hall',19,[17.25,19,23,27]],
  ['Tooling operations',31,[31,...unitPresses.map(p=>p.time)]],
  ['Tool room I',routeTime(36),[32,36,40,44,48,52,54,56].map(routeTime)],
  ['Finishing and quality',routeTime(60),[60,64,68,72].map(routeTime)],
  ['Materials and dispatch',routeTime(80),[80,84,88,92].map(routeTime)]
]){
  const group=document.createElement('section');
  const thumbnail=new Image();thumbnail.src=stopImage(closestScene(cover));thumbnail.alt='';thumbnail.loading='lazy';
  const heading=document.createElement('h3');heading.textContent=title;
  const list=document.createElement('div');
  for(const time of targets){
    const link=document.createElement('button');
    link.textContent=scenes[closestScene(time)].label;
    link.onclick=()=>{index.close();go(time)};
    list.append(link);
  }
  group.append(thumbnail,heading,list);directory.append(group);
}
function restore(){
  if(location.hash==='#mould-display'){go(routeTime(56),false);return;}
  if(location.hash==='#press-530'){go(27,false);return;}
  if(location.hash==='#press-tokima'){go(23,false);return;}
  const i=rooms.findIndex(r=>'#'+r.id===location.hash);
  if(i>=0)go(scenes[first[i+1]].time,false);
}
window.addEventListener('hashchange',restore);
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule);
narrow.addEventListener('change',selectMovie);
reduced.addEventListener('change',()=>{forceStill=reduced.matches;if(forceStill)updatePoster();else{lastFrame=-1;if(ready)film.classList.add('film-ready');}schedule();});
selectMovie();restore();render();


