import { AlbumGateScript } from "../components/album/album-gate-script";

// Only job: switch the flip-book album on before first paint (no flash of the grid).
// React cannot put an inline script into <head> from a nested layout, so it is the first thing in <body>,
// which still runs before any page content is parsed or painted. It appends <meta name="ph-album"> to <head>
// unless reduced motion is on or the browser lacks :has(). Without the meta (no JS, reduced motion, no :has(), or the
// album JS never mounting - see the fallback in album-gate.ts) the static 12-photo grid shows as before.
export default function PhotographyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AlbumGateScript />
      {children}
    </>
  );
}
