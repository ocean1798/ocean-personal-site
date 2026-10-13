/* eslint-disable */
// Scroll-linked PCB background below the hero: procedural tiles pre-rendered to offscreen canvases,
// stacked depth layers moved with translate3d only, per-section character crossfaded by scroll position.

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(seed){ let s=seed>>>0||1; return ()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0, s=(s+Math.imul(s^s>>>7,61|s))^s, ((s^s>>>14)>>>0)/4294967296)); }

function tile(w,h,dpr,fn){ const c=document.createElement('canvas'); c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); const g=c.getContext('2d'); g.scale(dpr,dpr); g.lineCap='round'; g.lineJoin='round'; fn(g,w,h); return c; }
// draw with wrap-around so tiles repeat seamlessly
function wrapDraw(w,h,f){ for(const dx of [-w,0,w]) for(const dy of [-h,0,h]) f(dx,dy); }
const CU='rgba(214,140,58,', NEON='rgba(184,255,60,', SILK='rgba(232,238,228,';

function via(g,x,y,r,a){ g.fillStyle=CU+(a)+')'; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.fillStyle='#050c09'; g.beginPath(); g.arc(x,y,r*.45,0,7); g.fill(); }
function fiducial(g,x,y,a){ g.fillStyle=CU+(a)+')'; g.beginPath(); g.arc(x,y,3,0,7); g.fill(); g.strokeStyle=SILK+(a*.6)+')'; g.lineWidth=.8; g.beginPath(); g.arc(x,y,7,0,7); g.stroke(); }
function regMark(g,x,y,a){ g.strokeStyle=SILK+a+')'; g.lineWidth=.9; g.beginPath(); g.arc(x,y,9,0,7); g.moveTo(x-15,y); g.lineTo(x+15,y); g.moveTo(x,y-15); g.lineTo(x,y+15); g.stroke(); }
// a routed fragment: orthogonal + 45° segments
function route(g,R,x,y,steps,len){ const pts=[[x,y]]; let dir=(R()*8|0)*Math.PI/4;
  for(let i=0;i<steps;i++){ const L=len*(.5+R()); x+=Math.cos(dir)*L; y+=Math.sin(dir)*L; pts.push([x,y]); dir+=(R()<.5?-1:1)*Math.PI/4*(R()<.6?1:2); dir=Math.round(dir/(Math.PI/4))*Math.PI/4; }
  return pts; }
function stroke(g,pts,dx,dy){ g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x+dx,y+dy):g.moveTo(x+dx,y+dy)); g.stroke(); }

const MAKERS={
  grid:(dpr)=>tile(512,512,dpr,(g,w,h)=>{ g.strokeStyle='rgba(184,255,60,.05)'; g.lineWidth=1; g.beginPath(); for(let i=0;i<16;i++){ const v=i*32+.5; g.moveTo(0,v); g.lineTo(w,v); g.moveTo(v,0); g.lineTo(v,h);} g.stroke();
    g.fillStyle='rgba(214,150,70,.24)'; for(let x=0;x<=w;x+=32) for(let y=0;y<=h;y+=32){ g.beginPath(); g.arc(x,y,1.3,0,7); g.fill(); } }),
  base:(dpr)=>tile(560,560,dpr,(g,w,h)=>{ const R=rng(7);
    for(let i=0;i<16;i++){ const pts=route(g,R,R()*w,R()*h,2+(R()*3|0),40); const wd=1+R()*1.6, a=.11+R()*.09;
      wrapDraw(w,h,(dx,dy)=>{ g.strokeStyle=CU+a+')'; g.lineWidth=wd; stroke(g,pts,dx,dy); const e=pts[pts.length-1]; via(g,e[0]+dx,e[1]+dy,3.4,a*1.6); }); }
    for(let i=0;i<10;i++){ const x=R()*w,y=R()*h; wrapDraw(w,h,(dx,dy)=>via(g,x+dx,y+dy,2.6,.16)); }
    const fx=R()*w,fy=R()*h; wrapDraw(w,h,(dx,dy)=>fiducial(g,fx+dx,fy+dy,.2));
    g.font='9px ui-monospace,monospace'; const marks=['R12','C7','TP3','U9','+','FB2','L4'];
    for(let i=0;i<5;i++){ const x=20+R()*(w-60),y=20+R()*(h-30); g.fillStyle=SILK+'.10)'; g.fillText(marks[i%marks.length],x,y); g.strokeStyle=SILK+'.07)'; g.strokeRect(x-4,y-11,26,15); } }),
  glow:(dpr)=>tile(1400,1800,.25,(g,w,h)=>{ const R=rng(3);
    for(let i=0;i<5;i++){ const x=R()*w,y=R()*h,r=220+R()*260, col=i%3===2?'184,255,60':'224,138,46', a=i%3===2?.05:.085;
      wrapDraw(w,h,(dx,dy)=>{ const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x+dx-r,y+dy-r,r*2,r*2); }); } }),
  // section characters (trace layer, 0.45x)
  def:(dpr)=>tile(480,480,dpr,(g,w,h)=>{ const R=rng(21); for(let i=0;i<6;i++){ const pts=route(g,R,R()*w,R()*h,2,60); wrapDraw(w,h,(dx,dy)=>{ g.strokeStyle=CU+'.19)'; g.lineWidth=1.6; stroke(g,pts,dx,dy); via(g,pts[0][0]+dx,pts[0][1]+dy,3,.22); }); } }),
  dense:(dpr)=>tile(480,480,dpr,(g,w,h)=>{ const R=rng(33); for(let b=0;b<4;b++){ const x0=R()*w,y0=R()*h,n=6+(R()*5|0),dir=R()<.5;
      for(let i=0;i<n;i++){ const pts=dir?[[x0,y0+i*7],[x0+90,y0+i*7],[x0+90+40,y0+i*7+40],[x0+240,y0+i*7+40]]:[[x0+i*7,y0],[x0+i*7,y0+90],[x0+i*7+40,y0+130],[x0+i*7+40,y0+240]];
        wrapDraw(w,h,(dx,dy)=>{ g.strokeStyle=CU+'.2)'; g.lineWidth=1.2; stroke(g,pts,dx,dy); }); } } }),
  diff:(dpr)=>tile(480,480,dpr,(g,w,h)=>{ const R=rng(44); for(let i=0;i<5;i++){ const x0=R()*w,y0=R()*h, L=140+R()*160, s=4.2;
      const a=[[x0,y0],[x0+L*.4,y0],[x0+L*.4+30,y0+30],[x0+L,y0+30]]; const b=a.map(([x,y],k)=>[x+(k>=2?-s*.6:0),y+s]);
      wrapDraw(w,h,(dx,dy)=>{ g.strokeStyle=NEON+'.16)'; g.lineWidth=1.3; stroke(g,a,dx,dy); stroke(g,b,dx,dy); g.strokeStyle=CU+'.12)';
        // length-tuning serpentine on one leg
        g.beginPath(); for(let k=0;k<5;k++){const x=x0+20+k*10+dx,y=y0+dy; g.moveTo(x,y); g.lineTo(x,y-6); g.lineTo(x+5,y-6); g.lineTo(x+5,y);} g.stroke(); }); } }),
  wave:(dpr)=>tile(480,240,dpr,(g,w,h)=>{ for(let k=0;k<5;k++){ const y0=24+k*46, amp=8+k*3, per=w/(2+k%3);
      g.strokeStyle=(k%2?NEON+'.13)':CU+'.2)'); g.lineWidth=1.3; g.beginPath(); for(let x=0;x<=w;x+=3){ const y=y0+Math.sin(x/per*Math.PI*2)*amp; x?g.lineTo(x,y):g.moveTo(x,y);} g.stroke(); } }),
  sparse:(dpr)=>tile(520,520,dpr,(g,w,h)=>{ const R=rng(55); regMark(g,90,110,.2); regMark(g,400,380,.2);
    g.strokeStyle=SILK+'.08)'; g.lineWidth=1; [[30,30],[490,30],[30,490],[490,490]].forEach(([x,y],i)=>{ const sx=i%2?-1:1, sy=i<2?1:-1; g.beginPath(); g.moveTo(x,y+sy*18); g.lineTo(x,y); g.lineTo(x+sx*18,y); g.stroke(); });
    for(let i=0;i<3;i++){ const x=R()*w,y=R()*h; wrapDraw(w,h,(dx,dy)=>fiducial(g,x+dx,y+dy,.26)); } }),
};
const SIZE={grid:[512,512],base:[560,560],glow:[1400,1800],def:[480,480],dense:[480,480],diff:[480,480],wave:[480,240],sparse:[520,520]};
const LAYERS=[['glow',.1],['grid',.2],['base',.3],['def',.45],['dense',.45],['diff',.45],['wave',.45],['sparse',.45]];
const CHAR={work:'dense',plugins:'diff',more:'def',tools:'def',music:'wave',photo:'sparse',contact:'def'};

export function initBgParallax(root,{run,RM}){
  const cleanups=[]; const on=(t,ty,f,o)=>{t.addEventListener(ty,f,o);cleanups.push(()=>t.removeEventListener(ty,f,o));};
  const mob=matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const dpr=Math.min(devicePixelRatio||1,2), K=mob?.6:1;   // mobile: reduced intensity + travel
  const host=document.createElement('div'); host.id='bgp'; host.setAttribute('aria-hidden','true');
  const anchor=root.querySelector('.vignette'); root.insertBefore(host,anchor||root.firstChild); cleanups.push(()=>host.remove());
  const els={}; const heroCv=root.querySelector('canvas#pcb');
  const build=()=>{ LAYERS.forEach(([k,rate])=>{ const c=MAKERS[k](dpr), [tw,th]=SIZE[k]; const d=document.createElement('div'); d.className='bgp-l bgp-'+k;
      d.style.backgroundImage=`url(${c.toDataURL('image/png')})`; d.style.backgroundSize=`${tw}px ${th}px`; d.style.height=`calc(100% + ${th}px)`; host.appendChild(d); els[k]={d,rate:rate*K,th,op:-1}; }); update(); };
  const secs=[...root.querySelectorAll('main > section[id]')].filter(s=>CHAR[s.id]);
  // section images: gentle parallax inside their frame (translate property, so hover scale/transitions stay intact)
  const imgs=()=>[...root.querySelectorAll('.ph-frame img, .m2-shot')];
  let lastY=-1;
  function update(){
    const y=scrollY, vh=innerHeight;
    const f=clamp((y-vh*.35)/(vh*.55),0,1); host.style.opacity=(f*(mob?.6:1)).toFixed(3);
    if(heroCv){ const o=(1-f*.72).toFixed(3); if(o!==heroCv.style.opacity) heroCv.style.opacity=o; }   // let the moving layers lead below the hero
    if(!RM) for(const k in els){ const L=els[k]; const off=(y*L.rate)%L.th; L.d.style.transform=`translate3d(0,${(-off).toFixed(1)}px,0)`; }
    // per-section character crossfade (by distance of section from viewport centre)
    const w={def:0,dense:0,diff:0,wave:0,sparse:0}; const mid=vh/2;
    secs.forEach(s=>{ const r=s.getBoundingClientRect(); const d=r.top>mid?r.top-mid:(r.bottom<mid?mid-r.bottom:0); const wgt=clamp(1-d/(vh*.6),0,1); const key=CHAR[s.id]; w[key]=Math.max(w[key],wgt); });
    const others=Math.max(w.dense,w.diff,w.wave,w.sparse); w.def=Math.max(w.def,1-others);
    for(const k of ['def','dense','diff','wave','sparse']){ const L=els[k]; if(!L)continue; const o=+w[k].toFixed(2); if(o!==L.op){L.op=o; L.d.style.opacity=o; L.d.style.visibility=o>0?'visible':'hidden';} }
    if(!RM) imgs().forEach(el=>{ const r=el.getBoundingClientRect(); if(r.bottom<-40||r.top>vh+40)return; const t=clamp(((r.top+r.height/2)-vh/2)/(vh/2+r.height/2),-1,1);
      const amp=(el.classList.contains('m2-shot')?14:20)*K; el.style.setProperty('--plx',(-t*amp).toFixed(1)+'px'); });
  }
  let queued=false; const kick=()=>{ if(queued)return; queued=true; run(()=>{queued=false; if(scrollY!==lastY){lastY=scrollY;} update(); return false;}); };
  on(window,'scroll',kick,{passive:true}); on(window,'resize',kick);
  (window.requestIdleCallback||(f=>setTimeout(f,200)))(build,{timeout:1200});
  return ()=>{ cleanups.forEach(f=>f()); if(heroCv) heroCv.style.opacity=''; };
}
