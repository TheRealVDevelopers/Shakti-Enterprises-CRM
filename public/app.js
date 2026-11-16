const menuToggle=document.querySelector('.menu-toggle');
const navLinks=document.querySelector('.nav-links');
menuToggle?.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';menuToggle.setAttribute('aria-expanded',String(open));navLinks.classList.toggle('open',open);});
navLinks?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menuToggle?.setAttribute('aria-expanded','false');navLinks.classList.remove('open');}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuToggle?.getAttribute('aria-expanded')==='true'){menuToggle.setAttribute('aria-expanded','false');navLinks.classList.remove('open');menuToggle.focus();}});
const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
document.getElementById('enquiry-form')?.addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);
  const message=['Hello Shakthi Enterprises, I would like to discuss a requirement.','',`Name: ${values.get('name')}`,values.get('company')?`Company: ${values.get('company')}`:'',`Service: ${values.get('service')}`,values.get('quantity')?`Quantity: ${values.get('quantity')}`:'','',`Requirement: ${values.get('message')}`].filter(line=>line!=='').join('\n');
  window.open(`https://wa.me/919902831454?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
});
const slides=[...document.querySelectorAll('[data-catalogue-page]')];
if(slides.length){const tabs=[...document.querySelectorAll('[data-page]')],previous=document.getElementById('previous'),next=document.getElementById('next'),counter=document.getElementById('page-counter');let current=0;function show(index){current=Math.max(0,Math.min(slides.length-1,index));slides.forEach((slide,i)=>slide.hidden=i!==current);tabs.forEach((tab,i)=>tab.setAttribute('aria-current',String(i===current)));previous.disabled=current===0;next.disabled=current===slides.length-1;counter.textContent=`${current+1} / ${slides.length}`;document.getElementById('page-title').textContent=tabs[current].dataset.title;}previous.addEventListener('click',()=>show(current-1));next.addEventListener('click',()=>show(current+1));tabs.forEach(tab=>tab.addEventListener('click',()=>show(Number(tab.dataset.page))));document.querySelector('.reader').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}});show(0);}
