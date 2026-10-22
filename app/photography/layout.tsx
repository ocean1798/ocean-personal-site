import { AlbumGateScript } from "../components/album/album-gate-script";

// Only job: switch the flip-book album on before first paint (no flash of the grid).
// React cannot put an inline script into <head> from a nested layout, so it is the first thing in <body>,
// which still runs before any page content is parsed or painted. It appends <meta name="ph-album"> to <head>
// (unless reduced motion is on); without JS or with reduced motion the static 12-photo grid shows as before.
export default function PhotographyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AlbumGateScript />
      {children}
    </>
  );
}
