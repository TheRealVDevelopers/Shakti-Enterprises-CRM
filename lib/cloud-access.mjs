// Match the local server's attachment permissions before restoring private files.
export function requiredCloudFiles(engine,sessions,request){
 const path=(request.originalUrl||request.url).split('?')[0];
 const token=/__session=([a-f0-9]+)/.exec(request.headers.cookie||'')?.[1];
 const session=sessions.get(token);if(!session||session.expires<=Date.now())return [];
 const actor=session.actor;
 if(path.startsWith('/api/attachments/')){
  const attachment=engine.get('attachments',path.split('/').at(-1));
  engine.scope(actor,engine.get(attachment.type,attachment.record));
  if(['invoices','receipts','credits'].includes(attachment.type)&&!['admin','accounts'].includes(actor.role))throw Object.assign(Error('Access denied'),{status:403});
  return [attachment.id];
 }
 if(path==='/api/backup'&&actor.role==='admin')return engine.all('attachments').map(file=>file.id);
 return [];
}
