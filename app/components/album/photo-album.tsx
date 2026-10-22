"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { S as FB, run as fbRun, stop as fbStop } from "../pcb/frame-bus.js";
import { clamp01, pFromT, photosToLoad, spreadOfPhoto, tFromP } from "./album-math";
import { ALBUM_GATE_META, REDUCE_QUERY } from "./album-gate";

export type AlbumPhoto = {
  number: string; // "01"
  name: string;
  source: string;
  alt: string;
  width: number;
  height: number;
  webp900: string; // already passed through withBasePath() on the server (page.tsx)
  jpg1800: string;
};

type Props = {
  photos: readonly AlbumPhoto[]; // photos that go into the book, in order
  children: ReactNode; // the server-rendered grid (stays in the DOM untouched)
};

const WIDE_QUERY = "(min-width: 640px)";

// Trial knob for the compositing comparison in design-v3: ?album-wc=always keeps will-change on every leaf,
// the default only promotes a leaf while it is turning.
function willChangeMode(): "always" | "flip" {
  try {
    return new URLSearchParams(location.search).get("album-wc") === "always" ? "always" : "flip";
  } catch {
    return "flip";
  }
}

function ensureGate(on: boolean) {
  const existing = document.head.querySelector(`meta[name="${ALBUM_GATE_META}"]`);
  if (on && !existing) {
    const m = document.createElement("meta");
    m.name = ALBUM_GATE_META;
    m.content = "on";
    document.head.appendChild(m);
  } else if (!on && existing) {
    existing.remove();
  }
}

function supportsHas() {
  try {
    return CSS.supports("selector(:has(a))");
  } catch {
    return false;
  }
}

export function PhotoAlbum({ photos, children }: Props) {
  // null until mounted: the server HTML and the first client render are the same empty shell (no hydration diff)
  const [mode, setMode] = useState<null | "off" | "wide" | "narrow">(null);
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set());

  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<(HTMLDivElement | null)[]>([]);

  const count = photos.length;
  const wide = mode === "wide";
  // number of leaves that turn
  const T = wide ? Math.ceil(count / 2) + 1 : count;

  // ---- decide on/off and wide/narrow before first paint ----
  useLayoutEffect(() => {
    const reduce = matchMedia(REDUCE_QUERY);
    const wideMq = matchMedia(WIDE_QUERY);
    const decide = () => {
      const on = !reduce.matches && supportsHas();
      // client-side navigations do not execute the inline head script, so (re)assert the gate here, before paint
      ensureGate(on);
      setMode(on ? (wideMq.matches ? "wide" : "narrow") : "off");
    };
    decide();
    reduce.addEventListener("change", decide);
    wideMq.addEventListener("change", decide);
    return () => {
      reduce.removeEventListener("change", decide);
      wideMq.removeEventListener("change", decide);
      ensureGate(false);
    };
  }, []);

  // geometry, measured outside the frame loop
  const geom = useRef({ top: 0, range: 1 });
  const measure = useCallback(() => {
    const sc = scrollerRef.current;
    const st = stageRef.current;
    if (!sc || !st) return;
    const r = sc.getBoundingClientRect();
    geom.current.top = r.top + window.scrollY;
    geom.current.range = Math.max(1, sc.offsetHeight - st.offsetHeight);
  }, []);

  const jumpToHash = useCallback(
    (hash: string) => {
      const m = /^#p(\d\d)$/.exec(hash);
      if (!m || (mode !== "wide" && mode !== "narrow")) return false;
      const idx = photos.findIndex((ph) => ph.number === m[1]);
      if (idx < 0) return false; // not in the book: the grid anchor handles it natively
      measure();
      const p = pFromT(spreadOfPhoto(idx + 1, mode === "wide"), T);
      const top = Math.round(geom.current.top + p * geom.current.range);
      // instant: globals.css sets scroll-behavior:smooth, which would otherwise riffle through every page
      window.scrollTo({ top, behavior: "instant" });
      return true;
    },
    [mode, photos, T, measure],
  );

  // ---- per-frame page turning on the shared frame-bus ----
  useEffect(() => {
    if (mode !== "wide" && mode !== "narrow") return;
    const sc = scrollerRef.current;
    const book = bookRef.current;
    if (!sc || !book) return;
    const isWide = mode === "wide";
    const leaves = leavesRef.current.slice(0, isWide ? T : count + 1).filter(Boolean) as HTMLDivElement[];
    const L = leaves.length;
    const wc = willChangeMode();
    const cache = leaves.map(() => ({ tr: "", wc: "", vis: "" }));
    let bookTr = "";
    let lastY = NaN;
    let lastTop = NaN;
    let lastRange = NaN;
    let loadedKey = "";

    measure();

    const apply = (t: number) => {
      for (let i = 0; i < L; i++) {
        const f = clamp01(t - i);
        // unturned leaves stack with the top one highest; turned leaves stack the other way round
        const z = (f < 0.5 ? L - i : i + 1) * 0.6;
        const tr = `translateZ(${z.toFixed(1)}px) rotateY(${(-180 * f).toFixed(2)}deg)`;
        const c = cache[i];
        const el = leaves[i];
        if (c.tr !== tr) {
          c.tr = tr;
          el.style.transform = tr;
        }
        const w = wc === "always" || (f > 0 && f < 1) ? "transform" : "auto";
        if (c.wc !== w) {
          c.wc = w;
          el.style.willChange = w;
        }
        // narrow: a fully turned single page would sit off to the left of the screen; take it out of view
        const vis = !isWide && f >= 1 ? "hidden" : "";
        if (c.vis !== vis) {
          c.vis = vis;
          el.style.visibility = vis;
        }
      }
      // wide: the closed book shows only its right half, so slide it left by a quarter to centre it
      const shift = isWide ? -25 * (1 - clamp01(t)) : 0;
      const btr = `translateX(${shift.toFixed(2)}%)`;
      if (btr !== bookTr) {
        bookTr = btr;
        book.style.setProperty("--album-shift", btr);
      }
      const need = photosToLoad(t, isWide, count);
      const key = need.join(",");
      if (key !== loadedKey) {
        loadedKey = key;
        setLoaded((prev) => {
          if (need.every((n) => prev.has(n))) return prev;
          const next = new Set(prev);
          need.forEach((n) => next.add(n));
          return next;
        });
      }
    };

    const tick = () => {
      const y = FB.y;
      const { top, range } = geom.current;
      if (y === lastY && top === lastTop && range === lastRange) return; // nothing moved: no writes
      lastY = y;
      lastTop = top;
      lastRange = range;
      apply(tFromP((y - top) / range, T));
    };

    // first paint without waiting for the loop
    apply(tFromP((window.scrollY - geom.current.top) / geom.current.range, T));

    let running = false;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting);
        if (vis && !running) {
          running = true;
          lastY = NaN;
          fbRun(tick);
        } else if (!vis && running) {
          running = false;
          fbStop(tick);
          // settle exactly at either end when leaving the scroller quickly
          apply(tFromP((window.scrollY - geom.current.top) / geom.current.range, T));
        }
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(sc);

    const ro = new ResizeObserver(() => {
      measure();
      lastY = NaN;
    });
    ro.observe(sc);
    ro.observe(document.body);
    const onResize = () => {
      measure();
      lastY = NaN;
    };
    window.addEventListener("resize", onResize);

    return () => {
      fbStop(tick);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [mode, T, count, measure]);

  // ---- #pNN: direct loads and in-page / router hash changes ----
  useEffect(() => {
    if (mode !== "wide" && mode !== "narrow") return;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // on reload, keep the browser's scroll restoration (A12) instead of re-jumping to the hash
    if (location.hash && nav?.type !== "reload") {
      if (jumpToHash(location.hash)) {
        // the router / browser may still try its own (no-op, hidden) anchor scroll after mount; re-assert once
        const id = requestAnimationFrame(() => jumpToHash(location.hash));
        return () => cancelAnimationFrame(id);
      }
    }
  }, [mode, jumpToHash]);

  useEffect(() => {
    const onHash = () => jumpToHash(location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [jumpToHash]);

  const style = {
    "--album-turns-wide": Math.ceil(count / 2) + 1,
    "--album-turns-narrow": count,
  } as CSSProperties;

  return (
    <>
      <div className="album" ref={scrollerRef} style={style} aria-label="翻页相册" role="region">
        <div className="album-stage" ref={stageRef}>
          {mode === "wide" || mode === "narrow" ? (
            <div className={`book ${mode}`} ref={bookRef}>
              <div className="book-board" aria-hidden="true"></div>
              {wide ? (
                <>
                  <div className="leaf" ref={(el) => void (leavesRef.current[0] = el)}>
                    <Cover />
                    <div className="face back endpaper" aria-hidden="true">
                      <span className="endpaper-mark">我眼中的世界</span>
                    </div>
                  </div>
                  {Array.from({ length: Math.ceil(count / 2) }, (_, s) => (
                    <div className="leaf" key={s} ref={(el) => void (leavesRef.current[s + 1] = el)}>
                      <Page photo={photos[2 * s]} side="front" load={loaded.has(2 * s + 1)} />
                      {photos[2 * s + 1] ? (
                        <Page photo={photos[2 * s + 1]} side="back" load={loaded.has(2 * s + 2)} />
                      ) : (
                        <div className="face back paper" />
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="leaf" ref={(el) => void (leavesRef.current[0] = el)}>
                    <Cover />
                    <div className="face back paper" aria-hidden="true" />
                  </div>
                  {photos.map((photo, i) => (
                    <div className="leaf" key={photo.number} ref={(el) => void (leavesRef.current[i + 1] = el)}>
                      <Page photo={photo} side="front" load={loaded.has(i + 1)} />
                      <div className="face back paper" aria-hidden="true" />
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </>
  );
}

function Cover() {
  return (
    <div className="face front cover">
      <span className="cover-pad tl" />
      <span className="cover-pad tr" />
      <span className="cover-pad bl" />
      <span className="cover-pad br" />
      <span className="cover-title">
        <b>OCEAN</b>
        <i>PHOTOGRAPHY</i>
      </span>
      <span className="cover-silk">REV 1.0 · 海洋湃 · 摄影</span>
    </div>
  );
}

function Page({ photo, side, load }: { photo: AlbumPhoto; side: "front" | "back"; load: boolean }) {
  return (
    <div className={`face ${side} paper`}>
      <figure className="album-photo">
        <span className="ph-frame">
          {/* same picture markup / class as responsive-photo.tsx, but src is only filled in on demand */}
          <picture className="responsive-photo">
            <source type="image/webp" srcSet={load ? photo.webp900 : undefined} />
            <img
              src={load ? photo.jpg1800 : undefined}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              decoding="async"
              draggable={false}
            />
          </picture>
        </span>
        <figcaption className="album-ref">
          {photo.number} · {photo.source}
        </figcaption>
      </figure>
    </div>
  );
}
