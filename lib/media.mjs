import {createReadStream,statSync} from 'node:fs';

// Paused scroll-scrubbed movies need byte seeking, including before full download.
export function serveMovie(req,res,file){
 const size=statSync(file).size;
 const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600'};
 let start=0,end=size-1,status=200;
 if(req.headers.range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!match||(!match[1]&&!match[2])){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});return res.end();}
  if(!match[1])start=Math.max(0,size-Number(match[2]));
  else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});return res.end();}
  status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length']=end-start+1;
 res.writeHead(status,headers);
 if(req.method==='HEAD')return res.end();
 const stream=createReadStream(file,{start,end});
 stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
