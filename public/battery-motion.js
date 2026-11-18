export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const batteryViews={front:{yaw:.46,pitch:0},perspective:{yaw:-.08,pitch:0},side:{yaw:-1.03,pitch:0},top:{yaw:-.08,pitch:.42}};
export const nearestYaw=(wanted,around)=>around+Math.atan2(Math.sin(wanted-around),Math.cos(wanted-around));
export function cameraTargets(input={}){return {yaw:Number.isFinite(input.yaw)?input.yaw:-.08,pitch:clamp(Number(input.pitch)||0,-.32,.48),zoom:clamp(Number(input.zoom)||1,.72,1.55),explode:clamp(Number(input.explode)||0,0,1)};}
export function approach(current,target,dt=16,reduced=false){const next={},weight=reduced?1:1-Math.exp(-clamp(dt,1,50)/75);let settled=true;for(const key of Object.keys(target)){const gap=target[key]-current[key];next[key]=Math.abs(gap)<.0008?target[key]:current[key]+gap*weight;if(Math.abs(target[key]-next[key])>.0008)settled=false;}return {value:next,settled};}
