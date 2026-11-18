export const workspaceRoutes=['overview','planner','orders','jobs','production','quality','machines','moulds','stock','materials','purchases','transfers','dispatches','invoices','receipts','followups','clients','components','staff','maintenance','downtime','enquiries','movements','reports','audit','settings'];
const aliases={dashboard:'overview',home:'overview','client-orders':'orders','production-planning':'jobs','raw-materials':'materials','finished-stock':'stock'};
export function resolveWorkspaceRoute(hash,allowed=workspaceRoutes){
 let requested;try{requested=decodeURIComponent(String(hash||'').replace(/^#/,'' )).replace(/\/+$/,'').toLowerCase();}catch{requested='';}
 const canonical=aliases[requested]||requested||'overview';return allowed.includes(canonical)?canonical:'overview';
}
export function canonicalPagePath(pathname,search=''){
 if(/[\\\x00-\x1f\x7f]/.test(pathname))return null;
 const normalized=pathname.replace(/\/{2,}/g,'/');if(normalized!==pathname)return normalized+search;
 if(pathname!=='/'&&pathname.endsWith('/'))return pathname.replace(/\/+$/,'')+search;
 if(pathname==='/index.html'||pathname==='/index')return '/'+search;
 if(pathname==='/dashboard'||pathname==='/overview')return '/crm'+search+'#overview';
 if(pathname.startsWith('/crm/')){const part=pathname.slice(5),canonical=aliases[part]||part;if(workspaceRoutes.includes(canonical))return '/crm'+search+'#'+canonical;}
 return null;
}
