"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { AlbumPhoto, PhotoAlbum } from "./photo-album";

type Props = {
  photos: readonly AlbumPhoto[];
  children: ReactNode;
};

/**
 * Keeps the reserved-height .album shell (and the server-rendered grid) in the HTML,
 * and only loads the flip-book chunk when the section is near the viewport or the URL
 * is already #pNN. Once loaded, the book is never unloaded.
 */
export function AlbumLazy({ photos, children }: Props) {
  const [Book, setBook] = useState<null | typeof PhotoAlbum>(null);
  const started = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const load = () => {
      if (started.current) return;
      started.current = true;
      void import("./photo-album").then((mod) => {
        setBook(() => mod.PhotoAlbum);
      });
    };

    if (typeof location !== "undefined" && /^#p\d{1,2}$/.test(location.hash)) {
      load();
      return;
    }

    const el = shellRef.current;
    if (!el) {
      load();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) load();
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = {
    "--album-turns-wide": Math.ceil(photos.length / 2) + 1,
    "--album-turns-narrow": photos.length,
  } as CSSProperties;

  if (Book) {
    return <Book photos={photos}>{children}</Book>;
  }

  return (
    <>
      <div className="album" ref={shellRef} style={style} aria-label="翻页相册" role="region">
        <div className="album-stage" />
      </div>
      {children}
    </>
  );
}
