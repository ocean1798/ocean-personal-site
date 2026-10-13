/* eslint-disable */
// One shared requestAnimationFrame loop for the whole PCB home page.
// Each tick reads scroll position / viewport ONCE (S.y, S.vh) before any task runs; tasks only write.
// `pre` tasks (smooth scroll) run first so everyone else sees the scroll position of this frame.
export const S={y:0,vh:0,t:0};
const tasks=new Set(), pre=new Set(); let id=0,last=0,inLoop=false;
function loop(t){ inLoop=true; S.y=window.scrollY; S.vh=window.innerHeight; S.t=t;
  const dt=Math.min(.05,(t-(last||t))/1000); last=t;
  for(const f of [...pre]) if(f(t,dt)===false) pre.delete(f);
  for(const f of [...tasks]) if(f(t,dt)===false) tasks.delete(f);
  inLoop=false; id=0;
  if((tasks.size||pre.size)&&!document.hidden) id=requestAnimationFrame(loop); else last=0; }
function wake(){ if(!id&&!inLoop&&!document.hidden&&(tasks.size||pre.size)) id=requestAnimationFrame(loop); }
/** run f every frame until it returns false */
export function run(f,first){ (first?pre:tasks).add(f); wake(); }
/** run f once on the next frame (requestAnimationFrame replacement) */
export function once(f){ run((t,dt)=>{ f(t,dt); return false; }); }
export function stop(f){ tasks.delete(f); pre.delete(f); }
if(typeof document!=='undefined') document.addEventListener('visibilitychange',wake);
