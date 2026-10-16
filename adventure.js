import {SIZE,stations,salvage,core,spawn,freshAdventure,loadAdventure,wallsFor,blocked,pathTo,collect,repair,nextSector,nextObjective,circuitFor,ports,circuitConnected,pipelineSteps,pipelineReady,capacityTarget,capacityReady} from './adventure-model.js';
import {chapters} from './chapters.js';
const $=id=>document.getElementById(id),canvas=$('adventure-canvas'),ctx=canvas.getContext('2d');
let saveData;try{saveData=loadAdventure(localStorage.getItem('root-adventure-v1'));}catch{saveData=freshAdventure();}
let active=false,player={...spawn},keys={},path=[],walls=wallsFor(saveData.sector),drones=[],time=0,last=0,invincible=0,pulseCooldown=0,pulseAnimation=0,wave=null,phase='explore',particles=[],repairing=null,puzzle=null,camera={x:0,y:0},w=innerWidth,h=innerHeight,tile=44;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function save(){try{localStorage.setItem('root-adventure-v1',JSON.stringify(saveData));}catch{message('Storage unavailable. Keep this tab open to retain adventure progress.');}}
function message(text){$('adv-message').textContent=text;}
function resize(){w=innerWidth;h=innerHeight;tile=w<700?54:48;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
addEventListener('resize',resize);resize();
function resetDrones(){drones=Array.from({length:2+Math.floor(saveData.sector/2)},(_,i)=>({x:14+i*2,y:4+(i*5)%15,baseX:14+i*2,baseY:4+(i*5)%15,stun:0,seed:i*2.7}));}
function initSector(){player={...spawn};path=[];walls=wallsFor(saveData.sector);wave=null;phase=saveData.complete?'complete':'explore';invincible=2;pulseCooldown=0;resetDrones();updateHud();}
function objective(){return saveData.complete?null:wave?{type:'core',...core,name:'Protect the core'}:nextObjective(saveData);}
function updateHud(){const ch=chapters[saveData.sector],o=objective();$('adv-sector').textContent=`DISTRICT ${saveData.sector+1} / 10 · ${ch.district}`;$('adv-title').textContent=saveData.complete?'Nexus is alive.':wave?'CORE DEFENSE':ch.name;
 $('adv-task').textContent=saveData.complete?'Every district is restored. Your adventure is saved.':wave?'Stay alive while Patch restores the core. Use EMP to repel drones.':o.type==='salvage'?'Find a glowing repair cell. Walk over it to collect it.':o.type==='station'?`Reach ${o.name} and press E to repair it.`:'All three systems are online. Reach the core and press E to defend it.';
 $('adv-stats').textContent=`${'♥'.repeat(saveData.shields)} · ${saveData.xp} XP · CELLS ${saveData.collected.length-saveData.repaired.length} · SYSTEMS ${saveData.repaired.length}/3`;
 $('adv-progress').style.width=wave?`${Math.min(100,wave.elapsed/wave.duration*100)}%`:`${saveData.repaired.length/3*100}%`;
 $('adv-assist').textContent=saveData.assist?'Assist on':'Assist off';$('adv-assist').setAttribute('aria-pressed',String(saveData.assist));
 $('adv-pulse').textContent=pulseCooldown>0?`EMP · ${Math.ceil(pulseCooldown)}s`:'EMP · SPACE';
 $('adv-follow').disabled=saveData.complete||!!wave;$('adv-interact').disabled=saveData.complete||!!wave;
}
function burst(x,y,color){if(reduced)return;for(let i=0;i<28;i++){const a=i/28*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*(1+Math.random()*3),vy:Math.sin(a)*(1+Math.random()*3),life:1,color});}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function modalOpen(){return $('adv-panel').open||$('adv-result').open;}
function walk(dx,dy,dt){const length=Math.hypot(dx,dy);if(!length)return;const speed=(keys.shift?4.7:3.5)*dt;const nx=player.x+dx/length*speed,ny=player.y+dy/length*speed;
 // Circle-like footprint checks stop the hero clipping through machine islands.
 const free=(x,y)=>[[-.23,-.23],[.23,-.23],[-.23,.23],[.23,.23]].every(([a,b])=>!blocked(x+a,y+b,walls));
 if(free(nx,player.y))player.x=nx;if(free(player.x,ny))player.y=ny;
}
function pulse(){if(!active||modalOpen()||pulseCooldown>0)return;pulseCooldown=3;pulseAnimation=.5;path=[];for(const drone of drones)if(distance(player,drone)<4.3){drone.stun=4;if(wave){drone.x=26;drone.y=3+Math.random()*17;}}message('EMP pulse! Nearby drones are stunned. Keep moving.');updateHud();}
function interact(){if(!active||modalOpen()||saveData.complete||wave)return;path=[];const station=stations.find(s=>distance(player,s)<1.7&&!saveData.repaired.includes(s.id));
 if(station){if(saveData.collected.length<=saveData.repaired.length){message('You need a repair cell. Follow the glowing salvage markers.');return;}openRepair(station);return;}
 if(saveData.repaired.length===3&&distance(player,core)<1.8){wave={elapsed:0,duration:12+saveData.sector};phase='defense';resetDrones();message('OVERSEER detected the repair. Protect the core until Patch finishes! Space triggers EMP.');updateHud();return;}
 message('Get close to an offline machine, then press E. Repair cells are collected by walking over them.');}
function openRepair(station){repairing=station;keys={};$('adv-panel-title').textContent=station.name;$('adv-panel-tag').textContent='HANDS-ON REPAIR · NO QUIZ';$('adv-panel-feedback').textContent='';$('adv-apply').disabled=false;
 if(station.kind==='circuit'){puzzle=circuitFor(saveData.sector);$('adv-panel-task').textContent='Rotate the wire tiles to connect INPUT on the left of the middle row to OUTPUT on the right. Every touching wire must connect.';}
 if(station.kind==='pipeline'){puzzle=[];$('adv-panel-task').textContent='Assemble the release pipeline. Select components in the order they must run: build an artifact, check it, release it, then check the running service.';}
 if(station.kind==='capacity'){puzzle=1;$('adv-panel-task').textContent='Balance capacity against the resource budget. Each replica serves 20 traffic units. Provide enough capacity without exceeding the approved replica budget.';}
 renderPuzzle();$('adv-panel').showModal();}
function renderPuzzle(){const root=$('adv-puzzle');root.replaceChildren();
 if(repairing.kind==='circuit'){
  const ends=document.createElement('div');ends.className='circuit-ends';ends.innerHTML='<span>INPUT → middle row</span><span>middle row → OUTPUT</span>';const grid=document.createElement('div');grid.className='circuit-grid';
  puzzle.forEach((wire,i)=>{const b=document.createElement('button');b.dataset.tile=String(i);b.setAttribute('aria-label',`Rotate wire row ${Math.floor(i/3)+1} column ${i%3+1}`);for(const d of ports(wire)){const arm=document.createElement('span');arm.className='wire';arm.style.transform=`rotate(${d*90}deg)`;b.append(arm);}const dot=document.createElement('span');dot.className='wire-dot';b.append(dot);b.onclick=()=>{wire.rotation=(wire.rotation+1)%4;renderPuzzle();$('adv-panel-feedback').textContent=circuitConnected(puzzle)?'Power path connected. Activate the repair.':'Keep rotating to complete the power path.';};grid.append(b);});root.append(ends,grid);
 }
 if(repairing.kind==='pipeline'){
  const track=document.createElement('div');track.className='pipeline-track';for(let i=0;i<4;i++){const slot=document.createElement('div');slot.className='pipeline-slot';slot.textContent=`${i+1} · ${puzzle[i]||'EMPTY'}`;track.append(slot);}const parts=document.createElement('div');parts.className='pipeline-parts';for(const text of ['Deploy','Verify','Build','Scan']){const b=document.createElement('button');b.textContent=text;b.disabled=puzzle.includes(text)||puzzle.length>=4;b.onclick=()=>{puzzle.push(text);renderPuzzle();};parts.append(b);}const reset=document.createElement('button');reset.textContent='Clear assembly';reset.onclick=()=>{puzzle=[];renderPuzzle();};parts.append(reset);root.append(track,parts);
 }
 if(repairing.kind==='capacity'){
  const target=capacityTarget(saveData.sector),metrics=document.createElement('div');metrics.className='capacity-display';for(const [label,value]of [['TRAFFIC',target.load],['CAPACITY',puzzle*20],['MAX REPLICAS',target.budget]]){const span=document.createElement('span'),strong=document.createElement('strong');span.textContent=label;strong.textContent=value;span.append(strong);metrics.append(span);}const control=document.createElement('div');control.className='capacity-control';const minus=document.createElement('button'),plus=document.createElement('button'),out=document.createElement('output');minus.textContent='−';minus.setAttribute('aria-label','Remove replica');plus.textContent='+';plus.setAttribute('aria-label','Add replica');out.textContent=`${puzzle} replicas`;minus.onclick=()=>{puzzle=Math.max(1,puzzle-1);renderPuzzle();};plus.onclick=()=>{puzzle=Math.min(9,puzzle+1);renderPuzzle();};control.append(minus,out,plus);root.append(metrics,control);
 }
}
$('adv-apply').onclick=()=>{if(!repairing)return;const success=repairing.kind==='circuit'?circuitConnected(puzzle):repairing.kind==='pipeline'?pipelineReady(puzzle):capacityReady(puzzle,saveData.sector);
 if(!success){$('adv-panel-feedback').textContent=repairing.kind==='circuit'?'The power path is still broken. Rotate matching wire ends.':repairing.kind==='pipeline'?'The assembly is unsafe. Build → Scan → Deploy → Verify. Clear it and rebuild.':'Capacity must meet traffic while staying within the replica budget.';return;}
 saveData=repair(saveData,repairing.id);save();burst(repairing.x,repairing.y,chapters[saveData.sector].color);message(`${repairing.name} restored! ${repairing.kind==='circuit'?'A service needs a complete reachable dependency path.':repairing.kind==='pipeline'?'Validate an immutable artifact before deployment, then verify the service.':'Capacity must satisfy demand within an explicit resource budget.'}`);repairing=null;$('adv-panel').close();updateHud();};
$('adv-panel-close').onclick=()=>$('adv-panel').close();$('adv-panel').addEventListener('close',()=>{repairing=null;keys={};});
function victory(){wave=null;phase='victory';path=[];keys={};burst(core.x,core.y,chapters[saveData.sector].color);$('adv-result-tag').textContent=`DISTRICT ${saveData.sector+1} RESTORED`;$('adv-result-title').textContent=saveData.sector===9?'OVERSEER is contained.':'The lights are back.';$('adv-result-text').textContent=chapters[saveData.sector].outro+' +500 district XP. Your repair progress is checkpointed.';$('adv-next').textContent=saveData.sector===9?'SAVE THE CITY →':'NEXT DISTRICT →';$('adv-result').showModal();}
$('adv-next').onclick=()=>{if(phase!=='victory')return;saveData=nextSector(saveData);save();$('adv-result').close();initSector();message(saveData.complete?'Nexus is safe. You completed an adventure, not a questionnaire. Training mode remains available from the title screen.':chapters[saveData.sector].intro);};
$('adv-result').addEventListener('cancel',e=>e.preventDefault());
function tick(dt){if(!active||modalOpen()||saveData.complete)return;time+=dt;invincible=Math.max(0,invincible-dt);pulseCooldown=Math.max(0,pulseCooldown-dt);pulseAnimation=Math.max(0,pulseAnimation-dt);
 let dx=Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft)),dy=Number(!!(keys.s||keys.arrowdown))-Number(!!(keys.w||keys.arrowup));
 if(dx||dy)path=[];else if(path.length){const target=path[0];dx=target.x-player.x;dy=target.y-player.y;if(Math.hypot(dx,dy)<.12){player={...target};path.shift();dx=dy=0;if(!path.length)message('Destination reached. Press E to interact with the machine.');}}
 walk(dx,dy,dt);
 for(const item of salvage)if(!saveData.collected.includes(item.id)&&distance(player,item)<.75){saveData=collect(saveData,item.id);save();burst(item.x,item.y,'#ffcd87');message('Repair cell collected! Carry it to an offline machine.');updateHud();}
 for(const drone of drones){drone.stun=Math.max(0,drone.stun-dt);if(drone.stun)continue;let tx,ty;
 if(wave||distance(player,drone)<5){tx=player.x;ty=player.y;}else{tx=drone.baseX+Math.sin(time*.55+drone.seed)*3;ty=drone.baseY+Math.cos(time*.4+drone.seed)*2;}
 const length=Math.hypot(tx-drone.x,ty-drone.y);if(length>.05){const speed=(wave?1.25+saveData.sector*.05:.9)*dt;drone.x+=(tx-drone.x)/length*speed;drone.y+=(ty-drone.y)/length*speed;}
 if(distance(player,drone)<.65&&invincible<=0&&!saveData.assist){saveData.shields--;invincible=2;burst(player.x,player.y,'#ff8d9d');message('Drone hit! Move away or use EMP.');if(saveData.shields<=0){saveData.shields=3;player={...spawn};path=[];if(wave){wave=null;phase='explore';}resetDrones();invincible=3;message('Patch rescued you. Cells and completed repairs are safe. Return to the core when ready.');}save();updateHud();}
 }
 if(wave){wave.elapsed+=dt;if(wave.elapsed>=wave.duration)victory();}
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}particles=particles.filter(p=>p.life>0);updateHud();}
function project(x,y){return {x:x*tile-camera.x+w/2,y:y*tile-camera.y+h/2};}
function draw(){if(!active)return;const clampCamera=(value,view,cells)=>{const low=view/2-tile/2,high=(cells-.5)*tile-view/2;return high<low?(cells-1)*tile/2:Math.max(low,Math.min(high,value));};camera={x:clampCamera(player.x*tile,w,SIZE.w),y:clampCamera(player.y*tile,h,SIZE.h)};ctx.fillStyle='#06111c';ctx.fillRect(0,0,w,h);const color=chapters[saveData.sector].color;
 for(let y=0;y<SIZE.h;y++)for(let x=0;x<SIZE.w;x++){const p=project(x,y);if(p.x<-tile||p.x>w+tile||p.y<-tile*2||p.y>h+tile)continue;
  const wall=walls.has(`${x},${y}`);ctx.fillStyle=(x+y)%2?'#112735':'#102330';ctx.fillRect(p.x-tile/2,p.y-tile/2,tile,tile);ctx.strokeStyle='#34566922';ctx.strokeRect(p.x-tile/2,p.y-tile/2,tile,tile);
  if(wall){ctx.fillStyle='#0005';ctx.fillRect(p.x-tile*.35+6,p.y-tile*.38+8,tile*.78,tile*.82);ctx.fillStyle='#1b3548';ctx.fillRect(p.x-tile*.4,p.y-tile*.45,tile*.8,tile*.78);ctx.fillStyle='#2c4a5c';ctx.fillRect(p.x-tile*.4,p.y-tile*.55,tile*.8,tile*.18);ctx.fillStyle=color+'66';for(let i=0;i<3;i++)ctx.fillRect(p.x-tile*.26,p.y-tile*.22+i*tile*.16,tile*.43,2);}
  else if(x%5===0){ctx.fillStyle=color+'15';ctx.fillRect(p.x-1,p.y-tile/2,2,tile);}
 }
 // A faint route is a movement aid; it never ignores collisions or repairs for you.
 if(path.length){ctx.strokeStyle=color+'60';ctx.setLineDash([5,8]);ctx.beginPath();const first=project(player.x,player.y);ctx.moveTo(first.x,first.y);for(const point of path){const p=project(point.x,point.y);ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.setLineDash([]);}
 for(const item of salvage)if(!saveData.collected.includes(item.id)){const p=project(item.x,item.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.shadowColor='#ffc778';ctx.shadowBlur=reduced?0:15;ctx.fillStyle='#ffd796';ctx.fillRect(-9,-9,18,18);ctx.restore();ctx.fillStyle='#e7cdaa';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('REPAIR CELL',p.x,p.y+25);}
 for(const station of stations){const p=project(station.x,station.y),ready=saveData.repaired.includes(station.id);ctx.shadowColor=ready?color:'#ff9d78';ctx.shadowBlur=reduced?0:12;ctx.fillStyle=ready?'#2e6a63':'#754a3d';ctx.fillRect(p.x-22,p.y-22,44,38);ctx.shadowBlur=0;ctx.fillStyle=ready?color:'#ffc18c';ctx.fillRect(p.x-15,p.y-17,30,13);ctx.fillStyle='#b4cdd6';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(station.name.toUpperCase(),p.x,p.y+34);ctx.fillStyle=ready?color:'#edac8c';ctx.fillText(ready?'ONLINE':'OFFLINE',p.x,p.y+47);}
 const hub=project(core.x,core.y);ctx.strokeStyle=wave?'#ff8d9d':color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(hub.x,hub.y,29,0,Math.PI*2);ctx.stroke();ctx.fillStyle=saveData.repaired.length===3?color+'35':'#23394a';ctx.fillRect(hub.x-15,hub.y-15,30,30);ctx.font='10px monospace';ctx.fillStyle=color;ctx.fillText(wave?'DEFEND CORE':'NEXUS CORE',hub.x,hub.y+48);
 for(const drone of drones){const p=project(drone.x,drone.y);ctx.fillStyle=drone.stun?'#77b9d0':'#e87689';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=reduced?0:13;ctx.beginPath();ctx.moveTo(p.x,p.y-13);ctx.lineTo(p.x+14,p.y+7);ctx.lineTo(p.x-14,p.y+7);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#14202c';ctx.fillRect(p.x-5,p.y-1,10,4);if(drone.stun){ctx.fillStyle='#c5f4fb';ctx.font='9px monospace';ctx.fillText('STUNNED',p.x,p.y-20);}}
 const hero=project(player.x,player.y);ctx.globalAlpha=invincible>0&&!reduced?.65+Math.sin(time*20)*.25:1;ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(hero.x,hero.y+12,12,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#38696a';ctx.beginPath();ctx.roundRect(hero.x-10,hero.y-15,20,25,5);ctx.fill();ctx.fillStyle='#172b37';ctx.beginPath();ctx.arc(hero.x,hero.y-18,11,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.fillRect(hero.x-7,hero.y-21,14,5);ctx.fillStyle='#172b37';ctx.fillRect(hero.x-8,hero.y+9,6,9);ctx.fillRect(hero.x+2,hero.y+9,6,9);ctx.globalAlpha=1;
 const bob=reduced?0:Math.sin(time*3)*3;ctx.fillStyle='#b5dbdc';ctx.beginPath();ctx.roundRect(hero.x+22,hero.y-30+bob,18,16,5);ctx.fill();ctx.fillStyle='#123044';ctx.fillRect(hero.x+25,hero.y-26+bob,12,7);ctx.fillStyle=color;ctx.fillRect(hero.x+27,hero.y-24+bob,2,2);ctx.fillRect(hero.x+32,hero.y-24+bob,2,2);
 if(pulseAnimation>0){ctx.strokeStyle=color+Math.floor(pulseAnimation*400).toString(16).padStart(2,'0');ctx.lineWidth=3;ctx.beginPath();ctx.arc(hero.x,hero.y,(.5-pulseAnimation)*tile*8,0,Math.PI*2);ctx.stroke();}
 for(const particle of particles){const p=project(particle.x,particle.y);ctx.globalAlpha=Math.max(0,particle.life);ctx.fillStyle=particle.color;ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;ctx.textAlign='left';
 const target=objective();if(target){const p=project(target.x,target.y),edgeX=Math.max(24,Math.min(w-24,p.x)),edgeY=Math.max(65,Math.min(h-40,p.y));if(p.x<0||p.x>w||p.y<0||p.y>h){ctx.fillStyle=color;ctx.font='24px sans-serif';ctx.textAlign='center';ctx.fillText('◆',edgeX,edgeY);ctx.font='10px monospace';ctx.fillText(target.name,edgeX,edgeY+18);ctx.textAlign='left';}}
}
function frame(t){const dt=Math.min((t-last)/1000,.06);last=t;tick(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
$('adventure-start').onclick=()=>{active=true;document.body.classList.add('adventure-active');$('adventure-canvas').hidden=false;$('adventure-hud').hidden=false;initSector();message(saveData.complete?'You saved Nexus. The 500-question training mode is available from the title screen.':'Patch: Find three glowing repair cells. Restore the machines, then defend the core. No questions block this adventure.');};
$('adv-pause').onclick=()=>{active=false;keys={};path=[];save();document.body.classList.remove('adventure-active');$('adventure-canvas').hidden=true;$('adventure-hud').hidden=true;$('adventure-start').textContent='RESUME ADVENTURE ↗';};
$('adv-follow').onclick=()=>{const o=objective();if(!o||wave)return;path=pathTo(player,o,walls);message(`Following a safe street route to ${o.name}. You can steer manually at any time.`);};
$('adv-interact').onclick=interact;$('adv-pulse').onclick=pulse;
$('adv-assist').onclick=()=>{saveData.assist=!saveData.assist;save();updateHud();message(saveData.assist?'Assist mode: drones cannot damage you. Every repair and objective still requires play.':'Drone damage is active. Use movement and EMP to stay safe.');};
$('adv-help').onclick=()=>{message('WASD / arrows: move. Shift: sprint. E: interact. Space: EMP. Tap the ground to walk there. Collect cells, solve repair mini-games, then defend the core. Assist disables drone damage.');};
canvas.addEventListener('pointerdown',e=>{if(!active||modalOpen())return;const x=Math.round((e.clientX-w/2+camera.x)/tile),y=Math.round((e.clientY-h/2+camera.y)/tile);path=pathTo(player,{x,y},walls);});
addEventListener('keydown',e=>{if(!active||modalOpen()||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();keys[key]=true;if(key==='e'&&!e.repeat)interact();if(key===' '&&!e.repeat)pulse();});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>keys={});
document.querySelectorAll('[data-adv-dir]').forEach(b=>{const k={up:'w',down:'s',left:'a',right:'d'}[b.dataset.advDir];b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[k]=true;};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys[k]=false);});

if(saveData.xp>0)$('adventure-start').textContent='RESUME ADVENTURE ↗';
