// Each close view is an optical move within the same room photograph.
function createUnitCamera(film, navigate) {
  const points = [
    {cx:.148, cy:.63, x:.115, y:.60, portraitCy:.548, portraitY:.532, span:.29},
    {cx:.450, cy:.60, x:.404, y:.56, portraitCy:.54, portraitY:.521, span:.355},
    {cx:.810, cy:.56, x:.74, y:.55, portraitCy:.532, portraitY:.518, span:.385}
  ];
  const wide = {cx:.5, cy:.5, x:.5, y:.5, span:1};
  const keys = [
    [unitEntry,wide],[31,wide],[34.5,points[0]],[39,points[1]],
    [43.5,points[2]],[47.8,wide],[unitExit,wide]
  ];
  const layer = document.createElement('div');
  layer.className = 'unit-camera';
  layer.hidden = true;
  const frame = document.createElement('div');
  frame.className = 'unit-panorama';
  frame.setAttribute('role','group');
  frame.setAttribute('aria-label','Tooling operations with the 40-tonne press on the left, 90-tonne in the centre and 90-tonne servo on the right');
  const signs = unitPresses.map((press,i)=>{
    const sign = document.createElement('button');
    sign.type='button';
    sign.className='unit-sign';
    sign.style.left=points[i].cx*100+'%';
    sign.textContent=press.tonnes+' t';
    sign.setAttribute('aria-label','Approach the '+press.tonnes+'-tonne press');
    sign.onclick=()=>navigate(press.time);
    frame.append(sign);
    return sign;
  });
  layer.append(frame);
  film.append(layer);
  const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
  const mix=(a,b,n)=>a+(b-a)*n;
  function update(time, stationIndex, reducedMotion) {
    if(time<=unitEntry || time>=unitExit) {layer.hidden=true;return null;}
    layer.hidden=false;
    const w=film.clientWidth, h=film.clientHeight;
    const mobile=w/h<.9;
    frame.classList.toggle('portrait',mobile);
    const right=keys.findIndex(key=>key[0]>=time);
    const [ta,a]=keys[right-1], [tb,b]=keys[right];
    const s=(time-ta)/(tb-ta);
    const p=reducedMotion?Number(s>=.5):s*s*(3-2*s);
    function pose(point) {
      const overview=point===wide;
      // Reveal the complete wall first. Keep an entire station visible on a narrow screen.
      const width=overview ? (mobile?w:Math.min(w,h*2.45)) : w/(mobile ? point.span : point.span+.20);
      const height=mobile ? Math.max(h,width*1672/941) : width/2;
      const x=overview ? (w-width)/2 : clamp(w*.50-point.cx*width,w-width,0);
      const baseline=mobile ? .435 : .52;
      const y=overview ? (h-height)/2 : h*baseline-(mobile?point.portraitCy:point.cy)*height;
      return {width,height,x,y};
    }
    const pa=pose(a), pb=pose(b);
    const width=mix(pa.width,pb.width,p), height=mix(pa.height,pb.height,p), x=mix(pa.x,pb.x,p), y=mix(pa.y,pb.y,p);
    frame.style.width=width+'px';
    frame.style.height=height+'px';
    frame.style.transform='translate3d('+x+'px,'+y+'px,0)';
    layer.style.opacity=clamp(Math.min((time-unitEntry)/1.1,(unitExit-time)/1.1),0,1);
    signs.forEach(el=>{el.hidden=time<30.2 || time>31.95;});
    const point=points[stationIndex];
    return point?[(x+point.x*width)/w*100,(y+(mobile?point.portraitY:point.y)*height)/h*100]:null;
  }
  return {update};
}
