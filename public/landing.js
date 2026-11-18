import {createHeroBatteryScene} from './hero-battery-scene.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage=$('#journey'),scene=createHeroBatteryScene($('#precision-scene'));let expanded=false,manualAssembly=null,pending=false,activeFeature=null;
const clamp=n=>Math.max(0,Math.min(1,n));
function update(){pending=false;const progress=clamp(-stage.getBoundingClientRect().top/(stage.offsetHeight-innerHeight));scene.update(progress,expanded,manualAssembly);
 const hero=clamp(1-progress/.21),studio=clamp((progress-.18)/.10)*clamp(1-(progress-.43)/.10),detail=clamp((progress-.46)/.13);
 $('.hero-title').style.opacity=hero;$('.hero-title').style.transform=`translateY(${-progress*180}px) scale(${1-progress*.15})`;
 for(const el of [$('.hero-introduction'),$('.hero-location'),$('.scroll-discover')]){el.style.opacity=hero;el.style.visibility=hero<.01?'hidden':'visible';}
 $('.studio-caption').style.opacity=studio;$('.studio-caption').style.transform=`translateY(${(1-studio)*25}px)`;
 $('.discovery-backdrop').style.opacity=detail;const labels=clamp((progress-.20)/.07);$('.hotspots').style.opacity=labels;$('.hotspots').inert=labels<.9;$('.hotspots').style.visibility=labels<.05?'hidden':'visible';$('.hotspots').classList.toggle('labels-visible',labels>.9);$('.hotspots').classList.toggle('is-exploded',manualAssembly!==null?manualAssembly>.12:expanded||progress>.68);
 $('.scene-toolbar').style.opacity=labels;$('.scene-toolbar').style.pointerEvents=labels>.9?'auto':'none';$('.scene-toolbar').inert=labels<.9;
 $('.journey-progress i').style.height=`${progress*100}%`;$('.product-annotations').style.opacity=1-detail;
 if(labels<.8)closeFeature();
}
const onScroll=()=>{if(!pending){pending=true;requestAnimationFrame(update);}};addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
document.addEventListener('pointermove',e=>{if(reduced)return;document.documentElement.style.setProperty('--pointer-x',`${e.clientX/innerWidth*100}%`);document.documentElement.style.setProperty('--pointer-y',`${e.clientY/innerHeight*100}%`);},{passive:true});
function toDiscovery(e){e?.preventDefault();const target=stage.offsetTop+(stage.offsetHeight-innerHeight)*.75;window.scrollTo({top:target,behavior:reduced?'instant':'smooth'});history.replaceState(null,'','#discovery');}
$$('a[href="#discovery"]').forEach(a=>a.addEventListener('click',toDiscovery));
if(location.hash==='#discovery')requestAnimationFrame(()=>toDiscovery());
$('#explode-toggle').onclick=()=>{expanded=!expanded;manualAssembly=expanded?1:0;if(!expanded){scene.select?.('case');closeFeature();}$('#explode-toggle').setAttribute('aria-pressed',String(expanded));$('#explode-toggle').innerHTML=expanded?'Bring it together <span>−</span>':'Explore the assembly <span>+</span>';update();};
const features=[
 ['01 / THE OUTER JAR','Strength in the structure.','Explore the tall ribbed outer jar, its moulded walls and the mounting envelope that locates the battery assembly.','/battery-components#case'],
 ['02 / THE TOP COVER','Every interface, considered.','The black moulded lid brings the case joint, vent housings and terminal interfaces into one connected cover.','/battery-components#lid'],
 ['03 / VENT ASSEMBLIES','A closer look at the top.','Discover the six vent plugs, their separate housings and the moulded fits shown in the tubular battery study.','/battery-components#vents'],
 ['04 / INSIDE THE BATTERY','The detail within.','Scroll to separate the cover and vent assemblies, then explore the retainers, separators and cell partitions inside the jar.','/battery-components#retainers'],
 ['05 / HANDLE GRIPS','Made to be handled.','The side ropes and plastic grips form the handling interface. Explore their fixing points and the approved requirements for the complete assembly.','/battery-components#handles'],
 ['06 / SEPARATOR ENVELOPES','A closer look inside.','Explore where the separator envelopes sit between the tubular internal elements in this illustrative component study.','/battery-components#separators']
];
function closeFeature(){if($('#feature-panel').hidden)return;$('#feature-panel').hidden=true;$$('[data-feature]').forEach(b=>b.classList.remove('active'));activeFeature=null;}
$$('[data-feature]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.feature),f=features[i];scene.select?.(b.dataset.heroPart||'case');if(activeFeature===i)return closeFeature();activeFeature=i;$$('[data-feature]').forEach(el=>el.classList.toggle('active',el===b));$('#feature-number').textContent=f[0];$('#feature-title').textContent=f[1];$('#feature-copy').textContent=f[2];$('#feature-link').href=f[3];$('#feature-panel').hidden=false;$('.feature-close').focus({preventScroll:true});}));
$('#precision-scene').addEventListener('battery-follow-scroll',()=>{manualAssembly=null;expanded=false;$('#explode-toggle').setAttribute('aria-pressed','false');$('#explode-toggle').innerHTML='Explore the assembly <span>+</span>';update();});
$('#precision-scene').addEventListener('battery-part-select',e=>{const map={case:0,ribs:0,panel:0,handles:4,lid:1,terminals:1,vents:2,housings:2,partitions:3,retainers:3,separators:5};const feature=map[e.detail.part];if(feature!==undefined&&activeFeature!==feature)$(`[data-feature="${feature}"]`)?.click();});
$('.feature-close').onclick=()=>{const last=activeFeature;closeFeature();$(`[data-feature="${last}"]`)?.focus({preventScroll:true});};

const calloutLayouts={case:[[.46,.75],[.16,.72],[.15,.74]],lid:[[.88,.43],[.85,.36],[.85,.49]],vents:[[.82,.18],[.80,.13],[.83,.39]],retainers:[[.44,.44],[.14,.40],[.13,.57]],handles:[[.89,.75],[.86,.73],[.86,.72]],separators:[[.45,.84],[.17,.85],[.15,.84]]};
$('#precision-scene').addEventListener('battery-label-positions',event=>{const mobile=innerWidth<760,blend=clamp((event.detail.journey-.44)/.18);for(const [part,point]of Object.entries(event.detail.points)){const button=$(`[data-hero-part="${part}"]`),group=$(`[data-leader="${part}"]`);if(!button||!group)continue;const layout=calloutLayouts[part],xy=mobile?layout[2]:layout[0].map((v,i)=>v+(layout[1][i]-v)*blend);button.style.left=xy[0]*100+'%';button.style.top=xy[1]*100+'%';const line=group.querySelector('line'),circle=group.querySelector('circle');for(const [key,value]of Object.entries({x1:xy[0]*1000,y1:xy[1]*1000,x2:point.x*1000,y2:point.y*1000}))line.setAttribute(key,value);circle.setAttribute('cx',point.x*1000);circle.setAttribute('cy',point.y*1000);}});
const worldToggle=$('#world-toggle'),worldMenu=$('#world-menu');worldToggle.onclick=()=>{worldMenu.hidden=!worldMenu.hidden;worldToggle.setAttribute('aria-expanded',String(!worldMenu.hidden));};
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown')){worldMenu.hidden=true;worldToggle.setAttribute('aria-expanded','false');}});
const menu=$('#full-menu'),menuTrigger=$('.menu-trigger');
function setMenu(open){menu.hidden=!open;$('#main').inert=open;$('.new-footer').inert=open;document.body.classList.toggle('menu-open',open);menuTrigger.setAttribute('aria-expanded',String(open));if(open)$('.menu-close').focus();else menuTrigger.focus({preventScroll:true});}
menuTrigger.onclick=()=>setMenu(true);$('.menu-close').onclick=()=>setMenu(false);$$('#full-menu a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;$('#main').inert=false;$('.new-footer').inert=false;document.body.classList.remove('menu-open');menuTrigger.setAttribute('aria-expanded','false');}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeFeature();worldMenu.hidden=true;worldToggle.setAttribute('aria-expanded','false');if(!menu.hidden)setMenu(false);}if(e.key==='Tab'&&!menu.hidden){const items=$$('#full-menu button,#full-menu a'),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
const tabs=[
 {image:'photo-engineer',alt:'Injection mould engineering design',title:'Every great part\nstarts with a good plan.',copy:'From your first drawing, model or sample, we explore the material, geometry and application. Bringing practical engineering into the process before production begins.',caption:'ENGINEERING STUDY / AI-CREATED ILLUSTRATION',link:'/services',label:'Explore our engineering'},
 {image:'photo-tool',alt:'Precision mould assemblies at Shakthi Enterprises',title:'The tool shapes\neverything that follows.',copy:'Mould design, construction, machining and trials, connected through our dedicated tool room. With repair and maintenance support for the life of the tool.',caption:'MOULD DEVELOPMENT / AI-CREATED ILLUSTRATION',link:'/mould-making',label:'Explore our tool room'},
 {image:'photo-machine',alt:'Injection moulding machine on the production floor',title:'From the first article.\nTo the final delivery.',copy:'Injection moulding, inspection, assembly and packing. We bring the people and processes together to turn your production requirement into finished components.',caption:'PRODUCTION STUDY / AI-CREATED ILLUSTRATION',link:'/services',label:'Explore our production'}
];
function selectTab(i,focus=false){const t=tabs[i],buttons=$$('[data-tab]');buttons.forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;});if(focus)buttons[i].focus();$('#expertise-panel').setAttribute('aria-labelledby',buttons[i].id);$('#expertise-image').className='editorial-photo '+t.image;$('#expertise-image').setAttribute('aria-label','Illustrative '+t.alt);$('#expertise-title').replaceChildren(...t.title.split('\n').flatMap((line,n)=>n?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]));$('#expertise-copy').textContent=t.copy;$('#expertise-caption').textContent=t.caption;$('#photo-index').textContent=`0${i+1} / 03`;$('#expertise-link').href=t.link;$('#expertise-link').innerHTML=`${t.label} <span>↗</span>`;}
$$('[data-tab]').forEach((b,i)=>{b.onclick=()=>selectTab(i);b.onkeydown=e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%3;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+2)%3;if(e.key==='Home')next=0;if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();selectTab(next,true);}};});
const workflow=[
 'Client purchase orders connect to accepted stock, reservations, material shortages and production planning.',
 'Job cards connect compatible machines and moulds to shift production, inspection and quality-released stock.',
 'Accepted allocations connect to partial shipments, transport details, unit transfers and delivery acknowledgement.',
 'Confirmed dispatch prepares invoice drafts. Reviewed invoices connect to receipts, outstanding balances and internal follow-up.'
];
$$('[data-workflow]').forEach(b=>b.onclick=()=>{$$('[data-workflow]').forEach(el=>el.classList.toggle('active',el===b));$('#workflow-description').textContent=workflow[Number(b.dataset.workflow)];});
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target);}}),{threshold:.12});$$('.reveal').forEach(el=>reveal.observe(el));
const counts=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;counts.unobserve(e.target);const n=Number(e.target.dataset.count),suffix=e.target.dataset.suffix||'';if(reduced)return;const start=performance.now();const tick=t=>{const p=clamp((t-start)/1100);e.target.textContent=Math.round(n*(1-Math.pow(1-p,3)))+suffix;if(p<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);}),{threshold:.6});$$('[data-count]').forEach(el=>counts.observe(el));
addEventListener('pagehide',event=>{if(!event.persisted)scene.dispose();});

// All callout listeners must exist before the first projected-label update.
update();
