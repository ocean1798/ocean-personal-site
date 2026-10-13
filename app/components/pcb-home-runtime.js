/* eslint-disable */
// Client runtime for the PCB-themed home page (ported from homepage concept D).
// Hero board: 【全网首发】X86电脑主板 by OSHWHub (GPL-3.0), data in public/pcb-data/.

/**
 * @param {HTMLElement} root  the .pcb wrapper element
 * @param {string} dataBase   URL prefix of the pcb-data folder (base path aware)
 * @returns {() => void} cleanup
 */
export function initPcbHome(root, dataBase) {
  let disposed = false;
  const cleanups = [];
  const $ = (id) => document.getElementById(id);
  const raf = (cb) => (disposed ? 0 : requestAnimationFrame(cb));
  const on = (type, fn, opts) => { window.addEventListener(type, fn, opts); cleanups.push(() => window.removeEventListener(type, fn, opts)); };
  const IO = (cb, opts) => { const o = new IntersectionObserver(cb, opts); cleanups.push(() => o.disconnect()); return o; };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduced');

  /* ===== Silkscreen headline ===== */
  const silk = root.querySelector('#silk');
  const hot = new Set(['噪','声','秩','序','形','状']);
  const chars = silk ? [...silk.querySelectorAll('.ch')] : [];
  function lightSilk() {
    if (reduce) { chars.forEach(c => c.classList.add('on')); return; }
    let i = 0;
    const tick = () => {
      if (i >= chars.length) return;
      const el = chars[i++];
      el.classList.add('on');
      if (hot.has(el.textContent)) el.classList.add('hot');
      if (!disposed) setTimeout(tick, 70);
    };
    setTimeout(tick, 280);
  }
  lightSilk();

  /* ===== Real PCB hero: 【全网首发】X86电脑主板 · OSHWHub (GPL-3.0) · data: pcb-data/ ===== */
  const FRAME='tilt';
  async function loadBoard(){
    const base=dataBase+'/board-x86.json';
    let txt=null;
    try{ if('DecompressionStream' in window){ const r=await fetch(base+'.gz'); if(!r.ok)throw 0;
        txt=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text(); } }catch(e){}
    if(!txt){ const r=await fetch(base); if(!r.ok) throw new Error('board '+r.status); txt=await r.text(); }
    const D=JSON.parse(txt), q=D.q, B={meta:D.meta,pads:[],silk:[],outline:[],nets:[]};
    for(let i=0;i<D.o.length;i+=4)B.outline.push([D.o[i]/q,D.o[i+1]/q,D.o[i+2]/q,D.o[i+3]/q]);
    const und=(a,st)=>{const p=new Array(st).fill(0),o=[];for(let i=0;i<a.length;i+=st){const r=[];for(let c=0;c<st;c++){p[c]+=a[i+c];r.push(p[c]);}o.push(r);}return o;};
    und(D.k,4).forEach(r=>B.silk.push(r.map(v=>v/q)));
    und(D.p,8).forEach(r=>B.pads.push([r[0]/q,r[1]/q,r[2]/q,r[3]/q,r[4],r[5],r[6],r[7]]));
    D.nn.forEach((n,i)=>{const f=D.s[i],s=[];let px=0,py=0;
      for(let j=0;j<f.length;j+=6){const x1=px+f[j],y1=py+f[j+1],x2=x1+f[j+2],y2=y1+f[j+3];s.push([x1/q,y1/q,x2/q,y2/q,f[j+4]/q,f[j+5]]);px=x2;py=y2;}
      B.nets.push({n,id:D.ni[i],s,v:und(D.v[i],3).map(r=>[r[0]/q,r[1]/q,r[2]/q])});});
    return B;
  }
  loadBoard().then(B=>{ if(disposed) return; $('pcb-load').classList.add('done'); $('pcb').classList.remove('wait');
  const canvas = $('pcb');
  const ctx = canvas.getContext('2d');
  let W=0,H=0,dpr=1,S=1,OX=0,OY=0;
  let base=null, lit=null, spot=null, sctx=null;            // offscreen layers
  let mx=-1,my=-1,hasPtr=false,lastMove=0,sx=0,sy=0,auto=0,autoNet=0,autoT=0;
  const [bx0,by0,bx1,by1]=B.meta.bbox;
  const CELL=4; let grid=new Map();
  // build spatial index in board mm
  B.nets.forEach((n,i)=>{ n.i=i; if(/^(GND|\+VCCCORE|\+3V3|VCC3_3|V_SM)$/.test(n.n))return; n.s.forEach(sg=>{
    const L=Math.hypot(sg[2]-sg[0],sg[3]-sg[1]), k=Math.max(1,Math.ceil(L/CELL));
    for(let j=0;j<=k;j++){const x=sg[0]+(sg[2]-sg[0])*j/k,y=sg[1]+(sg[3]-sg[1])*j/k;
      const key=((x/CELL)|0)+','+((y/CELL)|0); let a=grid.get(key); if(!a)grid.set(key,a=[]); a.push(sg,n);} }); });
  // nice named nets for idle sweep
  const PWR=/^(GND|\+?V|VCC|VDD|\+\d|PWR|NetC|\$)/i;
  const HL=/PCIE|PEG|M_DQS|M_[AB]_CLK|USB3|USB_P|TMDS|SATA|LAN1_TX|CLK_PCIE/i;
  const named=B.nets.filter(n=>HL.test(n.n)&&n.s.length>6).sort((a,b)=>b.s.length-a.s.length).slice(0,40);
  let MA=1,MB=0,MC=0,MD=1; // board->screen linear part (unit scale), then *S + offset
  const T=(x,y)=>[OX+(MA*x+MB*y)*S, OY+(MC*x+MD*y)*S];
  const Tinv=(X,Y)=>{const u=(X-OX)/S,v=(Y-OY)/S,det=MA*MD-MB*MC;return [(MD*u-MB*v)/det,(-MC*u+MA*v)/det];};

  function layout(){
    dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px';
    const bw=bx1-bx0, bh=by1-by0, mob=W<700;
    const CPU=[88,74.4];                                 // CPU1 (LGA1700) centre, board mm
    MA=1;MB=0;MC=0;MD=1;
    // Hero framing (tuned in hero-tuner.html at 1920x945)
    const P={scale:0.47,autoFill:true,fillFactor:0.47,cx:134.3,cy:74.4,ax:78.5,ay:50,rotDeg:-16,squash:0.8};
    let fx,fy,ax,ay;
    const a=P.rotDeg*Math.PI/180, k=P.squash;                 // rotate then squash Y => faux perspective
    MA=Math.cos(a);MB=-Math.sin(a);MC=Math.sin(a)*k;MD=Math.cos(a)*k;
    S=Math.max(W/bw,H/bh)*(mob?1.9:P.scale); fx=P.cx;fy=P.cy; ax=mob?.5:P.ax/100; ay=P.ay/100;
    OX=0;OY=0; const [px0,py0]=T(fx,fy); OX=W*ax-px0; OY=H*ay-py0;
    // wide viewports: partially grow scale (fillFactor) toward covering all four viewport corners
    if(!mob && P.autoFill){ const A=[W*ax,H*ay], m=2;
      const inside=f=>[[0,0],[W,0],[0,H],[W,H]].every(([X,Y])=>{const [x,y]=Tinv(A[0]+(X-A[0])/f,A[1]+(Y-A[1])/f);return x>=bx0-m&&x<=bx1+m&&y>=by0-m&&y<=by1+m;});
      if(!inside(1)){ let lo=1,hi=1; while(!inside(hi)&&hi<6)hi*=1.25; for(let i=0;i<20;i++){const mid=(lo+hi)/2; if(inside(mid))hi=mid; else lo=mid;}
        S*=1+(hi-1)*P.fillFactor; OX=0;OY=0; const [qx,qy]=T(fx,fy); OX=W*ax-qx; OY=H*ay-qy; } }
    base=paint(false); lit=paint(true);
  }
  function mk(){const c=document.createElement('canvas');c.width=W*dpr;c.height=H*dpr;const g=c.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.lineCap='round';g.lineJoin='round';return [c,g];}
  function paint(bright){
    const [c,g]=mk();
    if(!bright){
      const gr=g.createRadialGradient(W*.65,H*.4,0,W*.6,H*.5,Math.max(W,H));
      gr.addColorStop(0,'#0f2a1d');gr.addColorStop(1,'#040a07');g.fillStyle=gr;g.fillRect(0,0,W,H);
    }
    // outline
    g.strokeStyle=bright?'rgba(246,197,106,.5)':'rgba(246,197,106,.22)'; g.lineWidth=1.2;
    g.beginPath(); B.outline.forEach(l=>{g.moveTo(...T(l[0],l[1]));g.lineTo(...T(l[2],l[3]));}); g.stroke();
    // copper: inner/back first, then top
    const cols = bright
      ? ['#ffcf7a','rgba(240,160,70,.75)','rgba(200,130,60,.5)','rgba(200,130,60,.5)']
      : ['rgba(196,120,44,.55)','rgba(120,80,40,.32)','rgba(90,70,40,.18)','rgba(90,70,40,.18)'];
    for(const L of [3,2,1,0]){
      g.strokeStyle=cols[L];
      B.nets.forEach(n=>{ n.s.forEach(sg=>{ if(sg[5]!==L)return;
        g.lineWidth=Math.max(.7,sg[4]*S); g.beginPath(); g.moveTo(...T(sg[0],sg[1])); g.lineTo(...T(sg[2],sg[3])); g.stroke(); }); });
    }
    // pads
    B.pads.forEach(pd=>{ if(pd[6])return; const [x,y]=T(pd[0],pd[1]); let w=pd[2]*S,h=pd[3]*S;
      if(pd[7]%180===90){const q=w;w=h;h=q;}
      g.fillStyle=bright?'#f8d48a':'rgba(205,140,60,.62)';
      const ang=Math.atan2(MC,MA); g.beginPath(); if(pd[4])g.ellipse(x,y,w/2,h/2*.62,ang,0,7); else if(ang){g.save();g.translate(x,y);g.transform(MA,MC,MB,MD,0,0);g.rect(-w/2,-h/2,w,h);g.restore();} else g.rect(x-w/2,y-h/2,w,h); g.fill(); });
    // vias: annular ring + drill
    B.nets.forEach(n=>n.v.forEach(v=>{const [x,y]=T(v[0],v[1]),r=Math.max(1.6,v[2]*S/2);
      g.fillStyle=bright?'#ffd98f':'rgba(214,150,70,.7)';g.beginPath();g.arc(x,y,r,0,7);g.fill();
      g.fillStyle='#030806';g.beginPath();g.arc(x,y,r*.48,0,7);g.fill();}));
    // silkscreen
    g.strokeStyle=bright?'rgba(240,245,235,.85)':'rgba(220,230,220,.28)'; g.lineWidth=Math.max(.6,.13*S);
    g.beginPath(); B.silk.forEach(l=>{g.moveTo(...T(l[0],l[1]));g.lineTo(...T(l[2],l[3]));}); g.stroke();
    return c;
  }
  function hitNet(px,py,rad){ // nearest segment net within rad px
    const [x,y]=Tinv(px,py),r=rad/S; let best=null,bd=r*r;
    for(let gx=((x-r)/CELL|0);gx<=((x+r)/CELL|0);gx++)for(let gy=((y-r)/CELL|0);gy<=((y+r)/CELL|0);gy++){
      const a=grid.get(gx+','+gy); if(!a)continue;
      for(let k=0;k<a.length;k+=2){const sg=a[k],dx=sg[2]-sg[0],dy=sg[3]-sg[1],l2=dx*dx+dy*dy||1;
        let u=((x-sg[0])*dx+(y-sg[1])*dy)/l2; u=u<0?0:u>1?1:u; const ex=sg[0]+u*dx-x,ey=sg[1]+u*dy-y,d=ex*ex+ey*ey;
        if(d<bd){bd=d;best=a[k+1];}}}
    return best;
  }
  const netCache=new Map();
  function netCanvas(n){ // pre-rendered glowing net path
    if(netCache.has(n.i))return netCache.get(n.i);
    const p=new Path2D(); n.s.forEach(sg=>{p.moveTo(...T(sg[0],sg[1]));p.lineTo(...T(sg[2],sg[3]));});
    const w=Math.max(1.4,(n.s[0]?.[4]||.2)*S); const o={p,w}; netCache.set(n.i,o); return o;
  }
  const label=$('net-label');
  let cur=null, curA=0, prev=null, prevA=0, last=performance.now();
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000); last=now;
    const scrollFade=Math.max(.12,1-scrollY/(H*0.9));
    let target;
    if(hasPtr && now-lastMove<2600){ target=[mx,my]; }
    else { // idle sweep across named nets
      autoT+=dt; if(autoT>2.2||!named[autoNet]){autoT=0;autoNet=(autoNet+1)%Math.max(1,named.length);}
      const n=named[autoNet]; const sg=n.s[(n.s.length/2)|0]; target=T((sg[0]+sg[2])/2,(sg[1]+sg[3])/2);
    }
    const k=1-Math.exp(-dt*6); sx+=(target[0]-sx)*k; sy+=(target[1]-sy)*k;
    const h=hitNet(sx,sy,44)||cur;
    if(h!==cur){ prev=cur; prevA=curA; cur=h; curA=0; }
    curA=Math.min(1,curA+dt*3.5); prevA=Math.max(0,prevA-dt*3);
    ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.fillStyle='#050c09'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha=Math.max(.28,scrollFade); ctx.drawImage(base,0,0);
    // soft spotlight via small temp canvas
    const R=Math.min(W,H)*0.28, Rd=R*dpr, sz=Math.ceil(Rd*2);
    if(!spot||spot.width!==sz){spot=document.createElement('canvas');spot.width=spot.height=sz;sctx=spot.getContext('2d');}
    const ox=sx*dpr-Rd, oy=sy*dpr-Rd;
    sctx.globalCompositeOperation='source-over'; sctx.clearRect(0,0,sz,sz);
    sctx.drawImage(lit,ox,oy,sz,sz,0,0,sz,sz);
    sctx.globalCompositeOperation='destination-in';
    const rg=sctx.createRadialGradient(Rd,Rd,0,Rd,Rd,Rd); rg.addColorStop(0,'rgba(0,0,0,1)'); rg.addColorStop(.5,'rgba(0,0,0,.8)'); rg.addColorStop(1,'rgba(0,0,0,0)');
    sctx.fillStyle=rg; sctx.fillRect(0,0,sz,sz);
    ctx.globalAlpha=scrollFade; ctx.drawImage(spot,ox,oy);
    // highlighted nets
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.lineCap='round'; ctx.lineJoin='round';
    for(const [n,a] of [[prev,prevA],[cur,curA]]){ if(!n||a<=0)continue; const {p,w}=netCanvas(n);
      ctx.globalAlpha=a*scrollFade;
      ctx.shadowColor='#b8ff3c'; ctx.shadowBlur=14; ctx.strokeStyle='rgba(184,255,60,.35)'; ctx.lineWidth=w+5; ctx.stroke(p);
      ctx.shadowBlur=0; ctx.strokeStyle='#d9ff7a'; ctx.lineWidth=w+0.6; ctx.stroke(p);
      // travelling pulse
      ctx.setLineDash([6,40]); ctx.lineDashOffset=-now*0.06; ctx.strokeStyle='#ffffff'; ctx.lineWidth=Math.max(1,w*.6); ctx.stroke(p); ctx.setLineDash([]);
      n.v.forEach(v=>{ctx.fillStyle='#b8ff3c';ctx.beginPath();ctx.arc(...T(v[0],v[1]),Math.max(2,v[2]*S/2),0,7);ctx.fill();ctx.fillStyle='#030806';ctx.beginPath();ctx.arc(...T(v[0],v[1]),Math.max(1,v[2]*S/4),0,7);ctx.fill();});
    }
    ctx.globalAlpha=1;
    // cursor reticle
    ctx.strokeStyle='rgba(184,255,60,.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(sx,sy,10,0,7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx-16,sy);ctx.lineTo(sx-6,sy);ctx.moveTo(sx+6,sy);ctx.lineTo(sx+16,sy);ctx.moveTo(sx,sy-16);ctx.lineTo(sx,sy-6);ctx.moveTo(sx,sy+6);ctx.lineTo(sx,sy+16);ctx.stroke();
    if(cur && scrollFade>.3){ label.style.opacity=1; label.style.transform=`translate(${Math.min(W-220,sx+18)}px,${sy-34}px)`;
      label.textContent=(cur.n||'net').replace(/^\//,'').split('/').pop(); }
    else label.style.opacity=0;
    if(!reduce) raf(frame);
  }
  on('pointermove',e=>{hasPtr=e.pointerType==='mouse'||hasPtr;mx=e.clientX;my=e.clientY;lastMove=performance.now();if(e.pointerType!=='mouse'){hasPtr=true;}},{passive:true});
  on('resize',()=>{netCache.clear();layout();});
  layout(); sx=W*.7; sy=H*.4;
  if(reduce){ ctx.drawImage(base,0,0); } else raf(frame);
  }).catch(e=>{if(disposed)return;const l=$('pcb-load');l.textContent='电路板数据加载失败';console.warn(e);});

  /* ===== Scroll assembly ===== */
  const comps = root.querySelectorAll('[data-comp]');
  const labels = root.querySelectorAll('[data-lit]');
  const io = IO(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('on');
    });
  }, {threshold: 0.22, rootMargin: '0px 0px -8% 0px'});
  comps.forEach(c => io.observe(c));
  const ioL = IO(entries => {
    entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('lit'); });
  }, {threshold: 0.6});
  labels.forEach(l => ioL.observe(l));

  // signal pads light in sequence while visible
  const signal = $('signal'); if (signal) {
  const sigs = [...signal.querySelectorAll('.sig')];
  let sigLit = false;
  IO(entries => {
    if (entries[0].isIntersecting && !sigLit) {
      sigLit = true;
      sigs.forEach((s,i) => setTimeout(() => s.classList.add('on'), reduce?0: i*220));
    }
  }, {threshold:0.35}).observe(signal);
  }

  /* ===== Music scope (decorative) ===== */
  (()=>{const c=$('scope'); if(!c)return; const g=c.getContext('2d'); let w=0,hh=0,vis=false;
    const fit=()=>{const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;hh=r.height;c.width=w*d;c.height=hh*d;g.setTransform(d,0,0,d,0,0);};
    fit(); on('resize',fit);
    IO(e=>{vis=e[0].isIntersecting;},{threshold:0}).observe(c);
    const N=48, bars=new Array(N).fill(0);
    function draw(t){ if(vis||reduce){ t=reduce?2000:t; g.clearRect(0,0,w,hh);
      g.strokeStyle='rgba(184,255,60,.08)';g.lineWidth=1;g.beginPath();
      for(let x=0;x<=w;x+=w/10){g.moveTo(x,0);g.lineTo(x,hh);} for(let y=0;y<=hh;y+=hh/4){g.moveTo(0,y);g.lineTo(w,y);} g.stroke();
      // spectrum bars (bottom)
      const bw=w/N; for(let i=0;i<N;i++){ const target=(.25+.75*Math.abs(Math.sin(i*.37+t*.0021)*Math.sin(i*.11-t*.0013)))*(1-i/N*.55); bars[i]+= (target-bars[i])*.18;
        const bh=bars[i]*hh*.55; const gr=g.createLinearGradient(0,hh,0,hh-bh); gr.addColorStop(0,'rgba(201,106,20,.55)'); gr.addColorStop(1,'rgba(246,197,106,.15)');
        g.fillStyle=gr; g.fillRect(i*bw+1,hh-bh,bw-2,bh); }
      // scope trace
      g.save(); g.shadowColor='#b8ff3c'; g.shadowBlur=10; g.strokeStyle='#c8ff5a'; g.lineWidth=1.6; g.beginPath();
      for(let x=0;x<=w;x+=2){ const u=x/w; const y=hh*.42+Math.sin(u*18+t*.004)*hh*.16*Math.sin(u*3.1+t*.0011)+Math.sin(u*47-t*.009)*hh*.04;
        x?g.lineTo(x,y):g.moveTo(x,y);} g.stroke(); g.restore(); }
      if(!reduce) raf(draw); }
    raf(draw);})();

  /* ===== Diff pair demo ===== */
  const netsEl = $('nets');
  netsEl.querySelectorAll('.net-row').forEach(row => {
    row.addEventListener('pointerenter', () => {
      row.querySelectorAll('.net,.net-link').forEach(n => n.classList.add('on'));
    });
    row.addEventListener('pointerleave', () => {
      row.querySelectorAll('.net,.net-link').forEach(n => n.classList.remove('on'));
    });
  });
  // auto cycle when in view
  let pairIdx = 0, pairTimer;
  cleanups.push(() => clearInterval(pairTimer));
  const diffDemo = $('diff-demo');
  function cyclePairs(on){
    clearInterval(pairTimer);
    if (!on || reduce) return;
    pairTimer = setInterval(() => {
      netsEl.querySelectorAll('.net,.net-link').forEach(n => n.classList.remove('on'));
      const rows = netsEl.querySelectorAll('.net-row');
      const r = rows[pairIdx % rows.length];
      r.querySelectorAll('.net,.net-link').forEach(n => n.classList.add('on'));
      pairIdx++;
    }, 1200);
  }
  IO(es => cyclePairs(es[0].isIntersecting), {threshold:0.4}).observe(diffDemo);

  /* ===== FPC demo ===== */
  const mats = {
    PI:   {color:'linear-gradient(90deg,#f0c040,#ffe08a)', std:[0.075,0.1,0.125,0.15,0.2,0.225,0.25]},
    FR4:  {color:'linear-gradient(90deg,#2f8f4e,#7dffa0)', std:[0.1,0.15,0.2,0.3]},
    STEEL:{color:'linear-gradient(90deg,#9aa3ad,#e8eef5)', std:[0.05,0.1,0.15,0.2]},
  };
  const stack = $('fpc-stack');
  const matSel = $('fpc-mat');
  const th = $('fpc-th');
  const out = $('fpc-out');
  function renderStack(){
    const m = mats[matSel.value];
    const target = +th.value;
    // fake stack: cover + cu + ad + stiff
    const base = 0.15; // other layers
    let need = Math.max(0.05, +(target - base).toFixed(3));
    // snap to nearest std
    let best = m.std[0], bd = 1e9;
    m.std.forEach(s => { const d=Math.abs(s-need); if(d<bd){bd=d;best=s;} });
    const stiffH = 18 + best*120;
    stack.innerHTML = `
      <div class="layer ad" style="height:14px"><span>Coverlay</span><span>0.03</span></div>
      <div class="layer cu" style="height:16px"><span>Cu</span><span>0.018</span></div>
      <div class="layer pi" style="height:22px;background:linear-gradient(90deg,#d4a017,#f5d76e)"><span>PI core</span><span>0.05</span></div>
      <div class="layer cu" style="height:16px"><span>Cu</span><span>0.018</span></div>
      <div class="layer stiff" style="height:${stiffH}px;background:${m.color}"><span>Stiffener ${matSel.value}</span><span>${best.toFixed(3)}</span></div>
    `;
    out.innerHTML = best.toFixed(3) + '<small>建议补强厚度（示意，非工程计算）</small>';
  }
  matSel.addEventListener('change', renderStack);
  th.addEventListener('input', renderStack);
  renderStack();

  /* ===== Dropzone ===== */
  const dz = $('dropzone');
  const din = $('drop-input');
  const dname = $('drop-name');
  const dprev = $('drop-prev');
  dz.addEventListener('click', () => din.click());
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('over');
    if (e.dataTransfer.files[0]) showFile(e.dataTransfer.files[0]);
  });
  din.addEventListener('change', () => { if (din.files[0]) showFile(din.files[0]); });
  function showFile(f){
    dname.textContent = f.name + ' · ' + Math.round(f.size/1024) + ' KB';
    dz.classList.add('has');
    if (f.type.startsWith('image/')) {
      if (dprev.src.startsWith('blob:')) URL.revokeObjectURL(dprev.src);
      const url = URL.createObjectURL(f);
      dprev.src = url; dprev.style.display='block';
    } else {
      dprev.removeAttribute('src'); dprev.style.display='none';
    }
  }


  return () => { disposed = true; cleanups.forEach((f) => f()); };
}
