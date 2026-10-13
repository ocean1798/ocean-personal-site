/* eslint-disable */
// Finale "整页变成一块板": scroll-scrubbed PCB assembly of the homepage sections + power-on sweep.
// Uses the shared on-demand rAF (run) from motion-batch2.

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=x=>{x=clamp(x,0,1);return 1-Math.pow(1-x,3);};
const seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);

// board units 1000 x 620. [x,y,w,h, pinsPerSide, kind]
const PARTS={
  U1:{r:[70,90,220,150],name:'本职工作',kind:'qfp'},
  U2:{r:[380,70,270,190],name:'个人插件',kind:'qfp'},
  U3:{r:[740,90,190,140],name:'其它项目',kind:'qfp'},
  U4:{r:[80,350,200,120],name:'最近在用',kind:'soic'},
  U5:{r:[360,360,210,130],name:'音乐',kind:'soic'},
  U6:{r:[640,360,170,120],name:'摄影',kind:'soic'},
  J1:{r:[880,300,70,230],name:'联系',kind:'conn'},
};
const ORDER=['U1','U2','U3','U4','U5','U6','J1'];
// nets as polylines in board units (45°/orthogonal routing)
const NETS=[
  [[290,150],[335,150],[350,135],[380,135]],
  [[650,140],[700,140],[715,155],[740,155]],
  [[930,160],[915,160],[915,280],[915,300]],
  [[180,240],[180,350]],
  [[280,410],[360,410]],
  [[570,420],[640,420]],
  [[810,420],[880,420]],
  [[515,260],[515,300],[470,345],[470,360]],
  [[290,200],[320,200],[345,225],[345,330],[330,345],[330,470],[350,490],[400,490],[400,490]],
  [[600,260],[600,320],[720,320],[740,300],[790,300],[790,250],[830,230],[830,230]],
  [[560,490],[560,540],[860,540],[880,520]],
];
const VIA_TOP=[945,575];
const BW=1000,BH=620;
// mobile: simple 2-column grid
const MOBILE={U1:[60,60],U2:[540,60],U3:[60,330],U4:[540,330],U5:[60,600],U6:[540,600],J1:[300,870]};

export function initEnding(root,{run,scrollToY,RM}){
  const sec=root.querySelector('#ending'); if(!sec) return ()=>{};
  const cv=sec.querySelector('.ending-cv'), g=cv.getContext('2d');
  const links=[...sec.querySelectorAll('.ending-part')], topBtn=sec.querySelector('.ending-top');
  const cleanups=[]; const on=(t,ty,f,o)=>{t.addEventListener(ty,f,o);cleanups.push(()=>t.removeEventListener(ty,f,o));};
  let W=0,H=0,DPR=1,mob=false, S=1,OX=0,OY=0, prog=-1, hover=null, sweepT=-1, sweepStart=0, dirty=true, visible=false;
  const lens=NETS.map(n=>{let L=0;for(let i=1;i<n.length;i++)L+=Math.hypot(n[i][0]-n[i-1][0],n[i][1]-n[i-1][1]);return L;});

  function layout(){
    mob=innerWidth<700; sec.classList.toggle('static',mob||RM);
    const r=cv.getBoundingClientRect(); W=r.width; H=r.height; DPR=Math.min(devicePixelRatio||1,2);
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    dirty=true; draw();
  }
  function boardRect(name){ if(mob){const [x,y]=MOBILE[name]; const w=name==='J1'?400:400,h=name==='J1'?150:220; return [x,y,w,h];} return PARTS[name].r; }
  function progress(){ if(mob||RM) return 1; const r=sec.getBoundingClientRect(); return clamp(-r.top/Math.max(1,r.height-innerHeight),0,1); }

  // timeline (desktop): 0-.25 zoom out, .08-.55 parts assemble, .45-.78 traces route, >=.8 power-on sweep (timed)
  function draw(now){
    const p=progress(); if(!dirty&&p===prog&&sweepT<0&&!now) return; prog=p; dirty=false;
    const bw=mob?1000:BW, bh=mob?1060:BH;
    const fit=Math.min(W*(mob?.94:.84)/bw,H*(mob?.9:.78)/bh);
    const z=mob||RM?1:1+(1-ease(seg(p,0,.25)))*1.9;           // camera zoom-out
    S=fit*z; OX=W/2-bw*S/2; OY=H/2-bh*S/2+(mob?0:H*.03);
    g.setTransform(DPR,0,0,DPR,0,0); g.clearRect(0,0,W,H);
    // board
    const T=(x,y)=>[OX+x*S,OY+y*S];
    g.save(); const [bx,by]=T(0,0);
    g.fillStyle='#0a1d13'; g.strokeStyle='rgba(246,197,106,.55)'; g.lineWidth=Math.max(1,2*S);
    g.beginPath(); g.roundRect(bx,by,bw*S,bh*S,18*S); g.fill(); g.stroke();
    // mounting holes
    [[22,22],[bw-22,22],[22,bh-22],[bw-22,bh-22]].forEach(([x,y])=>{const [X,Y]=T(x,y);g.fillStyle='rgba(214,150,70,.7)';g.beginPath();g.arc(X,Y,10*S,0,7);g.fill();g.fillStyle='#030806';g.beginPath();g.arc(X,Y,5*S,0,7);g.fill();});
    // fine grid
    g.strokeStyle='rgba(184,255,60,.035)'; g.lineWidth=1; g.beginPath(); for(let x=40;x<bw;x+=40){const [X]=T(x,0);g.moveTo(X,by);g.lineTo(X,by+bh*S);} for(let y=40;y<bh;y+=40){const [,Y]=T(0,y);g.moveTo(bx,Y);g.lineTo(bx+bw*S,Y);} g.stroke();
    // silkscreen title
    g.fillStyle='rgba(238,242,234,.85)'; g.textBaseline='alphabetic';
    const tx=mob?40:60, ty=mob?bh-40:bh-62;
    g.font=`900 ${Math.round((mob?54:44)*S)}px "Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif`; g.fillText('海洋湃',...T(tx,ty));
    g.font=`${Math.round((mob?22:15)*S)}px ui-monospace,SFMono-Regular,Menlo,monospace`; g.fillStyle='rgba(238,242,234,.55)';
    g.fillText('OCEAN-HOME · REV 2026.10',...T(tx,ty+(mob?34:26)));
    // sweep timing
    const sweepK=sweepT<0?0:sweepT;          // 0..1 over nets
    // traces
    if(!mob){
      const tp=RM?1:seg(p,.45,.78);
      NETS.forEach((n,i)=>{ const local=clamp(tp*1.4-i*(.4/NETS.length),0,1); if(local<=0)return;
        const lit=sweepK*NETS.length-i; const la=clamp(lit,0,1);
        drawPath(n,lens[i]*ease(local),T,la); });
    }
    // parts
    ORDER.forEach((name,i)=>{
      const k=mob||RM?1:ease(seg(p,.08+i*.05,.3+i*.05));
      const [x,y,w,h]=boardRect(name); const ang=i*2.1; const off=(1-k)*700;
      const dx=Math.cos(ang)*off, dy=Math.sin(ang)*off*.6;
      const lit=clamp(sweepK*(ORDER.length+1)-i,0,1);
      drawPart(name,x+dx,y+dy,w,h,k,T,lit,hover===name);
      // DOM hit target follows the part (transform only)
      const el=links[i]; if(el){ const [X,Y]=T(x+dx,y+dy); el.style.transform=`translate(${X}px,${Y}px)`; el.style.width=w*S+'px'; el.style.height=h*S+'px'; el.style.opacity=k>.9?'1':'0'; el.style.pointerEvents=k>.9?'auto':'none'; }
    });
    // back-to-top via
    const vk=mob||RM?1:seg(p,.6,.75); const [vx,vy]=mob?T(bw-260,bh-70):T(...VIA_TOP);
    g.globalAlpha=vk; const R=Math.max(9,14*S);
    g.fillStyle=sweepK>=1?'#b8ff3c':'rgba(214,150,70,.85)'; g.beginPath(); g.arc(vx,vy,R,0,7); g.fill(); g.fillStyle='#030806'; g.beginPath(); g.arc(vx,vy,R*.45,0,7); g.fill(); g.globalAlpha=1;
    if(topBtn){ topBtn.style.transform=`translate(${vx}px,${vy}px)`; topBtn.style.opacity=vk>.9?'1':'0'; topBtn.style.pointerEvents=vk>.9?'auto':'none'; }
    g.restore();
    // power-on trigger
    if(!mob&&!RM){ if(p>=.8&&sweepT<0){ sweepT=0; sweepStart=performance.now(); run(sweepTick);} else if(p<.7&&sweepT>=0){ sweepT=-1; dirty=true; } }
  }
  function drawPath(n,len,T,lit){
    g.lineCap='round'; g.lineJoin='round';
    const path=()=>{ g.beginPath(); let left=len; const [x0,y0]=T(...n[0]); g.moveTo(x0,y0);
      for(let j=1;j<n.length&&left>0;j++){ const a=n[j-1],b=n[j],L=Math.hypot(b[0]-a[0],b[1]-a[1]),u=Math.min(1,left/L); left-=L; g.lineTo(...T(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u)); } };
    path(); g.strokeStyle='rgba(205,135,55,.85)'; g.lineWidth=Math.max(1.4,5*S); g.stroke();
    if(lit>0){ g.save(); g.globalAlpha=lit; g.shadowColor='#b8ff3c'; g.shadowBlur=12; g.strokeStyle='#c8ff5a'; g.lineWidth=Math.max(1.4,4*S); path(); g.stroke(); g.restore(); }
  }
  function drawPart(name,x,y,w,h,k,T,lit,hov){
    if(k<=0)return; g.save(); g.globalAlpha=k;
    const kind=mob?(name==='J1'?'conn':'qfp'):PARTS[name].kind;
    const pad=(px,py,pw,ph)=>{const [X,Y]=T(px,py); g.fillRect(X,Y,pw*S,ph*S);};
    g.fillStyle=lit>0?`rgba(${Math.round(205+(184-205)*lit)},${Math.round(140+(255-140)*lit)},${Math.round(60+(60-60)*lit)},.95)`:'rgba(205,140,60,.85)';
    if(kind==='qfp'){ const n=Math.max(4,Math.round(w/22)), m=Math.max(3,Math.round(h/22));
      for(let i=0;i<n;i++){const px=x+18+i*(w-36)/(n-1)-4; pad(px,y-14,8,16); pad(px,y+h-2,8,16);}
      for(let i=0;i<m;i++){const py=y+18+i*(h-36)/(m-1)-4; pad(x-14,py,16,8); pad(x+w-2,py,16,8);} }
    else if(kind==='soic'){ const n=Math.max(4,Math.round(w/24)); for(let i=0;i<n;i++){const px=x+16+i*(w-32)/(n-1)-5; pad(px,y-16,10,18); pad(px,y+h-2,10,18);} }
    else { const n=Math.max(4,Math.round(h/30)); for(let i=0;i<n;i++){const py=y+18+i*(h-36)/(n-1); const [X,Y]=T(x+w/2,py); g.beginPath(); g.arc(X,Y,11*S,0,7); g.fill(); g.fillStyle='#030806'; g.beginPath(); g.arc(X,Y,5*S,0,7); g.fill(); g.fillStyle=lit>0?'#b8ff3c':'rgba(205,140,60,.85)';} }
    const [X,Y]=T(x,y);
    g.fillStyle=kind==='conn'?'rgba(10,29,19,0)':'#0d1612'; g.strokeStyle=hov?'#b8ff3c':'rgba(238,242,234,.6)'; g.lineWidth=hov?2:Math.max(1,1.6*S);
    g.beginPath(); g.roundRect(X,Y,w*S,h*S,6*S); if(kind!=='conn')g.fill(); g.stroke();
    if(lit>0&&kind!=='conn'){ g.save(); g.globalAlpha=k*lit*.5; g.shadowColor='#b8ff3c'; g.shadowBlur=18; g.strokeStyle='#b8ff3c'; g.stroke(); g.restore(); }
    // pin-1 dot + designator + name (silkscreen)
    g.fillStyle='rgba(238,242,234,.7)'; g.beginPath(); g.arc(X+12*S,Y+12*S,Math.max(1.5,4*S),0,7); g.fill();
    g.textAlign='center'; g.textBaseline='middle';
    const cx=X+w*S/2, cy=Y+h*S/2;
    if(kind==='conn'){ g.fillStyle=lit>0?'#b8ff3c':'#eef2ea'; g.font=`700 ${Math.round(20*S)}px ui-monospace,monospace`; g.fillText(name,cx,Y-30*S); g.font=`${Math.round(14*S)}px "Noto Sans CJK SC",sans-serif`; g.fillStyle='rgba(238,242,234,.7)'; g.fillText(PARTS[name].name,cx,Y+h*S+30*S); }
    else { g.fillStyle=lit>0?'#d9ff7a':'#f6c06a'; g.font=`800 ${Math.round((mob?46:30)*S)}px ui-monospace,monospace`; g.fillText(name,cx,cy-12*S*(mob?1.4:1));
      g.fillStyle='rgba(238,242,234,.75)'; g.font=`${Math.round((mob?30:17)*S)}px "Noto Sans CJK SC","PingFang SC",sans-serif`; g.fillText(PARTS[name].name,cx,cy+18*S*(mob?1.4:1)); }
    g.textAlign='start'; g.textBaseline='alphabetic'; g.restore();
  }
  function sweepTick(now){ if(sweepT<0)return false; sweepT=clamp((now-sweepStart)/1600,0,1); dirty=true; draw(); if(sweepT>=1)return false; }

  // static modes light up once when seen
  const io=new IntersectionObserver(es=>{ visible=es[0].isIntersecting; if(visible&&(mob||RM)&&sweepT<0){ if(RM){sweepT=1;dirty=true;draw();} else { sweepT=0; sweepStart=performance.now(); run(sweepTick);} } if(visible){dirty=true;draw();} },{threshold:.2});
  io.observe(sec); cleanups.push(()=>io.disconnect());
  let queued=false; const onScroll=()=>{ if(!visible||queued)return; queued=true; run(()=>{queued=false; draw(); return false;}); };
  on(window,'scroll',onScroll,{passive:true}); on(window,'resize',layout);
  links.forEach(el=>{ on(el,'pointerenter',()=>{hover=el.dataset.ref;dirty=true;draw();}); on(el,'pointerleave',()=>{hover=null;dirty=true;draw();}); on(el,'focus',()=>{hover=el.dataset.ref;dirty=true;draw();}); on(el,'blur',()=>{hover=null;dirty=true;draw();}); });
  layout();
  return ()=>cleanups.forEach(f=>f());
}
