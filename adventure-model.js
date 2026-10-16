export const SIZE={w:30,h:24};
export const stations=[{id:'power',x:6,y:5,name:'Power relay',kind:'circuit'},{id:'pipeline',x:23,y:6,name:'Release forge',kind:'pipeline'},{id:'service',x:22,y:18,name:'Service cluster',kind:'capacity'}];
export const salvage=[{id:0,x:5,y:18},{id:1,x:12,y:5},{id:2,x:25,y:13}];
export const core={x:15,y:12};
export const spawn={x:3,y:21};
export function freshAdventure(){return {version:1,sector:0,collected:[],repaired:[],shields:3,xp:0,assist:false,complete:false};}
export function loadAdventure(raw){try{const s=JSON.parse(raw);if(!s||s.version!==1||!Number.isInteger(s.sector)||s.sector<0||s.sector>9)return freshAdventure();return {...freshAdventure(),sector:s.sector,collected:Array.isArray(s.collected)?[...new Set(s.collected.filter(i=>[0,1,2].includes(i)))]:[],repaired:Array.isArray(s.repaired)?[...new Set(s.repaired.filter(i=>stations.some(v=>v.id===i)))]:[],shields:Number.isInteger(s.shields)&&s.shields>0&&s.shields<=3?s.shields:3,xp:Number.isInteger(s.xp)&&s.xp>=0?s.xp:0,assist:s.assist===true,complete:s.complete===true&&s.sector===9};}catch{return freshAdventure();}}
export function wallsFor(sector){const walls=new Set();for(let x=0;x<SIZE.w;x++){walls.add(`${x},0`);walls.add(`${x},${SIZE.h-1}`);}for(let y=0;y<SIZE.h;y++){walls.add(`0,${y}`);walls.add(`${SIZE.w-1},${y}`);}
  // Small islands leave the main streets connected in every district.
  for(const [x,y,w,h] of [[8,8,3,3],[18,2,2,3],[3,10,2,4],[23,9,3,2],[10,16,3,3],[18,15,2,2]])for(let a=x;a<x+w;a++)for(let b=y;b<y+h;b++)walls.add(`${a},${b}`);
  if(sector>3)for(let y=8;y<=10;y++)walls.add(`16,${y}`);
  if(sector>6)for(let x=6;x<=8;x++)walls.add(`${x},15`);
  return walls;
}
export function blocked(x,y,walls){return walls.has(`${Math.round(x)},${Math.round(y)}`);}
export function pathTo(from,to,walls){const start={x:Math.round(from.x),y:Math.round(from.y)},end={x:Math.round(to.x),y:Math.round(to.y)};
 const queue=[start],seen=new Set([`${start.x},${start.y}`]),parents=new Map();let found=false;
 for(let at=0;at<queue.length;at++){const p=queue[at];if(p.x===end.x&&p.y===end.y){found=true;break;}for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const n={x:p.x+dx,y:p.y+dy},key=`${n.x},${n.y}`;if(n.x<0||n.x>=SIZE.w||n.y<0||n.y>=SIZE.h||seen.has(key)||walls.has(key))continue;seen.add(key);parents.set(key,p);queue.push(n);}}
 if(!found)return [];const result=[];let p=end;while(p.x!==start.x||p.y!==start.y){result.push(p);p=parents.get(`${p.x},${p.y}`);}return result.reverse();
}
export function collect(state,id){if(![0,1,2].includes(id)||state.collected.includes(id))return state;return {...state,collected:[...state.collected,id],xp:state.xp+25};}
export function repair(state,id){if(!stations.some(s=>s.id===id)||state.repaired.includes(id))throw Error('Unknown or completed repair');if(state.collected.length<=state.repaired.length)throw Error('Find another repair cell first');return {...state,repaired:[...state.repaired,id],xp:state.xp+100};}
export function nextSector(state){if(state.complete)throw Error('Adventure already complete');if(state.repaired.length!==3)throw Error('All three systems must be restored');if(state.sector===9)return {...state,complete:true,xp:state.xp+500,shields:3};return {...freshAdventure(),sector:state.sector+1,xp:state.xp+500,assist:state.assist};}
export function nextObjective(state){const cell=salvage.find(s=>!state.collected.includes(s.id));if(state.collected.length<=state.repaired.length&&cell)return {type:'salvage',...cell,name:'Repair cell'};const station=stations.find(s=>!state.repaired.includes(s.id));return station?{type:'station',...station}:{type:'core',...core,name:'Nexus core'};}
const routes=[[[0,1],[1,1],[2,1]],[[0,1],[0,0],[1,0],[1,1],[2,1]],[[0,1],[0,2],[1,2],[2,2],[2,1]],[[0,1],[0,0],[1,0],[2,0],[2,1]]];
const direction=(a,b)=>b[0]>a[0]?1:b[0]<a[0]?3:b[1]>a[1]?2:0;
export function circuitFor(sector){const route=routes[sector%routes.length],tiles=Array.from({length:9},(_,i)=>({ports:[0,1],rotation:(sector+i)%4}));for(let i=0;i<route.length;i++){const p=route[i],prev=i?route[i-1]:[-1,1],next=i<route.length-1?route[i+1]:[3,1];tiles[p[1]*3+p[0]]={ports:[direction(p,prev),direction(p,next)],rotation:(sector+i+1)%4};}while(circuitConnected(tiles))tiles[3].rotation=(tiles[3].rotation+1)%4;return tiles;}
export function ports(tile){return tile.ports.map(d=>(d+tile.rotation)%4);}
export function circuitConnected(tiles){if(tiles.length!==9||!ports(tiles[3]).includes(3))return false;const q=[3],seen=new Set(q),delta=[[0,-1],[1,0],[0,1],[-1,0]];for(let at=0;at<q.length;at++){const id=q[at],x=id%3,y=Math.floor(id/3);if(id===5&&ports(tiles[id]).includes(1))return true;for(const d of ports(tiles[id])){const nx=x+delta[d][0],ny=y+delta[d][1],ni=ny*3+nx;if(nx<0||nx>2||ny<0||ny>2||seen.has(ni)||!ports(tiles[ni]).includes((d+2)%4))continue;seen.add(ni);q.push(ni);}}return false;}
export const pipelineSteps=['Build','Scan','Deploy','Verify'];
export function pipelineReady(sequence){return sequence.length===4&&sequence.every((s,i)=>s===pipelineSteps[i]);}
export function capacityTarget(sector){return {load:45+sector*5,perReplica:20,budget:Math.ceil((45+sector*5)/20)};}
export function capacityReady(replicas,sector){const t=capacityTarget(sector);return Number.isInteger(replicas)&&replicas*t.perReplica>=t.load&&replicas<=t.budget;}
