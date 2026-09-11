import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("keeps the first frame semantic and independent from Canvas", async () => {
  const html = await read("index.html");
  assert.match(html, /OCEAN · 产品经理 \/ EDA · PCB/);
  assert.match(html, /负责嘉立创 EDA 专业版中部分 PCB 功能的产品设计/);
  assert.match(html, /团队产品 · 我的职责：部分 PCB 功能产品设计/);
  assert.match(html, /继续看看/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /<canvas/i);
  assert.equal((html.match(/class="sticker sticker-/g) ?? []).length, 5);
});

test("keeps Canvas decorative and the reveal within the fixed budget contract", async () => {
  const [scene, styles] = await Promise.all([
    read("src/hero/ocean-scene.ts"),
    read("src/styles.css"),
  ]);
  assert.match(scene, /REVEAL_RADIUS_UV = 0\.16/);
  assert.match(scene, /REVEAL_FEATHER_UV = 0\.055/);
  assert.match(scene, /REVEAL_EXIT_MS = 360/);
  assert.match(scene, /MAX_DPR = 1\.5/);
  assert.match(scene, /webglcontextlost/);
  assert.match(scene, /aria-hidden/);
  assert.match(styles, /\.visual-stage canvas[\s\S]*pointer-events: none/);
  assert.match(styles, /z-index: 20/);
  assert.match(styles, /z-index: 50/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
});

test("keeps rejected experiments isolated from the main entry", async () => {
  const main = await read("src/main.ts");
  assert.doesNotMatch(main, /@react-three\/fiber|lenis|EffectComposer|ShaderPass/);
  assert.match(main, /import\("\.\/hero\/ocean-scene"\)/);
});

test("generates all raster fallback variants inside their size budgets", async () => {
  const assets = [
    ["public/posters/desktop-initial.avif", 220_000],
    ["public/posters/desktop-initial.webp", 300_000],
    ["public/posters/desktop-formed.avif", 220_000],
    ["public/posters/desktop-formed.webp", 300_000],
    ["public/posters/mobile-static.avif", 140_000],
    ["public/posters/mobile-static.webp", 180_000],
  ];
  for (const [relativePath, budget] of assets) {
    const details = await stat(path.join(root, relativePath));
    assert.ok(details.size <= budget, `${relativePath} exceeds ${budget} bytes`);
  }
});
