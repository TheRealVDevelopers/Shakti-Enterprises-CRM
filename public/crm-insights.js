// Shared, deterministic dashboard calculations. No browser or server dependencies.
export const financeVisible=state=>['admin','accounts'].includes(state.actor?.role);
export function scoped(state,type,unit='all'){
 if(['invoices','receipts','credits','followups'].includes(type)&&!financeVisible(state))return [];
 const effective=state.actor?.unit&&state.actor.unit!=='all'?state.actor.unit:unit;
 return (Array.isArray(state[type])?state[type]:[]).filter(r=>effective==='all'||!r.unit||r.unit===effective||r.destination===effective);
}
export const openQuantity=o=>Math.max(0,Number(o.qty||0)-Number(o.cancelled||0)-Number(o.dispatched||0));
export const activeOrder=o=>!['cancelled','delivered'].includes(o.status)&&openQuantity(o)>0;
export const activeJob=j=>!['closed','cancelled'].includes(j.status);
export function stockReserved(state,id){return (state.orders||[]).filter(o=>o.status!=='cancelled').reduce((n,o)=>n+(o.allocations||[]).filter(a=>a.stock===id).reduce((n,a)=>n+Number(a.qty||0),0),0);}
export function stockFree(state,s){return s.status==='accepted'&&s.openingApproved!==false?Math.max(0,Number(s.qty||0)-stockReserved(state,s.id)):0;}
export function needsAttention(type,r,day){
 if(type==='orders')return activeOrder(r)&&r.due<=day;
 if(type==='jobs')return activeJob(r)&&r.end?.slice(0,10)<=day&&(r.accepted||0)<r.qty;
 if(type==='production')return Number(r.pending||0)+Number(r.hold||0)>0;
 if(type==='quality')return Number(r.hold||0)>0;
 if(type==='invoices')return r.status==='draft'||(Number(r.balance)>0&&r.due<=day);
 if(type==='materials')return r.status==='hold'||r.openingApproved===false;
 if(type==='stock')return ['hold','rejected'].includes(r.status);
 if(type==='transfers')return r.status==='in transit';
 if(type==='purchases')return r.status==='requested'||(r.status!=='received'&&r.expected<=day);
 if(type==='machines')return ['maintenance','breakdown'].includes(r.status);
 if(type==='moulds')return ['blocked','under repair','in transit'].includes(r.condition)||(r.serviceDate&&r.serviceDate<=day)||(r.serviceShots&&r.shots>=r.serviceShots);
 if(type==='maintenance')return r.status!=='complete'&&r.start?.slice(0,10)<=day;
 return false;
}
export function dashboardModel(state,unit,day){
 const list=t=>scoped(state,t,unit),orders=list('orders').filter(activeOrder),jobs=list('jobs').filter(activeJob),stock=list('stock'),invoices=list('invoices'),receipts=list('receipts'),production=list('production');
 const tasks=[],seen=new Set();
 function add(type,r,title,detail,group,action,priority='normal'){
  if(!r?.id)return;const key=type+'/'+r.id;if(seen.has(key))return;seen.add(key);
  tasks.push({key,type,id:r.id,title,detail,group,action,priority,unit:r.unit||'Shared'});
 }
 for(const o of orders)if(o.due<=day)add('orders',o,o.code,`${openQuantity(o).toLocaleString('en-IN')} pieces open · due ${o.due}`,'orders','Review order',o.due<day?'urgent':'today');
 for(const j of jobs)if(needsAttention('jobs',j,day))add('jobs',j,j.code,`${Math.max(0,j.qty-(j.accepted||0))} good pieces remaining`,'production','Review job','urgent');
 for(const p of production)if(needsAttention('production',p,day))add('production',p,p.code||'Shift awaiting quality',`${p.pending||0} pending · ${p.hold||0} held`,'quality','Inspect output','today');
 for(const m of list('materials'))if(needsAttention('materials',m,day))add('materials',m,m.code,m.openingApproved===false?'Opening balance needs count approval':'Material on quality hold','inventory','Review material','today');
 for(const s of stock)if(s.status==='hold')add('stock',s,'Finished stock on hold',`${s.qty} pieces · ${s.location||'Quality hold'}`,'quality','Inspect stock','today');
 for(const p of list('purchases'))if(needsAttention('purchases',p,day))add('purchases',p,p.code,p.status==='requested'?'Supplier purchase awaiting owner approval':`Supplier receipt due ${p.expected}`,'inventory','Review purchase',p.status==='requested'?'normal':'today');
 for(const t of list('transfers'))if(t.status==='in transit')add('transfers',t,t.code,`${t.unit} → ${t.destination} · awaiting receipt`,'inventory','Confirm receipt');
 for(const i of invoices)if(needsAttention('invoices',i,day))add('invoices',i,i.code,i.status==='draft'?'Dispatch prepared this draft for accounts review':`Balance ${Number(i.balance).toLocaleString('en-IN')} · due ${i.due}`,'finance',i.status==='draft'?'Review invoice':'Follow up',i.status==='draft'?'normal':i.due<day?'urgent':'today');
 for(const m of list('machines'))if(needsAttention('machines',m,day))add('machines',m,m.code,`${m.name} · ${m.status}`,'production','Review equipment','urgent');
 for(const m of list('moulds'))if(needsAttention('moulds',m,day))add('moulds',m,m.code,`${m.location||m.unit} · service / condition needs review`,'production','Review mould','today');
 const alertTypes={delivery:'orders',payment:'invoices',transfer:'transfers',production:'jobs'};
 for(const a of state.alerts||[]){const type=alertTypes[a.kind]||(list('machines').some(m=>m.id===a.record)?'machines':'moulds');const r=list(type).find(r=>r.id===a.record);if(r)add(type,r,a.title,a.detail,a.kind==='payment'?'finance':a.kind==='delivery'?'orders':'production','Review record',a.severity==='critical'?'urgent':'today');}
 const rank={urgent:0,today:1,normal:2};tasks.sort((a,b)=>rank[a.priority]-rank[b.priority]||a.title.localeCompare(b.title));
 return {orders,jobs,stock,invoices,receipts,production,tasks,
  freePieces:stock.reduce((n,s)=>n+stockFree(state,s),0),
  reservedPieces:stock.filter(s=>s.status==='accepted').reduce((n,s)=>n+stockReserved(state,s.id),0),
  openPieces:orders.reduce((n,o)=>n+openQuantity(o),0),
  goodTarget:jobs.reduce((n,j)=>n+j.qty,0),goodDone:jobs.reduce((n,j)=>n+(j.accepted||0),0),
  pendingQuality:production.reduce((n,p)=>n+(p.pending||0)+(p.hold||0),0),
  outstanding:invoices.filter(i=>i.status!=='draft').reduce((n,i)=>n+(i.balance||0),0),
  overdue:invoices.filter(i=>i.status!=='draft'&&i.due<day).reduce((n,i)=>n+(i.balance||0),0),
  advances:receipts.reduce((n,r)=>n+(r.unallocated||0),0),
  machines:list('machines'),moulds:list('moulds'),
  materials:list('materials'),purchases:list('purchases'),transfers:list('transfers'),
  dispatches:list('dispatches'),staff:list('staff')
 };
}
export function relatedRecords(state,type,r){
 const links=[],seen=new Set();
 const add=(t,x,label)=>{if(!x||(!financeVisible(state)&&['invoices','receipts','followups','credits'].includes(t)))return;const key=t+'/'+x.id;if(seen.has(key)||key===type+'/'+r.id)return;seen.add(key);links.push({type:t,id:x.id,label:label||x.code||x.name||t,status:x.status||x.condition||'',unit:x.unit||''});};
 const find=(t,id)=> (state[t]||[]).find(x=>x.id===id);
 const order=type==='orders'?r:r.order?find('orders',r.order):r.job?find('orders',find('jobs',r.job)?.order):null;
 if(order){add('orders',order);add('clients',find('clients',order.client));add('components',find('components',order.component));
  for(const j of state.jobs||[])if(j.order===order.id){add('jobs',j);add('machines',find('machines',j.machine));add('moulds',find('moulds',j.mould));for(const p of state.production||[])if(p.job===j.id)add('production',p,`${p.date||'Shift'} · ${p.total||0} pieces`);}
  for(const d of state.dispatches||[])if(d.order===order.id)add('dispatches',d);
  for(const i of state.invoices||[])if(i.order===order.id)add('invoices',i);
 }
 if(r.client)add('clients',find('clients',r.client));if(r.component)add('components',find('components',r.component));
 if(type==='invoices')for(const receipt of state.receipts||[])if((receipt.allocations||[]).some(a=>a.invoice===r.id))add('receipts',receipt);
 if(type==='receipts')for(const a of r.allocations||[])add('invoices',find('invoices',a.invoice));
 if(type==='clients')for(const o of state.orders||[])if(o.client===r.id)add('orders',o);
 if(type==='machines'||type==='moulds')for(const j of state.jobs||[])if(j[type==='machines'?'machine':'mould']===r.id)add('jobs',j);
 return links;
}
