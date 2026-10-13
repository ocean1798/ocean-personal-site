/* eslint-disable */
// Finale: the REAL OSHWHub X86 motherboard (same pcb-data as the hero), each homepage section mapped to a real component.
// Static board rendered once to offscreen canvases; per frame only transforms + overlays. Uses the shared rAF (run).

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=x=>{x=clamp(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
const seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);
// component boxes in board mm (x0,y0,x1,y1), derived from pad clusters of the parsed board data
const COMPS={
  U1:[70.1,52.9,105.9,95.8],     // CPU socket LGA1700 (+VCCCORE / M_DATA nets)
  U2:[44.6,155.8,131.3,167.3],   // PCIe x16 slot (EXP_A_RX/TX)
  U3:[114.8,129.6,129.3,153.1],  // M.2 socket (M2_1_DAS, PCIE7)
  U4:[134.1,3.7,158.9,144.3],    // DDR DIMM x2 (M_DATA_A/B)
  U5:[8.1,175.8,24.3,193.4],     // audio codec QFP (FRONT_OUT_L/R)
  U6:[118.5,177.2,145.5,201.1],  // PCH BGA (DMI nets)
  J1:[165.1,18.6,177.5,71.4],    // ATX 24-pin power (PS_ON, VCC12/5/3_3)
};
const REFS=['U1','U2','U3','U4','U5','U6','J1'];
const PWR=/^(GND|\+|VCC|VDD|V_|\$|NetC)/i;

export function initEnding(root,{run,scrollToY,RM}){
  const sec=root.querySelector('#ending'); if(!sec) return ()=>{};
  const pin=sec.querySelector('.ending-pin'), cv=sec.querySelector('.ending-cv'), g=cv.getContext('2d');
  const labels=Object.fromEntries([...sec.querySelectorAll('.ending-part')].map(a=>[a.dataset.ref,a]));
  const topBtn=sec.querySelector('.ending-top'), credit=sec.querySelector('.ending-credit');
  const cleanups=[]; const on=(t,ty,f,o)=>{t.addEventListener(ty,f,o);cleanups.push(()=>t.removeEventListener(ty,f,o));};
  let B=null, W=0,H=0,DPR=1, mob=false, rot=true, BW=0,BH=0,X1=180, K=8;
  let base=null, neon=null, glow=null, compNets={}, hover=null, sweepT=-1, sweepStart=0, visible=false, lastP=-1, view=null, lab={};

  const toView=(x,y)=>rot?[y,X1-x]:[x,y];
  function boxView(r){ const a=toView(r[0],r[1]), b=toView(r[2],r[3]); return [Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]; }
  const boardMat=(s,ox,oy)=>rot?[0,-s,s,0,ox,oy+s*X1]:[s,0,0,s,ox,oy];

  function paintBase(){
    const [bx0,by0,bx1,by1]=B.meta.bbox; X1=bx1;
    BW=rot?by1-by0:bx1-bx0; BH=rot?bx1-bx0:by1-by0;
    const fitS=fitScale(); K=Math.min(4096/BW, Math.max(6, fitS*DPR*(mob||RM?1:2.2)));
    const mk=()=>{const c=document.createElement('canvas'); c.width=Math.ceil(BW*K); c.height=Math.ceil(BH*K); return c;};
    base=mk(); let x=base.getContext('2d');
    // solder mask substrate
    const gr=x.createLinearGradient(0,0,base.width,base.height); gr.addColorStop(0,'#0d2a1c'); gr.addColorStop(.55,'#0a1f15'); gr.addColorStop(1,'#07160f');
    x.fillStyle=gr; x.beginPath(); x.roundRect(0,0,base.width,base.height,3*K); x.fill();
    x.setTransform(...boardMat(K,0,0)); x.lineCap='round'; x.lineJoin='round';
    const px=1/K;
    const cols=['rgba(214,140,58,.78)','rgba(150,100,48,.42)','rgba(110,84,48,.26)','rgba(110,84,48,.26)'];
    for(const L of [3,2,1,0]){ x.strokeStyle=cols[L]; B.nets.forEach(n=>n.s.forEach(sg=>{ if(sg[5]!==L)return; x.lineWidth=Math.max(.8*px,sg[4]); x.beginPath(); x.moveTo(sg[0],sg[1]); x.lineTo(sg[2],sg[3]); x.stroke(); })); }
    // pads: gold ENIG finish
    x.fillStyle='#d9a65e';
    B.pads.forEach(pd=>{ let w=pd[2],h=pd[3]; if(pd[7]%180===90){const t=w;w=h;h=t;} x.beginPath(); if(pd[4]) x.ellipse(pd[0],pd[1],w/2,h/2,0,0,7); else x.rect(pd[0]-w/2,pd[1]-h/2,w,h); x.fill(); });
    // vias
    B.nets.forEach(n=>n.v.forEach(v=>{ const r=Math.max(1.4*px,v[2]/2); x.fillStyle='rgba(222,160,80,.85)'; x.beginPath(); x.arc(v[0],v[1],r,0,7); x.fill(); x.fillStyle='#04100a'; x.beginPath(); x.arc(v[0],v[1],r*.48,0,7); x.fill(); }));
    // silkscreen + outline
    x.strokeStyle='rgba(232,238,228,.5)'; x.lineWidth=Math.max(.7*px,.13); x.beginPath(); B.silk.forEach(l=>{x.moveTo(l[0],l[1]);x.lineTo(l[2],l[3]);}); x.stroke();
    x.strokeStyle='rgba(246,197,106,.75)'; x.lineWidth=Math.max(1*px,.25); x.beginPath(); B.outline.forEach(l=>{x.moveTo(l[0],l[1]);x.lineTo(l[2],l[3]);}); x.stroke();
    // silkscreen title block (view coords, top-right corner)
    x.setTransform(K,0,0,K,0,0);
    const tw=40,th=22, tx=BW-tw-5, ty=5;
    x.fillStyle='rgba(6,18,12,.92)'; x.beginPath(); x.roundRect(tx,ty,tw,th,1.2); x.fill();
    x.strokeStyle='rgba(236,242,232,.8)'; x.lineWidth=.3; x.stroke();
    x.beginPath(); x.moveTo(tx+2,ty+14.2); x.lineTo(tx+tw-2,ty+14.2); x.lineWidth=.18; x.stroke();
    x.fillStyle='rgba(240,245,236,.95)'; x.textBaseline='alphabetic';
    x.font='900 8.2px "Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif'; x.fillText('海洋湃',tx+2.6,ty+11.4);
    x.font='600 2.6px ui-monospace,SFMono-Regular,Menlo,monospace'; x.fillStyle='rgba(240,245,236,.8)'; x.textAlign='right'; x.fillText('OCEAN',tx+tw-2.4,ty+11.2);
    x.textAlign='left'; x.fillText('REV 2026.10',tx+2.6,ty+18.6); x.textAlign='right'; x.fillText('1/1',tx+tw-2.4,ty+18.6); x.textAlign='left';
    // neon layer: every signal net, the hero's highlight colour
    if(!mob){ neon=mk(); x=neon.getContext('2d'); x.setTransform(...boardMat(K,0,0)); x.lineCap='round'; x.lineJoin='round'; x.strokeStyle='#d9ff7a';
      B.nets.forEach(n=>{ if(PWR.test(n.n))return; x.beginPath(); n.s.forEach(sg=>{x.moveTo(sg[0],sg[1]);x.lineTo(sg[2],sg[3]);}); x.lineWidth=Math.max(.9*px,(n.s[0]?.[4]||.15)); x.stroke(); });
      glow=document.createElement('canvas'); glow.width=Math.ceil(neon.width/3); glow.height=Math.ceil(neon.height/3); x=glow.getContext('2d'); x.filter='blur(3px)'; x.drawImage(neon,0,0,glow.width,glow.height); }
    // per-component nets (signal only) for hover
    const byId=new Map(B.nets.map(n=>[n.id,n]));
    REFS.forEach(r=>{ const [a,b,c,d]=COMPS[r]; const set=new Set();
      B.pads.forEach(p=>{ if(p[0]>=a&&p[0]<=c&&p[1]>=b&&p[1]<=d&&p[5]>=0){ const n=byId.get(p[5]); if(n&&!PWR.test(n.n)) set.add(n);} });
      const path=new Path2D(); set.forEach(n=>n.s.forEach(sg=>{path.moveTo(sg[0],sg[1]);path.lineTo(sg[2],sg[3]);})); compNets[r]={path,count:set.size}; });
  }
  function fitScale(){ return mob? (W*.94)/BW : Math.min(W*.56/BW, H*.8/BH); }

  function layout(){
    mob=innerWidth<700; rot=!mob; sec.classList.toggle('static',mob||RM); sec.classList.toggle('mob',mob);
    const r=cv.getBoundingClientRect(); W=r.width; H=r.height; DPR=Math.min(devicePixelRatio||1,2);
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    if(!B) return;
    const [bx0,by0,bx1,by1]=B.meta.bbox; BW=rot?by1-by0:bx1-bx0; BH=rot?bx1-bx0:by1-by0; X1=bx1;
    if(!base||base._rot!==rot||base._w!==Math.round(W)){ paintBase(); base._rot=rot; base._w=Math.round(W); }
    // final framing
    const S=fitScale(); const ox=mob?(W-BW*S)/2:(W-BW*S)/2, oy=mob?14:(H-BH*S)/2-H*.01;
    view={S,ox,oy};
    // callout layout (desktop): left/right columns, de-overlapped
    lab={};
    if(!mob){ const left=[],right=[]; REFS.forEach(rf=>{ const b=boxView(COMPS[rf]); const cx=ox+(b[0]+b[2])/2*S, cy=oy+(b[1]+b[3])/2*S; (cx<W/2?left:right).push({rf,b,cx,cy}); });
      const place=(arr,side)=>{ arr.sort((a,b)=>a.cy-b.cy); let y=-1e9; arr.forEach(o=>{ y=Math.max(o.cy,y+78); o.ly=y; });
        const over=arr.length?arr[arr.length-1].ly-(oy+BH*S-30):0; if(over>0)arr.forEach(o=>o.ly-=over);
        arr.forEach(o=>{ o.side=side; o.lx=side<0?ox-48:ox+BW*S+48; lab[o.rf]=o; }); };
      place(left,-1); place(right,1); }
    REFS.forEach(rf=>{ const el=labels[rf]; if(!el)return; if(mob){el.style.transform='';return;} const o=lab[rf];
      el.classList.toggle('l',o.side<0); el.style.transform=`translate(${o.side<0?o.lx-el.offsetWidth:o.lx}px,${o.ly-el.offsetHeight/2}px)`; });
    if(credit) credit.style.transform=mob?'':`translate(${ox}px,${oy+BH*S+14}px)`;
    if(topBtn) topBtn.style.transform=mob?'':`translate(${ox+BW*S+34}px,${oy+BH*S-6}px)`;
    lastP=-1; draw();
  }
  function progress(){ if(mob||RM) return 1; const r=sec.getBoundingClientRect(); return clamp(-r.top/Math.max(1,r.height-innerHeight),0,1); }

  function draw(force){
    if(!B||!base||!view) return; const p=progress(); if(!force&&p===lastP&&sweepT<0) return; lastP=p;
    const {S,ox,oy}=view;
    // camera: close-up on the CPU, zooming out to the whole board
    const z=mob||RM?1:1+(1-ease(seg(p,0,.36)))*2.6;
    const cpu=boxView(COMPS.U1), fx=(cpu[0]+cpu[2])/2, fy=(cpu[1]+cpu[3])/2;
    const k=mob||RM?1:ease(seg(p,0,.36)); const Fx=fx*(1-k)+BW/2*k, Fy=fy*(1-k)+BH/2*k, Z=S*z;
    const sx=W/2*(1-k)+(ox+Fx*S)*k, sy=H/2*(1-k)+(oy+Fy*S)*k; const OX=sx-Fx*Z, OY=sy-Fy*Z;
    g.setTransform(DPR,0,0,DPR,0,0); g.clearRect(0,0,W,H);
    // soft shadow under the board
    g.save(); g.shadowColor='rgba(0,0,0,.65)'; g.shadowBlur=60; g.shadowOffsetY=24; g.fillStyle='#07160f'; g.beginPath(); g.roundRect(OX,OY,BW*Z,BH*Z,3*Z); g.fill(); g.restore();
    g.imageSmoothingQuality='high'; g.drawImage(base,OX,OY,BW*Z,BH*Z);
    // power-on sweep: radial reveal of all signal nets from the CPU
    const sw=sweepT<0?0:sweepT;
    if(neon&&sw>0){ const [qx,qy]=[OX+fx*Z,OY+fy*Z], R=Math.hypot(BW,BH)*Z*ease(sw);
      g.save(); g.beginPath(); g.arc(qx,qy,R,0,7); g.clip();
      const after=sw>=1?.42:1; g.globalAlpha=.85*after; g.globalCompositeOperation='lighter'; g.drawImage(glow,OX,OY,BW*Z,BH*Z);
      g.globalAlpha=.75*after; g.globalCompositeOperation='source-over'; g.drawImage(neon,OX,OY,BW*Z,BH*Z); g.restore();
      if(sw<1){ g.save(); g.strokeStyle='rgba(217,255,122,.55)'; g.lineWidth=2; g.shadowColor='#b8ff3c'; g.shadowBlur=18; g.beginPath(); g.arc(qx,qy,R,0,7); g.stroke(); g.restore(); } }
    // hover: component nets + outline
    if(hover&&compNets[hover]){ g.save(); g.setTransform(...boardMat(Z*DPR,OX*DPR,OY*DPR)); g.lineCap='round'; g.lineJoin='round';
      g.shadowColor='#b8ff3c'; g.shadowBlur=14*DPR; g.strokeStyle='rgba(184,255,60,.4)'; g.lineWidth=Math.max(.45,4/Z); g.stroke(compNets[hover].path);
      g.shadowBlur=0; g.strokeStyle='#d9ff7a'; g.lineWidth=Math.max(.16,1.3/Z); g.stroke(compNets[hover].path); g.restore(); }
    // callouts
    const lit=sw>=1;
    REFS.forEach((rf,i)=>{ const b=boxView(COMPS[rf]); const X0=OX+b[0]*Z,Y0=OY+b[1]*Z,X1b=OX+b[2]*Z,Y1b=OY+b[3]*Z;
      const a=mob||RM?1:seg(p,.4+i*.052,.46+i*.052); const el=labels[rf];
      if(el){ el.style.opacity=a.toFixed(3); el.style.pointerEvents=a>.6?'auto':'none'; el.classList.toggle('lit',lit); el.classList.toggle('hov',hover===rf); }
      if(a<=0)return; const hv=hover===rf;
      g.save(); g.globalAlpha=a; const col=hv||lit?'rgba(217,255,122,.95)':'rgba(236,242,232,.8)';
      // corner brackets around the component
      const L=Math.min(12,(X1b-X0)/3,(Y1b-Y0)/3)+2, pd=4; g.strokeStyle=col; g.lineWidth=hv?1.6:1.1; if(hv||lit){g.shadowColor='#b8ff3c'; g.shadowBlur=hv?12:6;}
      g.beginPath(); [[X0-pd,Y0-pd,1,1],[X1b+pd,Y0-pd,-1,1],[X0-pd,Y1b+pd,1,-1],[X1b+pd,Y1b+pd,-1,-1]].forEach(([x,y,sx,sy])=>{g.moveTo(x+sx*L,y);g.lineTo(x,y);g.lineTo(x,y+sy*L);}); g.stroke();
      if(!mob){ const o=lab[rf]; if(o){ // leader: from box edge -> elbow -> label
          const sx=o.side<0?X0-pd:X1b+pd, sy=clamp(o.ly,Y0+4,Y1b-4); const ex=o.lx, ey=o.ly; const mx=o.side<0?Math.min(sx-16,OX-18):Math.max(sx+16,OX+BW*Z+18);
          const t=clamp(a*1.4,0,1); g.lineWidth=hv?1.4:1; g.beginPath(); g.moveTo(sx,sy);
          const pts=[[mx,sy],[mx+(o.side<0?-14:14),ey],[ex,ey]]; let px=sx,py=sy; const tot=pts.reduce((s,q)=>{const d=Math.hypot(q[0]-px,q[1]-py);px=q[0];py=q[1];return s+d;},0); let left=tot*t; px=sx;py=sy;
          for(const q of pts){ const d=Math.hypot(q[0]-px,q[1]-py); if(left<=0)break; const u=Math.min(1,left/d); g.lineTo(px+(q[0]-px)*u,py+(q[1]-py)*u); left-=d; px=q[0];py=q[1]; } g.stroke();
          g.shadowBlur=0; g.fillStyle=col; g.beginPath(); g.arc(sx,sy,2.4,0,7); g.fill(); } }
      else { g.fillStyle='rgba(5,12,9,.85)'; g.strokeStyle=col; const tw=26,th=15, lx=(X0+X1b)/2-tw/2, ly=(Y0+Y1b)/2-th/2; g.beginPath(); g.roundRect(lx,ly,tw,th,3); g.fill(); g.stroke();
        g.fillStyle=col; g.font='700 10px ui-monospace,monospace'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(rf,lx+tw/2,ly+th/2+.5); }
      g.restore(); });
    // back-to-top via
    const va=mob||RM?1:seg(p,.74,.8); if(topBtn){ topBtn.style.opacity=va.toFixed(3); topBtn.style.pointerEvents=va>.6?'auto':'none'; }
    if(credit) credit.style.opacity=(mob||RM?1:seg(p,.3,.4)).toFixed(3);
    // trigger sweep
    if(!mob&&!RM){ if(p>=.8&&sweepT<0){ sweepT=0; sweepStart=performance.now(); run(sweepTick);} else if(p<.7&&sweepT>=0){ sweepT=-1; lastP=-1; draw(); } }
    sec.classList.toggle('lit',lit);
    cv.style.cursor=hover?'pointer':'';
  }
  function sweepTick(now){ if(sweepT<0)return false; sweepT=clamp((now-sweepStart)/1800,0,1); lastP=-1; draw(); if(sweepT>=1)return false; }

  // hover / click: callout labels and the components themselves
  const setHover=rf=>{ if(hover!==rf){ hover=rf; lastP=-1; draw(); } };
  Object.entries(labels).forEach(([rf,el])=>{ on(el,'pointerenter',()=>setHover(rf)); on(el,'pointerleave',()=>setHover(null)); on(el,'focus',()=>setHover(rf)); on(el,'blur',()=>setHover(null)); });
  function hit(e){ if(!view||!B)return null; const r=cv.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
    const p=progress(); if(!mob&&!RM&&p<.4)return null; // compute current transform as in draw
    const {S,ox,oy}=view; const z=mob||RM?1:1+(1-ease(seg(p,0,.36)))*2.6; if(z>1.01)return null;
    for(const rf of REFS){ const b=boxView(COMPS[rf]); if(mx>=ox+b[0]*S-6&&mx<=ox+b[2]*S+6&&my>=oy+b[1]*S-6&&my<=oy+b[3]*S+6){ const i=REFS.indexOf(rf); if(mob||RM||p>=.46+i*.052) return rf; } } return null; }
  on(cv,'pointermove',e=>setHover(hit(e))); on(cv,'pointerleave',()=>setHover(null));
  on(cv,'click',e=>{ const rf=hit(e); if(!rf)return; const id=labels[rf]&&labels[rf].getAttribute('href').slice(1); const el=id&&document.getElementById(id); if(el) scrollToY(el.getBoundingClientRect().top+scrollY-70); });

  const io=new IntersectionObserver(es=>{ visible=es[0].isIntersecting; if(visible){ if((mob||RM)&&sweepT<0){ if(RM||!neon){sweepT=1;} else { sweepT=0; sweepStart=performance.now(); run(sweepTick);} } lastP=-1; draw(); } },{threshold:.15});
  io.observe(sec); cleanups.push(()=>io.disconnect());
  let queued=false; on(window,'scroll',()=>{ if(!visible||queued)return; queued=true; run(()=>{queued=false; draw(); return false;}); },{passive:true});
  let rz=0; on(window,'resize',()=>{ clearTimeout(rz); rz=setTimeout(layout,120); });
  const ready=b=>{ B=b; // defer the heavy one-time paint until the browser is idle
    (window.requestIdleCallback||((f)=>setTimeout(f,300)))(()=>layout(),{timeout:1500}); };
  if(root.__pcbBoard) ready(root.__pcbBoard); else on(root,'pcb:board',e=>ready(e.detail));
  layout();
  return ()=>cleanups.forEach(f=>f());
}
