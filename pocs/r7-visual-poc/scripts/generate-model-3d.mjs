import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import sharp from "sharp";
import { Box3, CatmullRomCurve3, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const root = process.cwd();
const modelDirectory = path.join(root, "public", "models");
const posterDirectory = path.join(root, "public", "posters");
const modelPath = path.join(modelDirectory, "ocean-wordmark.glb");
const meshName = "OCEAN";
const pixelsPerUnit = 100;
const designCenter = { x: 702.5, y: 350 };
const tubeDiameterPixels = 60;
const tubeRadius = tubeDiameterPixels / pixelsPerUnit / 2;
const radialSegments = 20;
const posterVerticalOffset = 33;

await mkdir(modelDirectory, { recursive: true });
await mkdir(posterDirectory, { recursive: true });

const designPoint = (x, y, z = 0) => ({ x, y, z });

const wordDesignPoints = [
  designPoint(302, 390, -2),
  designPoint(330, 405, -1),
  designPoint(370, 410, 0),
  designPoint(410, 398, 1),
  designPoint(438, 375, 2),
  designPoint(452, 350, 3),
  designPoint(460, 320, 4),
  designPoint(460, 286, 5),
  designPoint(450, 256, 5),
  designPoint(430, 234, 4),
  designPoint(404, 224, 3),
  designPoint(378, 234, 2),
  designPoint(356, 258, 1),
  designPoint(344, 290, 0),
  designPoint(342, 324, -1),
  designPoint(350, 354, -1),
  designPoint(370, 382, 0),
  designPoint(396, 394, 1),
  designPoint(422, 384, 2),
  designPoint(440, 364, 3),
  designPoint(452, 350, 3),
  designPoint(472, 352, 2),
  designPoint(504, 352, 2),
  designPoint(538, 345, 2),
  designPoint(548, 312, 2),
  designPoint(570, 282, 3),
  designPoint(600, 266, 4),
  designPoint(628, 274, 4),
  designPoint(646, 280, 3),
  designPoint(624, 290, 3),
  designPoint(596, 292, 2),
  designPoint(570, 304, 1),
  designPoint(552, 326, 0),
  designPoint(546, 352, -1),
  designPoint(554, 378, -1),
  designPoint(576, 398, 0),
  designPoint(604, 404, 1),
  designPoint(630, 390, 1),
  designPoint(650, 382, 1),
  designPoint(668, 368, 0),
  designPoint(682, 350, 0),
  designPoint(714, 350, -1),
  designPoint(754, 350, -2),
  designPoint(794, 344, -3),
  designPoint(820, 326, -4),
  designPoint(830, 302, -4),
  designPoint(822, 278, -3),
  designPoint(800, 260, -2),
  designPoint(772, 256, -1),
  designPoint(744, 264, 0),
  designPoint(716, 282, 1),
  designPoint(696, 306, 2),
  designPoint(690, 334, 3),
  designPoint(698, 362, 3),
  designPoint(720, 386, 2),
  designPoint(750, 400, 1),
  designPoint(782, 402, 0),
  designPoint(810, 390, -1),
  designPoint(832, 370, -1),
  designPoint(850, 358, 0),
  designPoint(874, 350, 1),
  designPoint(882, 374, 1),
  designPoint(874, 350, 2),
  designPoint(874, 320, 3),
  designPoint(882, 290, 4),
  designPoint(898, 268, 4),
  designPoint(920, 258, 3),
  designPoint(942, 264, 2),
  designPoint(960, 284, 1),
  designPoint(968, 310, 0),
  designPoint(966, 338, -1),
  designPoint(956, 364, -2),
  designPoint(940, 384, -2),
  designPoint(918, 396, -1),
  designPoint(896, 392, 0),
  designPoint(882, 374, 1),
  designPoint(900, 382, 2),
  designPoint(924, 382, 2),
  designPoint(946, 372, 1),
  designPoint(960, 350, 0),
  designPoint(966, 320, 0),
  designPoint(970, 286, 1),
  designPoint(972, 258, 2),
  designPoint(974, 306, 2),
  designPoint(976, 350, 1),
  designPoint(984, 370, 1),
  designPoint(992, 374, 1),
  designPoint(1000, 350, 2),
  designPoint(1004, 316, 3),
  designPoint(1006, 278, 4),
  designPoint(1008, 250, 5),
  designPoint(1012, 302, 5),
  designPoint(1014, 366, 4),
  designPoint(1022, 346, 3),
  designPoint(1036, 316, 2),
  designPoint(1054, 292, 1),
  designPoint(1074, 288, 0),
  designPoint(1090, 304, -1),
  designPoint(1098, 330, -1),
  designPoint(1100, 362, 0),
  designPoint(1101, 394, 1),
  designPoint(1103, 430, 2),
];

const designToModel = (source) =>
  new Vector3(
    (source.x - designCenter.x) / pixelsPerUnit,
    (designCenter.y - source.y) / pixelsPerUnit,
    source.z / pixelsPerUnit,
  );

const wordCurve = new CatmullRomCurve3(
  wordDesignPoints.map(designToModel),
  false,
  "centripetal",
  0.5,
);
const tube = new TubeGeometry(wordCurve, 520, tubeRadius, radialSegments, false);
const start = wordCurve.getPoint(0);
const end = wordCurve.getPoint(1);
const merged = mergeGeometries(
  [
    tube,
    new SphereGeometry(tubeRadius, radialSegments, 14).translate(start.x, start.y, start.z),
    new SphereGeometry(tubeRadius, radialSegments, 14).translate(end.x, end.y, end.z),
  ],
  false,
);
if (!merged) throw new Error("Unable to merge the continuous Ocean wordmark");
merged.deleteAttribute("uv");
merged.computeVertexNormals();
const geometry = merged.index ? merged.toNonIndexed() : merged;
geometry.computeBoundingBox();
const geometries = [geometry];

const binaryParts = [];
const bufferViews = [];
const accessors = [];
const meshes = [];
const nodes = [];
let binaryOffset = 0;
let triangleCount = 0;

function appendFloatAttribute(attribute, includeBounds) {
  const values = new Float32Array(attribute.array);
  const bytes = Buffer.from(values.buffer, values.byteOffset, values.byteLength);
  const padding = (4 - (bytes.length % 4)) % 4;
  const viewIndex = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: binaryOffset, byteLength: bytes.length, target: 34962 });
  binaryParts.push(bytes, Buffer.alloc(padding));
  binaryOffset += bytes.length + padding;

  const accessor = {
    bufferView: viewIndex,
    componentType: 5126,
    count: attribute.count,
    type: "VEC3",
  };
  if (includeBounds) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let index = 0; index < attribute.count; index += 1) {
      for (let component = 0; component < 3; component += 1) {
        const value = attribute.getComponent(index, component);
        min[component] = Math.min(min[component], value);
        max[component] = Math.max(max[component], value);
      }
    }
    accessor.min = min;
    accessor.max = max;
  }
  accessors.push(accessor);
  return accessors.length - 1;
}

for (let index = 0; index < geometries.length; index += 1) {
  const geometry = geometries[index];
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  if (!position || !normal) throw new Error(`Missing geometry attributes for ${meshName}`);
  triangleCount += position.count / 3;
  const positionAccessor = appendFloatAttribute(position, true);
  const normalAccessor = appendFloatAttribute(normal, false);
  meshes.push({
    name: meshName,
    primitives: [{ attributes: { POSITION: positionAccessor, NORMAL: normalAccessor }, mode: 4 }],
  });
  nodes.push({ name: meshName, mesh: index });
}

const binaryChunk = Buffer.concat(binaryParts);
const gltf = {
  asset: {
    version: "2.0",
    generator: "Ocean R7 M1 original single-curve cursive tube generator",
    extras: {
      word: "ocean",
      geometryType: "single-continuous-cursive-centerline-tube",
      tubeDiameterPixels,
      depthPixels: 70,
      targetBounds: [270, 190, 1135, 510],
      meshName,
    },
  },
  scene: 0,
  scenes: [{ name: "ocean", nodes: nodes.map((_, index) => index) }],
  nodes,
  meshes,
  accessors,
  bufferViews,
  buffers: [{ byteLength: binaryChunk.length }],
};

const json = Buffer.from(JSON.stringify(gltf), "utf8");
const jsonPadding = (4 - (json.length % 4)) % 4;
const paddedJson = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]);
const binaryPadding = (4 - (binaryChunk.length % 4)) % 4;
const paddedBinary = Buffer.concat([binaryChunk, Buffer.alloc(binaryPadding)]);
const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(totalLength, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(paddedJson.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(paddedBinary.length, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
const glb = Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);

if (triangleCount > 80_000) throw new Error(`Triangle budget exceeded: ${triangleCount}`);
if (gzipSync(glb, { level: 9 }).length > 500 * 1024) throw new Error("GLB gzip budget exceeded");
await writeFile(modelPath, glb);

const sampledDesignPoints = wordCurve.getPoints(840).map((source) => ({
  x: source.x * pixelsPerUnit + designCenter.x,
  y: designCenter.y - source.y * pixelsPerUnit,
}));
const posterPaths = [
  sampledDesignPoints
    .map(
      (source, index) =>
        `${index === 0 ? "M" : "L"}${source.x.toFixed(1)} ${source.y.toFixed(1)}`,
    )
    .join(" "),
];
const renderPosterPaths = (attributes) =>
  posterPaths.map((posterPath) => `<path d="${posterPath}" ${attributes}/>`).join("\n");

const posterSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gel" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#5B64DF"/><stop offset=".2" stop-color="#3439D1"/>
        <stop offset=".62" stop-color="#232078"/><stop offset="1" stop-color="#3439D1"/>
      </linearGradient>
      <linearGradient id="highlight-fade" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="black"/><stop offset=".3" stop-color="black"/>
        <stop offset=".38" stop-color="white"/><stop offset=".48" stop-color="white"/>
        <stop offset=".62" stop-color="black"/><stop offset="1" stop-color="black"/>
      </linearGradient>
      <mask id="highlight-mask"><rect width="1280" height="720" fill="url(#highlight-fade)"/></mask>
      <filter id="soft-shadow" x="-20%" y="-30%" width="150%" height="180%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
      <filter id="soft-highlight" x="-10%" y="-20%" width="120%" height="140%">
        <feGaussianBlur stdDeviation="1.4"/>
      </filter>
    </defs>
    ${renderPosterPaths(`fill="none" stroke="#090D43" stroke-opacity=".48" stroke-width="${tubeDiameterPixels + 14}" stroke-linecap="round" stroke-linejoin="round" transform="translate(9 ${posterVerticalOffset + 14})" filter="url(#soft-shadow)"`)}
    ${renderPosterPaths(`fill="none" stroke="url(#gel)" stroke-width="${tubeDiameterPixels}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 ${posterVerticalOffset})"`)}
    ${renderPosterPaths(`fill="none" stroke="#F7F8FF" stroke-opacity=".28" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="translate(-6 ${posterVerticalOffset - 7})" mask="url(#highlight-mask)" filter="url(#soft-highlight)"`)}
  </svg>`;
const poster = sharp(Buffer.from(posterSvg)).resize(1280, 720).ensureAlpha().toColorspace("srgb");
await Promise.all([
  poster.clone().avif({ quality: 68, effort: 6 }).toFile(path.join(posterDirectory, "model-3d-default.avif")),
  poster.clone().webp({ quality: 82, effort: 6 }).toFile(path.join(posterDirectory, "model-3d-default.webp")),
]);

const wordBounds = geometries.reduce((combined, geometry) => {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  return combined.union(geometry.boundingBox);
}, new Box3());

console.log(
  JSON.stringify({
    model: path.relative(root, modelPath),
    word: "ocean",
    meshNames: [meshName],
    tubeDiameterPixels,
    triangles: triangleCount,
    glbBytes: glb.length,
    glbGzipBytes: gzipSync(glb, { level: 9 }).length,
    modelBounds: {
      width: Number((wordBounds.max.x - wordBounds.min.x).toFixed(3)),
      height: Number((wordBounds.max.y - wordBounds.min.y).toFixed(3)),
      depth: Number((wordBounds.max.z - wordBounds.min.z).toFixed(3)),
    },
  }),
);
