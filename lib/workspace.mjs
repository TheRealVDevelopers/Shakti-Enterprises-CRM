const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export const unitNames={'Unit 1':'Tooling operations','Unit 2':'Production operations',all:'All operations'};
const text=(v,max)=>String(v??'').trim().slice(0,max);
const elevated=a=>['admin','manager'].includes(a.role);
export class Workspace {
 constructor(engine){this.engine=engine;}
 visible(a,r){return (a.unit==='all'||r.unit===a.unit||(r.unit==='all'&&r.assignee===a.id))&& (r.creator===a.id||r.assignee===a.id||elevated(a));}
 snapshot(a){return Object.fromEntries(['notes','tasks'].map(t=>[t,this.engine.all(t).filter(r=>this.visible(a,r))]));}
 record(type,id,a){const r=this.engine.get(type,id);if(!this.visible(a,r))fail('This workspace item is private or outside your operations',403);return r;}
 save(type,b,a){
  if(!['notes','tasks'].includes(type))fail('Unknown workspace item');
  return this.engine.transaction(()=>{
   const old=b.id?this.record(type,b.id,a):null;
   if(old&&old.creator!==a.id&&!elevated(a))fail('Only the author or manager can edit this item',403);
   if(old&&old.version!==Number(b.version))fail('Item changed. Refresh before saving.',409);
   const unit=a.unit==='all'?(b.unit||old?.unit||'all'):a.unit;
   if(!['Unit 1','Unit 2','all'].includes(unit))fail('Choose valid operations');
   const title=text(b.title,160);if(!title)fail('A title is required');
   const r={...old,title,body:text(b.body,12000),unit,creator:old?.creator||a.id};
   if(type==='tasks'){
    if(!b.due||Number.isNaN(Date.parse(b.due)))fail('Choose a valid task date and time');
    this.engine.date(String(b.due).slice(0,10));
    if(old?.job)fail('Scheduled production is controlled through its job card');
    r.due=new Date(b.due).toISOString();r.assignee=text(b.assignee,100)||a.id;
    if(r.assignee!==a.id){const staff=this.engine.scope(a,this.engine.get('staff',r.assignee));if(!staff.active||(unit!=='all'&&staff.unit!==unit))fail('Choose an active employee in these operations');}
    r.priority=['normal','high'].includes(b.priority)?b.priority:'normal';
    r.status=['todo','in progress','done','cancelled'].includes(b.status)?b.status:'todo';
    r.automation=b.automation==='schedule'?'schedule':'none';
    if(r.automation==='schedule'){
     this.engine.allowed(a,'plan');if(b.approved!==true)fail('Review and approve the machine assignment');
     if(unit==='all')fail('Choose the operations for this production task');
     const p=b.payload||{};for(const [t,k] of [['orders','order'],['machines','machine'],['moulds','mould']]){const linked=this.engine.scope(a,this.engine.get(t,p[k]));if(linked.unit!==unit)fail('Order, mould and machine must belong to the selected operations');}
     if(!p.compatibilityReviewed)fail('Confirm technical compatibility');
     if(!Number.isFinite(Number(p.qty))||Number(p.qty)<=0||!Number.isFinite(Number(p.setupHours))||Number(p.setupHours)<0)fail('Enter positive pieces and non-negative setup time');
     if(!p.start||!p.end||Number.isNaN(Date.parse(p.start))||Number.isNaN(Date.parse(p.end))||Date.parse(p.end)<=Date.parse(p.start))fail('Choose valid production start and finish times');
     this.engine.date(String(p.start).slice(0,10));this.engine.date(String(p.end).slice(0,10));
     if(Date.parse(r.due)>Date.parse(p.start))fail('The task must run no later than the planned production start');
     r.payload={order:p.order,machine:p.machine,mould:p.mould,qty:Number(p.qty),setupHours:Number(p.setupHours),start:new Date(p.start).toISOString(),end:new Date(p.end).toISOString(),staff:p.staff||'',compatibilityReviewed:true};
     r.approvedBy=a.id;r.authority={id:a.id,role:a.role,unit:a.unit};
    }else{r.payload=null;r.authority=null;}
    r.lastError='';r.attemptedAt=null;
   }
   return this.engine.put(type,r,a,old?'workspace item revised':'workspace item created');
  });
 }
 status(b,a){return this.engine.transaction(()=>{const r=this.record('tasks',b.id,a);if(r.version!==Number(b.version))fail('Task changed. Refresh before continuing.',409);if(!['todo','in progress','done','cancelled'].includes(b.status))fail('Invalid task state');if(r.job)fail('Use the linked job workflow to update production');if(r.automation==='schedule'&&!elevated(a))fail('Only managers can change approved scheduling tasks',403);return this.engine.put('tasks',{...r,status:b.status,lastError:'',attemptedAt:null},a,'task status updated');});}
 runDue(now=new Date()){
  for(const task of this.engine.all('tasks').filter(t=>t.job&&!['done','cancelled'].includes(t.status))){
   const job=this.engine.get('jobs',task.job);
   if(['closed','cancelled'].includes(job.status))this.engine.put('tasks',{...task,status:job.status==='closed'?'done':'cancelled'},{id:'scheduler',unit:task.unit},'calendar task followed linked job completion');
  }
  for(const task of this.engine.all('tasks').filter(t=>t.automation==='schedule'&&t.status==='todo'&&!t.job&&!t.attemptedAt&&Date.parse(t.due)<=+now)){
   try{this.engine.transaction(()=>{
    const current=this.engine.get('tasks',task.id);if(current.job||current.status!=='todo'||current.attemptedAt)return;
    const a=current.authority;if(!a||!elevated(a))fail('Production scheduling approval required');
    if(Date.parse(current.payload.start)<+now-60000)fail('Planned start is in the past. Review the calendar and reschedule.');
    const job=this.engine._act('schedule',current.payload,a);
    this.engine.put('tasks',{...current,job:job.id,status:'in progress',attemptedAt:now.toISOString(),lastError:''},a,'approved calendar task scheduled production');
   });}catch(error){const current=this.engine.get('tasks',task.id);this.engine.put('tasks',{...current,status:'blocked',attemptedAt:now.toISOString(),lastError:error.message},{id:'scheduler',unit:task.unit},'calendar task blocked for review');}
  }
 }
}
export function detectPhoto(bytes,name){
 const ext=String(name).split('.').at(-1).toLowerCase();
 if(ext==='png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if(['jpg','jpeg'].includes(ext)&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(ext==='webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
 return null;
}
