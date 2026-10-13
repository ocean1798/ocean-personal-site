/* eslint-disable */
// Motion batch 2: lerp smooth scroll, trace progress bar, pad-dot dissolve on plugin screenshots, click sticker spray.
// Tuning panel only with ?tune in the URL.

/** @param {HTMLElement} root .pcb wrapper  @returns {() => void} cleanup */
import { initBgParallax } from './bg-parallax.js';
import { S as FB, run as fbRun } from './frame-bus.js';

export function initMotion2(root){
const cleanups=[]; let disposed=false;
const on=(t,type,fn,o)=>{t.addEventListener(type,fn,o);cleanups.push(()=>t.removeEventListener(type,fn,o));};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH=matchMedia('(hover: none), (pointer: coarse)').matches;
const DPR=Math.min(devicePixelRatio||1,2);
const P={ss:!RM&&!TOUCH,lerp:.1,tr:true,dz:!RM,dur:500,pitch:14,st:!RM,cnt:20,g:600,pop:760,life:3400,drag:.9,wind:120,sz:44};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

/* shared rAF: the page-wide frame bus (one loop for hero, smooth scroll, parallax, progress, dissolve, stickers) */
function run(f,first){ if(disposed)return; const g=(t,dt)=>disposed?false:f(t,dt); fbRun(g,first); }

/* 1. lerp smooth scroll */
let target=scrollY,current=scrollY,smoothing=false;
const jump=y=>window.scrollTo({top:y,left:0,behavior:'instant'});   // html has scroll-behavior:smooth
let maxS=0; const measureMax=()=>{maxS=document.documentElement.scrollHeight-innerHeight;}; const maxScroll=()=>maxS||(measureMax(),maxS);
function ssStep(){ if(!P.ss){smoothing=false;return false;} current+=(target-current)*P.lerp; const done=Math.abs(target-current)<.5; if(done)current=target; const y=Math.round(current*2)/2; if(y!==FB.y){ jump(y); FB.y=y; } if(done){smoothing=false;return false;} }   // write-only; runs first in the frame
function scrollToY(y){ target=clamp(y,0,maxScroll()); if(!P.ss){window.scrollTo({top:target,behavior:RM?'auto':'smooth'});return;} if(!smoothing){current=scrollY;smoothing=true;run(ssStep,true);} }
function innerScrollable(el,dy){ for(;el&&el!==document.body&&el!==document.documentElement;el=el.parentElement){
  const s=getComputedStyle(el); if(/(auto|scroll)/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+1){ if((dy>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1)||(dy<0&&el.scrollTop>0))return true; } } return false; }
on(window,'wheel',e=>{ if(!P.ss||e.ctrlKey||e.defaultPrevented)return;
  const d=e.deltaMode===1?e.deltaY*40:e.deltaMode===2?e.deltaY*innerHeight:e.deltaY;
  if(!d||Math.abs(e.deltaX)>Math.abs(e.deltaY)||innerScrollable(e.target,d))return;
  e.preventDefault(); if(!smoothing)current=target=scrollY; scrollToY(target+d); },{passive:false});
let trQ=false; on(window,'scroll',()=>{ if(!smoothing)target=current=scrollY; if(!trQ){trQ=true; run(()=>{trQ=false; onScroll(); return false;});} },{passive:true});
on(window,'keydown',e=>{ if(!P.ss||e.altKey||e.ctrlKey||e.metaKey)return; const a=document.activeElement;
  if(a&&(/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|IFRAME/.test(a.tagName)||a.isContentEditable||a.closest('[role=button]')))return;
  const m={PageDown:innerHeight*.9,PageUp:-innerHeight*.9,ArrowDown:90,ArrowUp:-90,' ':e.shiftKey?-innerHeight*.9:innerHeight*.9};
  if(e.key in m){e.preventDefault(); if(!smoothing)current=target=scrollY; scrollToY(target+m[e.key]);}
  else if(e.key==='Home'||e.key==='End'){e.preventDefault(); scrollToY(e.key==='Home'?0:maxScroll());} });
on(document,'click',e=>{ if(!P.ss||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;
  const a=e.target.closest&&e.target.closest('a[href^="#"]'); if(!a)return; const id=a.getAttribute('href').slice(1); const el=id?document.getElementById(id):null; if(!el)return;
  e.preventDefault(); history.replaceState(null,'','#'+id); scrollToY(el.getBoundingClientRect().top+scrollY-70); });

/* 2. trace progress bar */
const trace=document.createElement('nav'); trace.id='m2-trace'; trace.setAttribute('aria-label','页面进度');
trace.innerHTML='<div class="cu"></div><div class="fill"></div>'; root.appendChild(trace); cleanups.push(()=>trace.remove());
const tfill=trace.querySelector('.fill');
const secs=[...root.querySelectorAll('#top, main > section[id]')];
const vias=secs.map(s=>{ const lab=s.id==='top'?'00 · 首页':((s.querySelector('.sec-label')||{}).textContent||s.id).trim();
  const b=document.createElement('button'); b.type='button'; b.className='via'; b.setAttribute('aria-label','跳到 '+lab); const sp=document.createElement('span'); sp.textContent=lab; b.appendChild(sp);
  b.addEventListener('click',()=>scrollToY(s.getBoundingClientRect().top+scrollY-70)); trace.appendChild(b); return [b,s]; });
let anchors=[];
function layoutTrace(){ measureMax(); const M=Math.max(1,maxScroll()); anchors=vias.map(([b,s])=>{ const y=clamp((s.getBoundingClientRect().top+scrollY-70)/M,0,1); b.style.top=(y*100)+'%'; return y; }); onScroll(); }
function onScroll(){ if(!P.tr)return; const p=clamp((FB.y||scrollY)/Math.max(1,maxScroll()),0,1); tfill.style.transform='scaleY('+p.toFixed(4)+')'; vias.forEach(([b],i)=>b.classList.toggle('on',p>=anchors[i]-.002)); }
on(window,'resize',layoutTrace); on(window,'load',layoutTrace); layoutTrace();
const ro=new ResizeObserver(()=>layoutTrace()); ro.observe(document.body); cleanups.push(()=>ro.disconnect());

/* 3. pad-dot dissolve: title face over the real screenshot (img.shot), revealed on card hover */
const ease=x=>.5-.5*Math.cos(Math.PI*clamp(x,0,1));
const MARK={'diff-pair':'P/N','fpc-workshop':'FPC','file-viewer':'PDF'};
const cards=[];
if(!RM&&!TOUCH) root.querySelectorAll('article.plug').forEach(card=>{
  const img=card.querySelector('img.shot'); if(!img)return;
  const wrap=document.createElement('div'); wrap.className='m2-shot'; img.parentNode.insertBefore(wrap,img); wrap.appendChild(img);
  const cv=document.createElement('canvas'); cv.setAttribute('aria-hidden','true'); wrap.appendChild(cv);
  const o={card,img,wrap,cv,g:cv.getContext('2d'),p:0,dir:0,w:0,h:0,face:null,
    mark:MARK[card.dataset.tool]||'U', name:(card.querySelector('h3')||{}).textContent||'', pin:((card.querySelector('.pin')||{}).textContent||'').split('·').slice(0,2).join('·').trim()};
  o.tick=(t,dt)=>{ o.p=clamp(o.p+o.dir*dt*1000/P.dur,0,1); drawCard(o); if((o.dir>0&&o.p>=1)||(o.dir<0&&o.p<=0))return false; };
  on(card,'pointerenter',e=>{ if(e.pointerType!=='mouse')return; if(!P.dz){o.p=1;drawCard(o);return;} o.dir=1; run(o.tick); });
  on(card,'pointerleave',e=>{ if(!P.dz){o.p=0;drawCard(o);return;} o.dir=-1; run(o.tick); });
  cards.push(o); drawCard(o);
  cleanups.push(()=>{ cv.remove(); wrap.parentNode&&wrap.parentNode.insertBefore(img,wrap); wrap.remove(); });
});
function makeFace(o){ const c=document.createElement('canvas'); c.width=o.w*DPR; c.height=o.h*DPR; const g=c.getContext('2d'); g.scale(DPR,DPR); const {w,h}=o;
  g.fillStyle='#08140e'; g.fillRect(0,0,w,h);
  const rg=g.createRadialGradient(w/2,h*.45,0,w/2,h*.45,Math.max(w,h)*.6); rg.addColorStop(0,'rgba(184,255,60,.12)'); rg.addColorStop(1,'rgba(184,255,60,0)'); g.fillStyle=rg; g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(224,138,46,.07)'; g.lineWidth=1; for(let r=14;r<Math.hypot(w,h)/2;r+=14){g.beginPath();g.arc(w/2,h/2,r,0,7);g.stroke();}
  g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#f6c06a'; g.shadowColor='rgba(224,138,46,.4)'; g.shadowBlur=24;
  g.font='800 '+Math.round(Math.min(64,w*.16))+'px ui-monospace,SFMono-Regular,Menlo,monospace'; g.fillText(o.mark,w/2,h*.44); g.shadowBlur=0;
  g.fillStyle='#7f9a88'; g.font='15px "Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif'; g.fillText(o.name,w/2,h*.44+Math.min(52,w*.12));
  g.font='10px ui-monospace,monospace'; g.textAlign='right'; g.fillText('HOVER → SCREENSHOT',w-12,h-12); return c; }
function drawCard(o){ const r=o.wrap.getBoundingClientRect(), w=Math.round(r.width), h=Math.round(r.height); if(!w||!h)return;
  if(w!==o.w||h!==o.h){o.w=w;o.h=h;o.cv.width=w*DPR;o.cv.height=h*DPR;o.face=makeFace(o);}
  const g=o.g; g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation='source-over'; g.clearRect(0,0,o.cv.width,o.cv.height);
  if(o.p>=1)return; g.drawImage(o.face,0,0); if(o.p<=0)return;
  g.setTransform(DPR,0,0,DPR,0,0);
  const pitch=P.pitch,cx=w/2,cy=h/2,maxD=Math.hypot(cx,cy)+pitch,band=.35,front=ease(o.p)*(1+band),rMax=pitch*.72,rings=[];
  g.globalCompositeOperation='destination-out'; g.beginPath();
  for(let y=cy%pitch-pitch;y<h+pitch;y+=pitch)for(let x=cx%pitch-pitch;x<w+pitch;x+=pitch){
    const d=Math.hypot(x-cx,y-cy)/maxD,k=clamp((front-d)/band,0,1); if(k<=0)continue; const rr=rMax*ease(k); g.moveTo(x+rr,y); g.arc(x,y,rr,0,7); if(k<1)rings.push(x,y,rr); }
  g.fill(); g.globalCompositeOperation='source-over';
  g.strokeStyle='rgba(246,192,106,.9)'; g.lineWidth=1.2; g.beginPath(); for(let i=0;i<rings.length;i+=3){const rr=rings[i+2]; if(rr<1.5)continue; g.moveTo(rings[i]+rr,rings[i+1]); g.arc(rings[i],rings[i+1],rr,0,7);} g.stroke(); }
on(window,'resize',()=>cards.forEach(o=>{o.w=0;drawCard(o);}));
cards.forEach(o=>o.img.complete||o.img.addEventListener('load',()=>{o.w=0;drawCard(o);},{once:true}));

/* 4. click sticker spray */
const SPR=128; // sprite px
function sprite(fn){ const c=document.createElement('canvas'); c.width=c.height=SPR; const g=c.getContext('2d');
  const s=document.createElement('canvas'); s.width=s.height=SPR; const sg=s.getContext('2d'); sg.translate(SPR/2,SPR/2); sg.scale(SPR/128,SPR/128); sg.lineJoin=sg.lineCap='round'; fn(sg);
  // light outline: dilate silhouette in white, then draw art on top
  const m=document.createElement('canvas'); m.width=m.height=SPR; const mg=m.getContext('2d'); mg.drawImage(s,0,0); mg.globalCompositeOperation='source-in'; mg.fillStyle='#f4f7ef'; mg.fillRect(0,0,SPR,SPR);
  g.shadowColor='rgba(0,0,0,.45)'; g.shadowBlur=6; g.shadowOffsetY=3;
  for(let a=0;a<16;a++){ const r=5; g.drawImage(m,Math.cos(a/16*Math.PI*2)*r,Math.sin(a/16*Math.PI*2)*r); if(a===0){g.shadowColor='transparent';} }
  g.drawImage(s,0,0); return c; }
const R=(g,x,y,w,h,r,f,st)=>{g.beginPath();g.roundRect(x,y,w,h,r); if(f){g.fillStyle=f;g.fill();} if(st){g.strokeStyle=st;g.stroke();}};
const OL='#1a2a20';
const STK=[
 g=>{ g.lineWidth=7; g.strokeStyle='#9aa39b'; g.beginPath(); g.moveTo(-54,0); g.lineTo(54,0); g.stroke(); g.lineWidth=5; R(g,-30,-15,60,30,14,'#e7c38d',OL); ['#8b4a1e','#111','#e33','#d4a017'].forEach((c,i)=>{g.fillStyle=c; g.fillRect(-20+i*11,-14,6,28);}); }, // resistor
 g=>{ g.lineWidth=7; g.strokeStyle='#9aa39b'; g.beginPath(); g.moveTo(-14,30); g.lineTo(-14,54); g.moveTo(14,30); g.lineTo(14,46); g.stroke(); g.lineWidth=5; R(g,-28,-46,56,78,12,'#2f6fd6',OL); g.fillStyle='#bcd3f5'; g.fillRect(12,-42,10,70); g.fillStyle='#fff'; g.font='bold 22px sans-serif'; g.fillText('−',14,-10); }, // capacitor
 g=>{ g.lineWidth=5; g.strokeStyle='#c9ced0'; for(let i=0;i<4;i++){const y=-27+i*18; g.beginPath(); g.moveTo(-46,y); g.lineTo(-36,y); g.moveTo(36,y); g.lineTo(46,y); g.stroke(); g.beginPath(); g.moveTo(y,-46); g.lineTo(y,-36); g.moveTo(y,36); g.lineTo(y,46); g.stroke();}
      R(g,-36,-36,72,72,8,'#1d2322',OL); g.fillStyle='#4b5552'; g.beginPath(); g.arc(-22,-22,5,0,7); g.fill(); g.fillStyle='#b8ff3c'; g.font='bold 14px ui-monospace,monospace'; g.textAlign='center'; g.fillText('IC',0,6); }, // chip
 g=>{ g.lineWidth=6; g.strokeStyle='#9aa39b'; g.beginPath(); g.moveTo(-10,20); g.lineTo(-10,56); g.moveTo(10,20); g.lineTo(10,46); g.stroke(); g.lineWidth=5;
      g.fillStyle='#b8ff3c'; g.strokeStyle=OL; g.beginPath(); g.moveTo(-24,22); g.lineTo(-24,-18); g.arc(0,-18,24,Math.PI,0); g.lineTo(24,22); g.closePath(); g.fill(); g.stroke(); R(g,-30,18,60,10,3,'#8fcf2a',OL); g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-9,-22,5,11,0,0,7); g.fill(); }, // LED
 g=>{ g.lineWidth=5; R(g,-48,-26,96,64,12,'#3a3f3d',OL); R(g,-22,-38,30,14,4,'#3a3f3d',OL); g.fillStyle='#f6c06a'; g.beginPath(); g.arc(4,6,24,0,7); g.fill(); g.stroke(); g.fillStyle='#1d2322'; g.beginPath(); g.arc(4,6,14,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; g.beginPath(); g.arc(-1,1,4,0,7); g.fill(); g.fillStyle='#b8ff3c'; g.fillRect(30,-18,10,6); }, // camera
 g=>{ g.lineWidth=11; g.strokeStyle='#2c3330'; g.beginPath(); g.arc(0,4,40,Math.PI*1.05,Math.PI*1.95); g.stroke(); g.lineWidth=5; R(g,-50,0,22,40,9,'#e08a2e',OL); R(g,28,0,22,40,9,'#e08a2e',OL); }, // headphones
 g=>{ g.lineWidth=5; g.fillStyle='#b8ff3c'; g.strokeStyle=OL; g.beginPath(); g.ellipse(-20,30,17,13,-.4,0,7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(26,20,17,13,-.4,0,7); g.fill(); g.stroke();
      g.lineWidth=8; g.beginPath(); g.moveTo(-4,28); g.lineTo(-4,-40); g.lineTo(42,-50); g.lineTo(42,18); g.stroke(); g.strokeStyle='#b8ff3c'; g.lineWidth=3; g.beginPath(); g.moveTo(-4,28); g.lineTo(-4,-40); g.lineTo(42,-50); g.lineTo(42,18); g.stroke(); }, // note
 g=>{ g.lineWidth=5; g.strokeStyle=OL; g.fillStyle='#f4efe6'; g.beginPath(); g.moveTo(-34,-24); g.lineTo(30,-24); g.lineTo(24,40); g.lineTo(-28,40); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#6b3a1b'; g.fillRect(-31,-20,58,10);
      g.lineWidth=7; g.beginPath(); g.arc(34,6,13,-1.3,1.3); g.stroke(); g.strokeStyle='rgba(238,242,234,.8)'; g.lineWidth=4; [-14,0,14].forEach(x=>{g.beginPath(); g.moveTo(x,-34); g.quadraticCurveTo(x+7,-44,x,-54); g.stroke();}); }, // coffee
 g=>{ const px=['..hhhhh..','.hhhhhhh.','hhsssssh.','hsGsGsss.','hsssssss.','.ssmmss..','..sssss..','.ccccccc.','ccccccccc']; const S=11; g.translate(-S*4.5,-S*4.5);
      px.forEach((row,y)=>[...row].forEach((ch,x)=>{ const col={h:'#2a1d14',s:'#f2c9a0',G:'#1d2322',m:'#c4584a',c:'#2f6f4f'}[ch]; if(col){g.fillStyle=col; g.fillRect(x*S,y*S,S+.5,S+.5);} })); }, // pixel avatar
 g=>{ g.lineWidth=5; R(g,-50,-38,100,70,10,'#2c3330',OL); R(g,-40,-28,58,50,4,'#06120b',OL);
      g.strokeStyle='rgba(184,255,60,.25)'; g.lineWidth=1; for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(-40,-3+k*16);g.lineTo(18,-3+k*16);g.stroke();}
      g.strokeStyle='#b8ff3c'; g.lineWidth=3.5; g.beginPath(); for(let x=-38;x<=16;x+=2){const y=-3+Math.sin((x+38)/54*Math.PI*3)*12; x===-38?g.moveTo(x,y):g.lineTo(x,y);} g.stroke();
      g.fillStyle='#e08a2e'; g.strokeStyle=OL; g.lineWidth=3; g.beginPath(); g.arc(34,-14,7,0,7); g.fill(); g.stroke(); g.beginPath(); g.arc(34,10,7,0,7); g.fill(); g.stroke();
      g.lineWidth=5; g.strokeStyle='#1d2322'; g.beginPath(); g.moveTo(20,32); g.quadraticCurveTo(30,50,10,52); g.stroke();
      g.save(); g.translate(-6,48); g.rotate(-.35); R(g,-6,-8,30,10,4,'#3a6fd6',OL); g.strokeStyle='#c9ced0'; g.lineWidth=3; g.beginPath(); g.moveTo(-6,-3); g.lineTo(-20,-3); g.stroke(); g.restore(); }, // oscilloscope + probe
 g=>{ g.lineWidth=6; g.strokeStyle='#9aa39b'; g.beginPath(); g.moveTo(-56,8); g.lineTo(-36,8); g.moveTo(36,8); g.lineTo(56,8); g.stroke(); g.lineWidth=5; R(g,-38,-22,76,44,20,'#3b3f3e',OL);
      g.strokeStyle='#e08a2e'; g.lineWidth=6; for(let k=0;k<5;k++){g.beginPath(); g.arc(-24+k*12,-2,7,Math.PI,0); g.stroke();} }, // inductor
 g=>{ g.lineWidth=6; g.strokeStyle='#9aa39b'; g.beginPath(); g.moveTo(-14,26); g.lineTo(-14,54); g.moveTo(14,26); g.lineTo(14,54); g.stroke(); g.lineWidth=5; R(g,-40,-30,80,58,29,'#d8dde0',OL); R(g,-30,-20,60,38,19,null,'#9aa3a8');
      g.fillStyle='#1d2322'; g.font='bold 15px ui-monospace,monospace'; g.textAlign='center'; g.fillText('16M',0,5); }, // crystal
 g=>{ g.lineWidth=6; g.strokeStyle='#9aa39b'; g.beginPath(); g.moveTo(-56,0); g.lineTo(56,0); g.stroke(); g.lineWidth=5; R(g,-30,-16,60,32,8,'#1d2322',OL); g.fillStyle='#d8dde0'; g.fillRect(14,-15,8,30);
      g.strokeStyle='#b8ff3c'; g.lineWidth=3; g.beginPath(); g.moveTo(-14,-8); g.lineTo(2,0); g.lineTo(-14,8); g.closePath(); g.moveTo(2,-8); g.lineTo(2,8); g.stroke(); }, // diode
 g=>{ g.lineWidth=6; g.strokeStyle='#9aa39b'; g.beginPath(); [-16,0,16].forEach(x=>{g.moveTo(x,14); g.lineTo(x,56);}); g.stroke(); g.lineWidth=5;
      g.fillStyle='#1d2322'; g.strokeStyle=OL; g.beginPath(); g.moveTo(-28,16); g.lineTo(-28,-16); g.arc(0,-16,28,Math.PI,0); g.lineTo(28,16); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#7f9a88'; g.font='bold 11px ui-monospace,monospace'; g.textAlign='center'; g.fillText('NPN',0,0); }, // transistor
 g=>{ g.lineWidth=5; R(g,-50,-22,100,44,22,'#c9ced0',OL); R(g,-38,-11,76,22,11,'#1d2322',OL); g.fillStyle='#e08a2e'; for(let k=0;k<8;k++) g.fillRect(-28+k*8,-4,4,8); }, // USB-C
 g=>{ g.lineWidth=5; R(g,-52,-14,104,28,4,'#1d2322',OL); g.strokeStyle='#f6c06a'; g.lineWidth=5; for(let k=0;k<6;k++){const x=-42+k*17; g.beginPath(); g.moveTo(x,-40); g.lineTo(x,30); g.stroke();} }, // pin header
 g=>{ g.lineWidth=5; R(g,-38,-38,76,76,8,'#3b3f3e',OL); g.fillStyle='#d8dde0'; [[-28,-28],[28,-28],[-28,28],[28,28]].forEach(([x,y])=>{g.beginPath(); g.arc(x,y,5,0,7); g.fill();}); g.fillStyle='#e33'; g.strokeStyle=OL; g.beginPath(); g.arc(0,0,20,0,7); g.fill(); g.stroke(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(-6,-6,6,0,7); g.fill(); }, // button
 g=>{ g.rotate(-.6); g.lineWidth=5; R(g,-58,-8,40,16,6,'#e08a2e',OL); R(g,-20,-6,48,12,4,'#c9ced0',OL); g.fillStyle='#9aa3a8'; g.strokeStyle=OL; g.beginPath(); g.moveTo(28,-4); g.lineTo(56,0); g.lineTo(28,4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='#ffd27a'; g.beginPath(); g.arc(58,0,4,0,7); g.fill(); }, // solder iron
 g=>{ g.lineWidth=5; R(g,-34,-50,68,100,12,'#f6c43a',OL); R(g,-24,-40,48,26,4,'#9fbf8a',OL); g.fillStyle='#1d2322'; g.font='bold 15px ui-monospace,monospace'; g.textAlign='center'; g.fillText('3.30',0,-21);
      g.fillStyle='#2c3330'; g.beginPath(); g.arc(0,10,15,0,7); g.fill(); g.stroke(); g.strokeStyle='#d8dde0'; g.lineWidth=3; g.beginPath(); g.moveTo(0,10); g.lineTo(8,0); g.stroke(); g.fillStyle='#e33'; g.beginPath(); g.arc(-14,38,5,0,7); g.fill(); g.fillStyle='#1d2322'; g.beginPath(); g.arc(14,38,5,0,7); g.fill(); }, // multimeter
 g=>{ g.lineWidth=5; R(g,-22,-46,44,92,8,'#2c3330',OL); R(g,-8,-54,16,10,2,'#c9ced0',OL); R(g,-16,-14,32,52,4,'#b8ff3c',null); g.fillStyle='#8fcf2a'; g.fillRect(-16,10,32,28);
      g.fillStyle='#f4f7ef'; g.font='bold 12px ui-monospace,monospace'; g.textAlign='center'; g.fillText('+',0,-24); }, // battery
 g=>{ g.lineWidth=5; g.fillStyle='#2f6fd6'; g.strokeStyle=OL; g.beginPath(); g.moveTo(-32,-46); g.lineTo(18,-46); g.lineTo(34,-30); g.lineTo(34,46); g.lineTo(-32,46); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='#f6c06a'; for(let k=0;k<5;k++) g.fillRect(-26+k*10,-40,6,16); g.fillStyle='#f4f7ef'; g.font='bold 18px ui-monospace,monospace'; g.textAlign='center'; g.fillText('SD',2,22); }, // SD card
 g=>{ g.lineWidth=5; g.fillStyle='#4a4f60'; g.strokeStyle=OL; g.beginPath(); g.moveTo(-36,-18); g.quadraticCurveTo(-56,30,-36,34); g.quadraticCurveTo(-24,34,-16,18); g.lineTo(16,18); g.quadraticCurveTo(24,34,36,34); g.quadraticCurveTo(56,30,36,-18); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='#d8dde0'; g.fillRect(-32,-6,16,5); g.fillRect(-26.5,-12,5,16); ['#b8ff3c','#e33','#f6c06a','#2f6fd6'].forEach((c,k)=>{g.fillStyle=c; g.beginPath(); g.arc(24+[0,8,0,-8][k],-4+[-8,0,8,0][k],4,0,7); g.fill();}); }, // game controller
 g=>{ g.lineWidth=5; R(g,-40,-40,80,80,12,'#c9ced0',OL); R(g,-30,-34,60,56,8,'#f4f7ef',OL); g.fillStyle='#1d2322'; g.font='bold 30px ui-monospace,monospace'; g.textAlign='center'; g.fillText('⌘',0,4); }, // keycap
 g=>{ g.lineWidth=5; g.fillStyle='#f0a24a'; g.strokeStyle=OL; g.beginPath(); g.moveTo(-36,-12); g.lineTo(-30,-46); g.lineTo(-12,-28); g.lineTo(12,-28); g.lineTo(30,-46); g.lineTo(36,-12); g.quadraticCurveTo(44,36,0,38); g.quadraticCurveTo(-44,36,-36,-12); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='#1d2322'; g.beginPath(); g.ellipse(-14,0,4,7,0,0,7); g.ellipse(14,0,4,7,0,0,7); g.fill(); g.fillStyle='#ff8fa3'; g.beginPath(); g.moveTo(-4,12); g.lineTo(4,12); g.lineTo(0,17); g.fill();
      g.strokeStyle='#1d2322'; g.lineWidth=2; g.beginPath(); g.moveTo(-20,16); g.lineTo(-44,12); g.moveTo(-20,20); g.lineTo(-44,24); g.moveTo(20,16); g.lineTo(44,12); g.moveTo(20,20); g.lineTo(44,24); g.stroke(); }, // cat
 g=>{ g.lineWidth=5; g.fillStyle='#ffd23a'; g.strokeStyle=OL; g.beginPath(); g.moveTo(8,-54); g.lineTo(-30,6); g.lineTo(-2,6); g.lineTo(-12,54); g.lineTo(30,-10); g.lineTo(2,-10); g.closePath(); g.fill(); g.stroke(); }, // lightning
 g=>{ g.rotate(.6); g.lineWidth=5; g.fillStyle='#f4f7ef'; g.strokeStyle=OL; g.beginPath(); g.moveTo(0,-56); g.quadraticCurveTo(22,-30,18,20); g.lineTo(-18,20); g.quadraticCurveTo(-22,-30,0,-56); g.fill(); g.stroke();
      g.fillStyle='#e33'; g.beginPath(); g.moveTo(-18,4); g.lineTo(-32,28); g.lineTo(-16,20); g.fill(); g.stroke(); g.beginPath(); g.moveTo(18,4); g.lineTo(32,28); g.lineTo(16,20); g.fill(); g.stroke();
      g.fillStyle='#2f6fd6'; g.beginPath(); g.arc(0,-18,8,0,7); g.fill(); g.stroke(); g.fillStyle='#f6c06a'; g.beginPath(); g.moveTo(-10,22); g.lineTo(0,46); g.lineTo(10,22); g.fill(); }, // rocket
 g=>{ g.lineWidth=5; R(g,-50,-36,100,72,8,'#1f7a46',OL); g.strokeStyle='#e08a2e'; g.lineWidth=4; g.beginPath(); g.moveTo(-36,-20); g.lineTo(-6,-20); g.lineTo(6,-8); g.lineTo(6,18); g.stroke();
      g.fillStyle='#f6c06a'; g.strokeStyle=OL; g.lineWidth=3; R(g,-6,14,24,16,3,'#f6c06a',OL); g.beginPath(); g.arc(-36,-20,7,0,7); g.fill(); g.stroke(); g.fillStyle='#1f7a46'; g.beginPath(); g.arc(-36,-20,3,0,7); g.fill();
      g.fillStyle='#f4f7ef'; g.font='bold 10px ui-monospace,monospace'; g.fillText('JLC',22,-18); [-40,-28].forEach(x=>{g.fillStyle='rgba(244,247,239,.6)'; g.beginPath(); g.arc(x+70,26,3,0,7); g.fill();}); }, // JLC-ish green board
 g=>{ g.lineWidth=5; R(g,-50,-34,100,68,14,'#16241c',OL); g.fillStyle='#b8ff3c'; g.font='bold 34px ui-monospace,monospace'; g.textAlign='center'; g.fillText('</>',0,12); }, // code bracket
];

const sprites=STK.map(sprite);
const sc=document.createElement('canvas'); sc.id='m2-stk'; sc.setAttribute('aria-hidden','true'); root.appendChild(sc); cleanups.push(()=>sc.remove());
const sx=sc.getContext('2d'); let SW=0,SH=0;
function sizeStk(){SW=innerWidth;SH=innerHeight;sc.width=SW*DPR;sc.height=SH*DPR;} sizeStk(); on(window,'resize',sizeStk);
const parts=[],pending=[]; let deck=[],lastIdx=-1;
function nextSprite(){ if(!deck.length){ deck=sprites.map((_,i)=>i); for(let i=deck.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[deck[i],deck[j]]=[deck[j],deck[i]];} if(deck[deck.length-1]===lastIdx)deck.unshift(deck.pop()); } lastIdx=deck.pop(); return sprites[lastIdx]; }
function spray(x,y){ let t=performance.now(); for(let i=0;i<P.cnt;i++){pending.push({at:t,x,y}); t+=40+Math.random()*40;} run(stkStep); }
function stkStep(now,dt){
  while(pending.length&&pending[0].at<=now){ const q=pending.shift(),a=-Math.PI/2+(Math.random()-.5)*1.3,v=P.pop*(.8+Math.random()*.45);
    parts.push({x:q.x,y:q.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,rot:(Math.random()-.5)*.6,vr:(Math.random()-.5)*6,born:now,life:P.life*(.85+Math.random()*.3),sp:nextSprite(),ph:Math.random()*6.28,sz:P.sz*(.8+Math.random()*.4)}); }
  sx.setTransform(DPR,0,0,DPR,0,0); sx.clearRect(0,0,SW,SH);
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i],u=(now-p.born)/p.life; if(u>=1||p.y>SH+120){parts.splice(i,1);continue;}
    p.vy+=P.g*dt; p.vx+=Math.sin(now/380+p.ph)*P.wind*dt; const dr=Math.max(0,1-P.drag*dt); p.vx*=dr; p.vy*=dr; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt;
    let s=1; if(u<.05){const k=u/.05; s=1+2.70158*Math.pow(k-1,3)+1.70158*Math.pow(k-1,2);} else if(u>.9) s=1-(u-.9)/.1;
    const z=p.sz*s; if(z<=.5)continue; sx.setTransform(DPR,0,0,DPR,p.x*DPR,p.y*DPR); sx.rotate(p.rot); sx.drawImage(p.sp,-z/2,-z/2,z,z); }
  sx.setTransform(1,0,0,1,0,0); if(!parts.length&&!pending.length){sx.clearRect(0,0,sc.width,sc.height);return false;} }
const BLOCK='a,button,input,select,textarea,label,summary,details,iframe,img,video,[role=button],[tabindex],[contenteditable],.demo,.dropzone,.cta,.chip,.music,.ph-row,.tools,.bento,.flow-min,.comp-hd,#m2-trace,#m2-panel,#pcb-status';
on(document,'pointerdown',e=>{ if(!P.st||e.button!==0||e.pointerType!=='mouse')return; const t=e.target;
  if(!(t instanceof Element)||t.closest(BLOCK))return;
  const hero=root.querySelector('.pcb-hero'); if(hero&&e.pageY<hero.getBoundingClientRect().bottom+scrollY)return;   // hero PCB uses hover; keep clicks there inert
  if(getSelection&&String(getSelection()).length)return;
  spray(e.clientX,e.clientY); });

/* tuning panel: only with ?tune */
if(new URLSearchParams(location.search).has('tune')){
  const pn=document.createElement('div'); pn.id='m2-panel';
  const row=(id,lab,min,max,step)=>`<label>${lab}<input type="range" data-k="${id}" min="${min}" max="${max}" step="${step}"><output></output></label>`;
  const ck=(id,lab)=>`<label>${lab}<input type="checkbox" data-k="${id}"></label>`;
  pn.innerHTML='<h4>MOTION · BATCH 2 <span>?tune</span></h4>'+ck('ss','平滑滚动')+row('lerp','lerp',.03,.3,.01)+'<hr>'+ck('tr','走线进度条')+'<hr>'+ck('dz','焊盘溶解')+row('dur','时长 ms',200,1500,10)+row('pitch','焊盘间距',8,28,1)
   +'<hr>'+ck('st','点击贴纸')+row('cnt','数量',1,60,1)+row('g','重力',200,3000,50)+row('pop','上抛',300,1500,10)+row('life','寿命 ms',1000,6000,100)+row('drag','空气阻力',0,3,.05)+row('wind','风',0,400,10)+row('sz','尺寸 px',24,80,1);
  root.appendChild(pn); cleanups.push(()=>pn.remove());
  pn.querySelectorAll('input').forEach(el=>{ const k=el.dataset.k, out=el.nextElementSibling;
    if(el.type==='checkbox'){ el.checked=P[k]; el.addEventListener('change',()=>{P[k]=el.checked; trace.style.display=P.tr?'':'none'; if(P.tr)layoutTrace(); if(!P.ss){smoothing=false;} }); }
    else { el.value=P[k]; out.textContent=el.value; el.addEventListener('input',()=>{P[k]=+el.value; out.textContent=el.value;}); } });
}
window.__m2spray=spray;
cleanups.push(initBgParallax(root,{run,RM}));
return ()=>{ disposed=true; cleanups.forEach(f=>f()); delete window.__m2spray; };
}
