// Tiny hook so the album can pause / realign the home page's lerp smooth scroll
// without importing motion-batch2 (and its parallax) into the photography bundle.

let align = () => {};
let pause = (_on) => {};

export function setSmoothScrollAlign(fn) {
  align = typeof fn === "function" ? fn : () => {};
}

export function setSmoothScrollPauseHook(fn) {
  pause = typeof fn === "function" ? fn : () => {};
}

/** Stop an in-flight lerp and adopt the current scrollY as the new target. */
export function alignSmoothScroll() {
  align();
}

/** While true, the home page must not intercept the wheel (album owns the scroll). */
export function setAlbumScrollPause(on) {
  pause(on);
}
