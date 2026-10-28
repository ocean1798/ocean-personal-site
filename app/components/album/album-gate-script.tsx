"use client";

import { ALBUM_GATE_SCRIPT_ID, albumGateScript } from "./album-gate";

// Renders the inline gate script for the server HTML (and keeps it during hydration, where it already exists in
// the DOM). On a client-side navigation the script would never run anyway and React warns about creating a
// <script> on the client, so it renders nothing then; <PhotoAlbum> sets the gate itself in a layout effect.
export function AlbumGateScript() {
  if (typeof document !== "undefined" && !document.getElementById(ALBUM_GATE_SCRIPT_ID)) return null;
  return <script id={ALBUM_GATE_SCRIPT_ID} dangerouslySetInnerHTML={{ __html: albumGateScript }} />;
}
