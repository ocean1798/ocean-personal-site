// Shared between the head inline script (app/photography/layout.tsx) and the album component.
// The gate is a <meta> appended to <head>: React 19 tolerates extra nodes in <head> during hydration,
// whereas a class on <html> would be reported as a hydration mismatch (root layout is not ours to change).
export const ALBUM_GATE_META = "ph-album";
export const ALBUM_GATE_SCRIPT_ID = "ph-album-gate";
export const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

// Safety net: if the book has not been drawn ~3 s after the page finished loading (e.g. a JS chunk failed to load
// right after a deploy), drop the meta again so the static grid shows instead of a blank page. When the album does
// mount later it re-adds the meta itself (photo-album.tsx, ensureGate).
export const ALBUM_FALLBACK_MS = 3000;

export const albumGateScript = `(function(){try{if(matchMedia(${JSON.stringify(
  REDUCE_QUERY,
)}).matches||!(window.CSS&&CSS.supports("selector(:has(a))")))return;var m=document.createElement("meta");m.name=${JSON.stringify(
  ALBUM_GATE_META,
)};m.content="on";document.head.appendChild(m);var c=function(){if(!document.querySelector(".album .book")&&m.parentNode)m.parentNode.removeChild(m)};addEventListener("load",function(){setTimeout(c,${ALBUM_FALLBACK_MS})})}catch(e){}})();`;
