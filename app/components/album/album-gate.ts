// Shared between the head inline script (app/photography/layout.tsx) and the album component.
// The gate is a <meta> appended to <head>: React 19 tolerates extra nodes in <head> during hydration,
// whereas a class on <html> would be reported as a hydration mismatch (root layout is not ours to change).
export const ALBUM_GATE_META = "ph-album";
export const ALBUM_GATE_SCRIPT_ID = "ph-album-gate";
export const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

export const albumGateScript = `(function(){try{if(matchMedia(${JSON.stringify(
  REDUCE_QUERY,
)}).matches||!(window.CSS&&CSS.supports("selector(:has(a))")))return;var m=document.createElement("meta");m.name=${JSON.stringify(
  ALBUM_GATE_META,
)};m.content="on";document.head.appendChild(m)}catch(e){}})();`;
