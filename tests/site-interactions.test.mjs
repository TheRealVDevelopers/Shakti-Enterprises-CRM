import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
function page(name){
 const {document,window}=parseHTML(readFileSync(new URL('../public/'+name+'.html',import.meta.url),'utf8'));
 window.HTMLElement.prototype.showModal=function(){this.open=true;};window.HTMLElement.prototype.close=function(){this.open=false;};window.HTMLElement.prototype.focus=function(){};
 class ImageStub{decode(){return Promise.resolve();}}
 const context=vm.createContext({document,window,matchMedia:()=>({matches:true}),innerWidth:1440,innerHeight:900,scrollY:0,Image:ImageStub,navigator:{clipboard:{writeText:async()=>{}}},addEventListener:window.addEventListener.bind(window),requestAnimationFrame:fn=>fn(),setTimeout:()=>1,clearTimeout(){},console});
 for(const src of ['/app.js','/experience.js',...(name==='catalogue'?['/flipbook-v2.js']:[])])vm.runInContext(readFileSync(new URL('../public'+src,import.meta.url),'utf8'),context,{filename:src});
 return {document,window};
}
function story(name){
 const {document,window}=parseHTML(readFileSync(new URL('../public/'+name+'.html',import.meta.url),'utf8'));
 const context=vm.createContext({document,window,console});
 vm.runInContext(readFileSync(new URL('../public/stories.js',import.meta.url),'utf8'),context);
 return {document,window};
}
test('expanded company pages initialize and expose detailed, linked sections',()=>{
 for(const name of ['about','services','infrastructure','materials','quality','mould-making','plastic-applications','agriculture','battery-components','machinery','contact']){
 const {document}=story(name);assert.ok(document.querySelector('h1'));assert.ok(document.querySelectorAll('.story-block').length>=3);assert.ok(document.querySelector('.story-nav a[href="/mould-making"]'));for(const a of document.querySelectorAll('.story-jumps a'))assert.ok(document.querySelector(a.getAttribute('href')));}
 for(const name of ['catalogue'])assert.ok(page(name).document.querySelector('.menu-toggle'));
});
test('material explorer and machine process controls update their detailed explanations',()=>{
 const {document}=story('plastic-applications');document.querySelector('[data-material="PA"]').click();assert.match(document.querySelector('#material-output').textContent,/moisture/i);assert.equal(document.querySelector('#material-output a').getAttribute('href'),'/plastic-applications#pa');
 const tool=story('mould-making');tool.document.querySelector('[data-tool-step="3"]').click();assert.match(tool.document.querySelector('.tool-process-output h3').textContent,/Trial/);
 const m=story('machinery');m.document.querySelector('[data-cycle="2"]').click();assert.match(m.document.querySelector('#process-output').textContent,/Cooling channels/);m.document.querySelector('#capacity-range').value='500';m.document.querySelector('#capacity-range').dispatchEvent(new m.window.Event('input'));assert.match(m.document.querySelector('#capacity-copy').textContent,/500-tonne/);
});
test('tubular battery reference views switch between the supplied cutaway and exploded diagrams',()=>{const {document}=story('battery-components');assert.ok(document.querySelector('#retainers'));assert.ok(document.querySelector('#separators'));assert.ok(document.querySelector('#handles'));document.querySelector('[data-reference-view="exploded"]').click();assert.equal(document.querySelector('#battery-reference-image').getAttribute('src'),'/assets/battery-exploded-reference.png');assert.equal(document.querySelector('#battery-reference-link').getAttribute('href'),'/assets/battery-exploded-reference.png');document.querySelector('[data-reference-view="internal"]').click();assert.equal(document.querySelector('#battery-reference-image').getAttribute('src'),'/assets/battery-internal-reference.png');const home=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8')).document;assert.equal(home.querySelectorAll('[data-battery-part]').length,11);assert.ok(home.querySelector('#battery-cutaway'));});
test('internal selections open a reversible cutaway and manual separation survives page scrolling',async()=>{
 const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8')),updates=[];
 const stage=document.querySelector('#battery-journey');stage.getBoundingClientRect=()=>({top:-300});Object.defineProperty(stage,'offsetHeight',{value:1800});
 const context=vm.createContext({document,window,console,innerHeight:720,matchMedia:()=>({matches:false}),addEventListener:window.addEventListener.bind(window),requestAnimationFrame:fn=>fn(),modelFactory:()=>({available:false,update(...args){updates.push(args)},dispose(){}})});
 const source=readFileSync(new URL('../public/stories.js',import.meta.url),'utf8').replace("import('./battery-scene.js')",'Promise.resolve({createBatteryScene:modelFactory})');vm.runInContext(source,context);await new Promise(r=>setTimeout(r,0));
 document.querySelector('[data-battery-part="retainers"]').click();assert.equal(document.querySelector('#battery-cutaway').getAttribute('aria-pressed'),'true');
 document.querySelector('#battery-cutaway').click();assert.equal(document.querySelector('[data-battery-part="case"]').getAttribute('aria-pressed'),'true');assert.equal(document.querySelector('#battery-cutaway').getAttribute('aria-pressed'),'false');
 const event=new window.Event('battery-explode-input');event.detail={value:.43};document.querySelector('#battery-scene').dispatchEvent(event);window.dispatchEvent(new window.Event('scroll'));assert.equal(updates.at(-1)[0],.43);assert.equal(document.querySelector('#battery-expand').getAttribute('aria-pressed'),'true');
});
test('all eight catalogue chapters navigate to the intended page',async()=>{const {document}=page('catalogue');for(const chapter of document.querySelectorAll('[data-book-page]')){chapter.click();await new Promise(resolve=>setTimeout(resolve,0));const expected=Number(chapter.dataset.bookPage);assert.equal(Number(document.querySelector('#book-scene').dataset.page),expected);assert.equal(chapter.getAttribute('aria-current'),'true');}assert.equal(document.querySelector('#book-next').disabled,true);document.querySelector('#book-prev').click();await new Promise(resolve=>setTimeout(resolve,0));assert.ok(Number(document.querySelector('#book-scene').dataset.page)<7);});
test('catalogue view mode, reading mode and enlarged page all work',()=>{const {document}=page('catalogue');document.querySelector('#book-view').click();assert.equal(document.querySelector('#book-view').getAttribute('aria-pressed'),'true');assert.ok(document.querySelector('#book-scene').classList.contains('single'));document.querySelector('#book-focus').click();assert.ok(document.body.classList.contains('book-reading-mode'));document.querySelector('#book-focus').click();assert.ok(!document.body.classList.contains('book-reading-mode'));document.querySelector('#book-zoom').click();assert.equal(document.querySelector('#image-dialog').open,true);assert.match(document.querySelector('#image-dialog img').getAttribute('src'),/page-1\.jpg/);});
test('homepage navigation and preserved expertise initialize with the factory tour',()=>{
 const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 window.HTMLElement.prototype.focus=function(){};const stage=document.querySelector('#journey');Object.defineProperties(stage,{offsetHeight:{value:3060},offsetTop:{value:0}});let scroll=0,disposed=0;stage.getBoundingClientRect=()=>({top:-scroll});window.scrollTo=({top})=>{scroll=top;window.dispatchEvent(new window.Event('scroll'));};
 const location={hash:''},context=vm.createContext({document,window,location,history:{replaceState(a,b,hash){location.hash=hash;}},innerHeight:900,innerWidth:1440,matchMedia:()=>({matches:true}),addEventListener:window.addEventListener.bind(window),requestAnimationFrame:fn=>fn(0),IntersectionObserver:class{observe(){}unobserve(){}},performance:{now:()=>0},__dispose:()=>disposed++});
 const source=readFileSync(new URL('../public/landing.js',import.meta.url),'utf8').replace("import {createHeroBatteryScene} from './hero-battery-scene.js';",'const createHeroBatteryScene=()=>({update(){},dispose:__dispose});');vm.runInContext(source,context);
 document.querySelector('#world-toggle').click();assert.equal(document.querySelector('#world-menu').hidden,false);document.querySelector('.menu-trigger').click();assert.equal(document.querySelector('#full-menu').hidden,false);document.querySelector('.menu-close').click();assert.equal(document.querySelector('#full-menu').hidden,true);
 assert.ok(document.querySelector('#factory-tour'));assert.equal(document.querySelector('#factory-tour').getAttribute('src'),'/factory-tour/index.html');
 document.querySelector('[data-tab="1"]').click();assert.match(document.querySelector('#expertise-title').textContent,/tool shapes/);
});
