// Original procedural game world. Raster key art is used on title and story screens.
export class NexusWorld {
  constructor(canvas, getState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getState = getState;
    this.player = {x: 0, y: 4};
    this.keys = {};
    this.particles = [];
    this.walking = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.last = 0;
    this.resize = this.resize.bind(this);
    addEventListener('resize', this.resize);
    addEventListener('blur', () => this.clearKeys());
    this.resize();
    requestAnimationFrame(t => this.frame(t));
  }
  resize() {
    this.w = innerWidth; this.h = innerHeight;
    const d = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = this.w * d; this.canvas.height = this.h * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.scale = Math.min(this.w / (this.w < 700 ? 15 : 22), this.h / 15);
  }
  clearKeys() { this.keys = {}; }
  near(beacon) {return Math.hypot(this.player.x - beacon[0], this.player.y - beacon[1]) < 1.8;}
  reset() {this.player = {x: 0, y: 4}; this.target = null; this.clearKeys();}
  follow(beacon) {this.target = {x: beacon[0], y: beacon[1]}; if (this.reduced || this.near(beacon)) {this.player = {...this.target}; this.target = null; this.onArrive?.();}}
  burst(color) {
    if (this.reduced) return;
    const point = this.project(this.player.x, this.player.y, .5);
    for (let i = 0; i < 45; i++) {
      const angle = i / 45 * Math.PI * 2, speed = 40 + Math.random() * 110;
      this.particles.push({x: point.x, y: point.y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-40, life: 1, color});
    }
  }
  project(x, y, z = 0) {
    return {x: this.w * (this.w < 700 ? .5 : .54) + (x-y)*this.scale, y: this.h*.57 + (x+y)*this.scale*.45-z*this.scale};
  }
  polygon(points, fill, stroke) {
    const ctx = this.ctx;
    ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));ctx.closePath();
    if (fill) {ctx.fillStyle = fill; ctx.fill();}
    if (stroke) {ctx.strokeStyle = stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  block(x, y, width, depth, height, color, roof='#30465b', base=0) {
    const p=(a,b,z)=>this.project(a,b,z);
    this.polygon([p(x,y,base),p(x+width,y,base),p(x+width,y,base+height),p(x,y,base+height)],color);
    this.polygon([p(x+width,y,base),p(x+width,y+depth,base),p(x+width,y+depth,base+height),p(x+width,y,base+height)],'#102032');
    this.polygon([p(x,y,base+height),p(x+width,y,base+height),p(x+width,y+depth,base+height),p(x,y+depth,base+height)],roof,'#678a9b28');
  }
  update(dt, state) {
    if (!state.moving) {this.clearKeys(); return;}
    let dx = 0, dy = 0;
    if (this.keys.w || this.keys.arrowup) {dx--; dy--;}
    if (this.keys.s || this.keys.arrowdown) {dx++; dy++;}
    if (this.keys.a || this.keys.arrowleft) {dx--; dy++;}
    if (this.keys.d || this.keys.arrowright) {dx++; dy--;}
    if (dx || dy) this.target = null;
    if (this.target) {
      dx=this.target.x-this.player.x;dy=this.target.y-this.player.y;
      if (Math.hypot(dx,dy)<.06) {this.player={...this.target};this.target=null;dx=dy=0;this.onArrive?.();}
    }
    this.walking = !!(dx || dy);
    const magnitude=Math.hypot(dx,dy);
    if(magnitude) {
      const distance=Math.min(dt*3.5,this.target?magnitude:100);
      this.player.x=Math.max(-5.8,Math.min(5.8,this.player.x+dx/magnitude*distance));
      this.player.y=Math.max(-5.8,Math.min(5.8,this.player.y+dy/magnitude*distance));
    }
  }
  building(x,y,index,state,t) {
    const high=1.3+((index*7+state.chapter*3)%11)*.18;
    const alive=index < Math.floor(state.completed/500*(this.towerCount || 39));
    const glow=alive?state.color:'#728ba4';
    this.block(x,y,.95,.95,high,alive?'#264c4c':'#1a3045');
    // Small rooftop modules and luminous server strips make every tower readable.
    this.block(x+.2,y+.2,.5,.5,.16,'#294453','#3e5a6b',high);
    for(let row=0;row<Math.floor(high*3);row++) {
      const a=this.project(x+.12,y-.01,.28+row*.31),b=this.project(x+.76,y-.01,.28+row*.31);
      this.ctx.strokeStyle=glow+(alive?'b0':'45');this.ctx.lineWidth=2;
      this.ctx.beginPath();this.ctx.moveTo(a.x,a.y);this.ctx.lineTo(b.x,b.y);this.ctx.stroke();
    }
    const antenna=this.project(x+.48,y+.48,high+.3);
    this.ctx.fillStyle=alive?state.color:'#ee987c';
    this.ctx.globalAlpha=this.reduced?.8:.55+Math.sin(t/700+index)*.3;
    this.ctx.fillRect(antenna.x-1.5,antenna.y-5,3,5);this.ctx.globalAlpha=1;
  }
  drawHero(t,state) {
    const ctx=this.ctx,p=this.project(this.player.x,this.player.y,.08);
    const bob=this.reduced?0:(this.walking?Math.sin(t/75)*1.2:Math.sin(t/500)*.6);
    const size=Math.max(.75,this.scale/43);
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(size,size);
    ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(0,4,12,5,0,0,Math.PI*2);ctx.fill();
    ctx.translate(0,bob);ctx.fillStyle='#15202d';ctx.fillRect(-7,-6,5,12);ctx.fillRect(2,-6,5,12);
    ctx.fillStyle='#34575d';ctx.beginPath();ctx.roundRect(-10,-27,20,23,6);ctx.fill();
    ctx.fillStyle='#183238';ctx.beginPath();ctx.roundRect(-10,-39,20,20,9);ctx.fill();
    ctx.fillStyle='#b8e0df';ctx.fillRect(-6,-31,12,5);ctx.fillStyle=state.color;ctx.fillRect(-7,-25,14,2);
    ctx.fillStyle='#213746';ctx.fillRect(-14,-21,5,12);ctx.fillRect(9,-21,5,12);
    ctx.fillStyle='#ffca88';ctx.fillRect(-12,-18,3,5);ctx.restore();
    const robot=this.project(this.player.x+.65,this.player.y-.35,.9+(this.reduced?0:Math.sin(t/350)*.1));
    ctx.save();ctx.translate(robot.x,robot.y);ctx.scale(size,size);ctx.shadowColor=state.color;ctx.shadowBlur=15;
    ctx.fillStyle='#a6c8cb';ctx.beginPath();ctx.roundRect(-10,-10,20,19,5);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#172d40';ctx.beginPath();ctx.roundRect(-7,-6,14,10,3);ctx.fill();
    ctx.fillStyle=state.color;ctx.fillRect(-5,-3,3,3);ctx.fillRect(2,-3,3,3);ctx.fillRect(-3,12,6,2);ctx.restore();
  }
  frame(t) {
    const dt=Math.min((t-this.last)/1000,.1);this.last=t;
    const state=this.getState();this.update(dt,state);
    const ctx=this.ctx;ctx.clearRect(0,0,this.w,this.h);
    if (!state.playing) {requestAnimationFrame(t=>this.frame(t));return;}
    const gradient=ctx.createLinearGradient(0,0,0,this.h);gradient.addColorStop(0,'#080e1c');gradient.addColorStop(1,'#142c3f');ctx.fillStyle=gradient;ctx.fillRect(0,0,this.w,this.h);
    for(let i=0;i<85;i++){ctx.fillStyle='#a8d5e335';ctx.fillRect(i*137%this.w,i*71%(this.h*.6),1,1);}
    // Floating district foundation, outer walkways and central plaza.
    this.block(-8,-8,16,16,.65,'#091421','#142639',-.7);
    this.polygon([this.project(-6,-6),this.project(6,-6),this.project(6,6),this.project(-6,6)],'#142c3a');
    for(let i=-6;i<=6;i++)for(const pair of [[this.project(i,-6),this.project(i,6)],[this.project(-6,i),this.project(6,i)]]) {
      ctx.strokeStyle='#6391a31c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pair[0].x,pair[0].y);ctx.lineTo(pair[1].x,pair[1].y);ctx.stroke();
    }
    let buildings=[];for(let x=-8;x<=7;x+=2)for(let y=-8;y<=7;y+=2)if(Math.abs(x)>5||Math.abs(y)>5)buildings.push({x,y,index:buildings.length});
    this.towerCount=buildings.length;
    buildings.sort((a,b)=>a.x+a.y-b.x-b.y);
    for(const b of buildings.filter(b=>b.x+b.y<0))this.building(b.x,b.y,b.index,state,t);
    // Circuit conduits across the plaza, progressively restored.
    for(let i=0;i<5;i++) {
      const p1=this.project(-5,i*2-4,.02),p2=this.project(5,i*2-4,.02);
      ctx.strokeStyle=state.color+(state.completed>i*100?'60':'15');ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
    }
    const beacon=this.project(...state.beacon,.05),pulse=this.reduced?1:1+Math.sin(t/450)*.1;
    const boss=(state.completed+1)%50===0;
    ctx.strokeStyle=state.color;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(beacon.x,beacon.y,this.scale*.55*pulse,this.scale*.24*pulse,0,0,Math.PI*2);ctx.stroke();
    if(boss){ctx.beginPath();ctx.ellipse(beacon.x,beacon.y,this.scale*.9,this.scale*.4,0,0,Math.PI*2);ctx.stroke();}
    const beam=ctx.createLinearGradient(0,beacon.y-160,0,beacon.y);beam.addColorStop(0,state.color+'00');beam.addColorStop(1,state.color+'40');ctx.fillStyle=beam;ctx.fillRect(beacon.x-13,beacon.y-160,26,160);
    ctx.fillStyle=state.color;ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(boss?'DISTRICT GUARDIAN':'RECOVERY SIGNAL',beacon.x,beacon.y-35);ctx.textAlign='left';
    this.drawHero(t,state);
    for(const b of buildings.filter(b=>b.x+b.y>=0))this.building(b.x,b.y,b.index,state,t);
    if(!this.reduced) {
      ctx.strokeStyle='#a7d5e01a';ctx.lineWidth=1;for(let i=0;i<35;i++){const x=(i*151+t*.018)%this.w,y=(i*97+t*.18)%this.h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+11);ctx.stroke();}
      this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
    }
    requestAnimationFrame(t=>this.frame(t));
  }
}
