// Pure scroll <-> page-turn maths for the photography album (no DOM).
//
// Terminology
//   T    number of leaves that turn (wide: cover + sheets, narrow: cover + photo pages before the last)
//   p    progress through the album scroller, 0..1
//   t    page-turn position, 0..T. Leaf i is turned clamp(t - i, 0, 1) of the way (0 = right, 1 = left).
//   Each leaf owns 1/T of the scroll; the first FLIP share of it turns the leaf,
//   the rest (DWELL) holds the spread that the turn revealed so it can be looked at.

export const FLIP = 0.7;
export const DWELL = 1 - FLIP;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** scroll progress p (0..1) -> page-turn position t (0..T) */
export function tFromP(p: number, T: number): number {
  const u = clamp01(p) * T;
  const i = Math.min(Math.floor(u), T);
  const f = u - i;
  return Math.min(T, i + Math.min(1, f / FLIP));
}

/** page-turn position t (integer spread) -> scroll progress p, landing in the middle of that spread's dwell */
export function pFromT(t: number, T: number): number {
  if (t <= 0) return 0;
  const k = Math.min(t, T);
  return clamp01((k - 1 + FLIP + DWELL / 2) / T);
}

/** which spread shows photo n (1-based). Wide: floor(n/2)+1; narrow: n. */
export function spreadOfPhoto(n: number, wide: boolean): number {
  return wide ? Math.floor(n / 2) + 1 : n;
}

/**
 * Photo numbers (1-based, within the book) that are on screen at turn position t,
 * plus one page on either side. Used to fill in <img src> on demand.
 */
export function photosToLoad(t: number, wide: boolean, count: number): number[] {
  const lo = Math.floor(t);
  const hi = Math.ceil(t);
  const pages = new Set<number>();
  for (const k of new Set([lo, hi])) {
    if (wide) {
      // spread k: left page = photo 2k-2 (back of leaf k-1), right page = photo 2k-1 (front of leaf k)
      pages.add(2 * k - 2);
      pages.add(2 * k - 1);
    } else {
      pages.add(k); // spread k shows photo k (k = 0 is the cover)
    }
  }
  const visible = [...pages].filter((n) => n >= 1 && n <= count);
  const min = visible.length ? Math.min(...visible) : 1;
  const max = visible.length ? Math.max(...visible) : 0;
  const out: number[] = [];
  for (let n = Math.max(1, min - 1); n <= Math.min(count, max + 1); n++) out.push(n);
  return out;
}
