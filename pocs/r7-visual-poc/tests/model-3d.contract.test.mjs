import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("ships the locked full-screen Ocean content and layer contract", async () => {
  const [html, source, styles] = await Promise.all([
    read("modules/model-3d/index.html"),
    read("modules/model-3d/main.ts"),
    read("modules/model-3d/styles.css"),
  ]);
  assert.match(html, /01 \/ IDENTITY/);
  assert.match(html, /02 \/ CURRENT ROLE/);
  assert.match(html, /03 \/ FOCUS/);
  assert.match(html, /PRODUCT MANAGER/);
  assert.match(html, /嘉立创 EDA 专业版中部分 PCB 功能的产品设计/);
  assert.match(html, /I TURN COMPLEX/);
  assert.match(html, /EDA WORK INTO/);
  assert.match(html, /CLEAR PRODUCT FLOWS/);
  assert.match(html, /aria-label="开启 3D"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /m1-stage-guide|让想法|长出形状/);
  assert.doesNotMatch(html, /<canvas/i);
  assert.match(source, /staticToggle\.addEventListener\("click"/);
  assert.match(source, /reducedMotion \|\| staticViewport/);
  assert.doesNotMatch(`${html}\n${source}`, /sticker|InstancedMesh|fluid|EffectComposer/i);
  assert.match(styles, /--background: #070d55/);
  assert.match(styles, /--center: #111d86/);
  assert.match(styles, /--grid: rgba\(157, 171, 255, 0\.2\)/);
  assert.match(styles, /\.m1-intro-identity[\s\S]*left: 64px;[\s\S]*width: 296px/);
  assert.match(styles, /\.m1-intro-role[\s\S]*left: 452px;[\s\S]*width: 308px/);
  assert.match(styles, /\.m1-intro-focus[\s\S]*left: 840px;[\s\S]*width: 360px/);
  assert.match(styles, /font-size: 30px;[\s\S]*line-height: 36px/);
  assert.match(styles, /font-size: 17px;[\s\S]*line-height: 24px/);
  assert.match(styles, /\.m1-manifesto[\s\S]*top: 57vh;[\s\S]*left: 64px;[\s\S]*z-index: 3/);
  assert.match(styles, /\.m1-grid-y-1 \{ top: 33\.3vh; \}/);
  assert.match(styles, /\.m1-grid-y-2 \{ top: 67\.6vh; \}/);
  assert.match(
    styles,
    /@media \(max-aspect-ratio: 7 \/ 5\) and \(min-height: 901px\)[\s\S]*top: 75vh;/,
  );
  assert.match(styles, /\.m1-poster,[\s\S]*\.m1-canvas-layer[\s\S]*z-index: 2/);
  assert.match(styles, /\.m1-canvas-layer canvas[\s\S]*pointer-events: none/);
});

test("uses the locked soft-gel material without outlines or a right-side stage", async () => {
  const source = await read("modules/model-3d/main.ts");
  assert.match(source, /new MeshPhysicalMaterial/);
  assert.match(source, /color: new Color\("#3439D1"\)/);
  assert.match(source, /transmission: 0\.64/);
  assert.match(source, /ior: 1\.45/);
  assert.match(source, /thickness: 0\.62/);
  assert.match(source, /roughness: 0\.24/);
  assert.match(source, /attenuationColor: new Color\("#232078"\)/);
  assert.match(source, /emissive: new Color\("#090D43"\)/);
  assert.match(source, /new RoomEnvironment/);
  assert.match(source, /new PMREMGenerator/);
  assert.match(source, /ACESFilmicToneMapping/);
  assert.match(source, /new RectAreaLight\(0xf7f8ff, 3\.2, 14, 3\.4\)/);
  assert.match(source, /REFERENCE_ASPECT = 1280 \/ 720/);
  assert.match(source, /BASE_MODEL_SCALE = 0\.86/);
  assert.match(source, /MIN_ASPECT_FIT = 0\.28/);
  assert.match(source, /MODEL_CENTER_Y_RATIO = 0\.5/);
  assert.match(source, /window\.innerHeight \* MODEL_CENTER_Y_RATIO/);
  assert.match(source, /camera\.aspect \/ REFERENCE_ASPECT/);
  assert.match(source, /modelRoot\.scale\.setScalar\(scale\)/);
  assert.match(source, /const fitModelToViewport = \(\): void =>/);
  assert.match(
    source,
    /camera\.updateProjectionMatrix\(\);\s+fitModelToViewport\(\);/,
  );
  assert.doesNotMatch(source, /EdgesGeometry|LineSegments|LineBasicMaterial/);
  assert.doesNotMatch(source, /createScreenSpaceRefractionMaterial|spectral-rim|continuous-rim/);
  assert.doesNotMatch(source, /refractive-grid-backdrop|bandA|bandB/);
  assert.match(source, /webglcontextlost/);
  assert.match(source, /SCROLL_RANGE_PX = 360/);
  for (const field of [
    "ready",
    "mode",
    "modelName",
    "meshNames",
    "materialType",
    "drawCalls",
    "triangles",
    "parallax",
    "scrollRotation",
    "contextLossHook",
  ]) {
    assert.match(source, new RegExp(field));
  }
});

test("gates context recovery and makes failed startup cleanly retryable", async () => {
  const source = await read("modules/model-3d/main.ts");
  assert.match(
    source,
    /const startLoop = \(\): void => \{\s+if \(running \|\| staticReading \|\| !contextAvailable\) return;/,
  );
  assert.match(
    source,
    /if \(!enabled && !contextAvailable\) \{\s+stopLoop\(\);\s+staticReading = true;/,
  );
  assert.match(
    source,
    /onContextRestored = \(\) => \{\s+stopLoop\(\);\s+contextAvailable = true;\s+staticReading = true;/,
  );
  assert.match(source, /finally \{\s+startPromise = null;/);
  assert.match(source, /const cleanupRuntime = \(\): void => \{/);
  assert.match(source, /environmentTarget\?\.dispose\(\)/);
  assert.match(source, /renderer\?\.dispose\(\)/);
  assert.match(source, /renderer\?\.domElement\.remove\(\)/);
  assert.match(source, /canvasLayer\.querySelectorAll\("canvas"\)/);

  let contextAvailable = true;
  let staticReading = false;
  let running = false;
  let rafStarts = 0;
  const stopLoop = () => {
    running = false;
  };
  const startLoop = () => {
    if (running || staticReading || !contextAvailable) return;
    running = true;
    rafStarts += 1;
  };
  contextAvailable = false;
  stopLoop();
  staticReading = true;
  startLoop();
  assert.equal(running, false);
  assert.equal(rafStarts, 0);
  stopLoop();
  contextAvailable = true;
  staticReading = true;
  assert.equal(running, false);
  staticReading = false;
  startLoop();
  assert.equal(running, true);
  assert.equal(rafStarts, 1);
});

test("ships one continuous cursive tube mesh without internal open ends", async () => {
  const glb = await readFile(path.join(root, "public/models/ocean-wordmark.glb"));
  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(glb.readUInt32LE(4), 2);
  const jsonLength = glb.readUInt32LE(12);
  assert.equal(glb.readUInt32LE(16), 0x4e4f534a);
  const document = JSON.parse(glb.subarray(20, 20 + jsonLength).toString("utf8").trim());
  assert.deepEqual(
    document.nodes.map((node) => node.name),
    ["OCEAN"],
  );
  assert.equal(document.asset.extras.word, "ocean");
  assert.equal(document.asset.extras.geometryType, "single-continuous-cursive-centerline-tube");
  assert.equal(document.asset.extras.meshName, "OCEAN");
  assert.equal(document.asset.extras.tubeDiameterPixels, 60);
  assert.equal(document.asset.extras.depthPixels, 70);
  assert.deepEqual(document.asset.extras.targetBounds, [270, 190, 1135, 510]);
  assert.equal(document.materials, undefined);
  assert.equal(document.images, undefined);
  assert.equal(document.animations, undefined);

  let triangles = 0;
  assert.equal(document.meshes.length, 1);
  for (const mesh of document.meshes) {
    const positionAccessorIndex = mesh.primitives[0].attributes.POSITION;
    const accessor = document.accessors[positionAccessorIndex];
    triangles += accessor.count / 3;
    const depthPixels = (accessor.max[2] - accessor.min[2]) * 100;
    assert.ok(depthPixels >= 58, `${mesh.name} lacks tube depth: ${depthPixels}`);
    assert.ok(depthPixels <= 95, `${mesh.name} exceeds depth target: ${depthPixels}`);
  }
  assert.ok(triangles >= 12_000, `tube geometry is unexpectedly sparse: ${triangles}`);
  assert.ok(triangles <= 80_000, `triangle budget exceeded: ${triangles}`);
  assert.ok(gzipSync(glb, { level: 9 }).length <= 500 * 1024, "GLB gzip budget exceeded");
});

test("generates a transparent poster from the same connected centerlines", async () => {
  const [avif, webp, generator] = await Promise.all([
    stat(path.join(root, "public/posters/model-3d-default.avif")),
    stat(path.join(root, "public/posters/model-3d-default.webp")),
    read("scripts/generate-model-3d.mjs"),
  ]);
  assert.ok(avif.size <= 180_000, `AVIF exceeds budget: ${avif.size}`);
  assert.ok(webp.size <= 260_000, `WebP exceeds budget: ${webp.size}`);
  assert.match(generator, /new CatmullRomCurve3/);
  assert.match(generator, /new TubeGeometry/);
  assert.match(generator, /new TubeGeometry\(wordCurve, 520/);
  assert.doesNotMatch(generator, /letterGroups|CurveSlice|capStart|capEnd/);
  assert.match(generator, /tubeDiameterPixels = 60/);
  assert.match(generator, /tubeDiameterPixels \+ 14/);
  assert.match(generator, /posterVerticalOffset = 33/);
  assert.match(generator, /stroke-opacity="\.28" stroke-width="8"/);
  assert.match(generator, /id="highlight-mask"/);
  assert.match(generator, /id="soft-highlight"/);
  assert.doesNotMatch(generator, /stroke-dasharray/);
  assert.match(generator, /ensureAlpha\(\)/);
  assert.doesNotMatch(generator, /TextGeometry|FontLoader|helvetiker/);
  assert.doesNotMatch(generator, /<text[^>]*>ocean/i);
  for (const color of ["#3439D1", "#232078", "#090D43", "#F7F8FF"]) {
    assert.match(generator, new RegExp(color, "i"));
  }
});
