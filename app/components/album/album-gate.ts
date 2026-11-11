// Shared between the early inline script (photography layout / home shell) and the album component.
// The gate is a <meta> appended to <head>: React 19 tolerates extra nodes in <head> during hydration,
// whereas a class on <html> would be reported as a hydration mismatch (root layout is not ours to change).
export const ALBUM_GATE_META = "ph-album";
export const ALBUM_GATE_SCRIPT_ID = "ph-album-gate";
export const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

// Safety net: once the album is near the viewport (or the URL already asks for #pNN),
// if the book has not been drawn 3 s after load (e.g. a JS chunk failed), or 6 s after
// this timer was armed at the latest, drop the meta so the static grid shows instead of
// a blank area. Timers must not start while the visitor is still on the hero.
// When the album does mount later it re-adds the meta itself (photo-album.tsx, ensureGate).
export const ALBUM_FALLBACK_MS = 3000;
export const ALBUM_FALLBACK_CAP_MS = 6000;

export const albumGateScript = [
  "(function(){try{",
  `if(matchMedia(${JSON.stringify(REDUCE_QUERY)}).matches||!(window.CSS&&CSS.supports("selector(:has(a))")))return;`,
  `var m=document.createElement("meta");m.name=${JSON.stringify(ALBUM_GATE_META)};m.content="on";document.head.appendChild(m);`,
  "var started=false;",
  'var c=function(){if(!document.querySelector(".album .book")&&m.parentNode)m.parentNode.removeChild(m)};',
  `var arm=function(){if(started)return;started=true;var later=function(){setTimeout(c,${ALBUM_FALLBACK_MS})};if(document.readyState==="complete")later();else addEventListener("load",later);setTimeout(c,${ALBUM_FALLBACK_CAP_MS})};`,
  "if(/^#p\\d{1,2}$/.test(location.hash))arm();",
  'var watch=function(el){var io=new IntersectionObserver(function(ents){if(ents.some(function(e){return e.isIntersecting})){arm();io.disconnect()}},{rootMargin:"50% 0px"});io.observe(el)};',
  'var el=document.querySelector(".album");if(el)watch(el);else{var mo=new MutationObserver(function(){var a=document.querySelector(".album");if(a){mo.disconnect();watch(a)}});mo.observe(document.documentElement,{childList:true,subtree:true})}',
  "}catch(e){}})();",
].join("");
