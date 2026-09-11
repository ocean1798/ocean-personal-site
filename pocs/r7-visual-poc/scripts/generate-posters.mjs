import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "public", "posters");
const RAW_SAMPLES = 512;

function loosePoint(t) {
  return {
    x:
      1.08 * Math.cos(1.84 * Math.PI * t + 0.55) +
      0.24 * Math.sin(5 * Math.PI * t),
    y:
      0.92 * Math.sin(1.84 * Math.PI * t + 0.55) +
      0.3 * Math.sin(3 * Math.PI * t + 0.35),
  };
}

function formedPoint(t) {
  const u = 2 * Math.PI * (0.92 * t + 0.04);
  return { x: 1.06 * Math.cos(u), y: 1.28 * Math.sin(u) };
}

function resample(pointAt, segments) {
  const source = Array.from({ length: RAW_SAMPLES + 1 }, (_, index) =>
    pointAt(index / RAW_SAMPLES),
  );
  const cumulative = [0];
  for (let index = 1; index < source.length; index += 1) {
    cumulative[index] =
      cumulative[index - 1] +
      Math.hypot(
        source[index].x - source[index - 1].x,
        source[index].y - source[index - 1].y,
      );
  }
  const total = cumulative.at(-1);
  return Array.from({ length: segments + 1 }, (_, index) => {
    const target = (index / segments) * total;
    let high = cumulative.findIndex((distance) => distance >= target);
    high = high <= 0 ? 1 : high;
    const low = high - 1;
    const alpha =
      (target - cumulative[low]) /
      (cumulative[high] - cumulative[low] || 1);
    return {
      x: source[low].x + (source[high].x - source[low].x) * alpha,
      y: source[low].y + (source[high].y - source[low].y) * alpha,
    };
  });
}

function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function loopPoints(morph, segments = 128) {
  const loose = resample(loosePoint, segments);
  const formed = resample(formedPoint, segments);
  const mix = smoothstep(morph);
  return loose.map((point, index) => ({
    x: point.x + (formed[index].x - point.x) * mix,
    y: point.y + (formed[index].y - point.y) * mix,
  }));
}

function offsetPoints(points, amount) {
  return points.map((point, index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(points.length - 1, index + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: point.x - (dy / length) * amount, y: point.y + (dx / length) * amount };
  });
}

function pathData(points, center, scale) {
  return points
    .map((point, index) => {
      const x = center.x + point.x * scale;
      const y = center.y - point.y * scale;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function makePosterSvg({ width, height, morph, center, scale }) {
  const points = loopPoints(morph);
  const copperA = offsetPoints(points, -0.07);
  const copperB = offsetPoints(points, 0.07);
  const viaTs = [0.18, 0.44, 0.7];
  const viaMarkup = viaTs
    .flatMap((t) => {
      const index = Math.round(t * (points.length - 1));
      return [copperA[index], copperB[index]];
    })
    .map(
      (point) =>
        `<circle cx="${(center.x + point.x * scale).toFixed(2)}" cy="${(
          center.y -
          point.y * scale
        ).toFixed(2)}" r="${Math.max(4, scale * 0.035).toFixed(
          2,
        )}" fill="#071412" stroke="#FF7A3D" stroke-width="${Math.max(
          2,
          scale * 0.012,
        ).toFixed(2)}"/>`,
    )
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="glow" cx="72%" cy="46%" r="42%">
          <stop offset="0" stop-color="#1B6558" stop-opacity="0.42"/>
          <stop offset="0.58" stop-color="#0B1D19" stop-opacity="0.2"/>
          <stop offset="1" stop-color="#071412" stop-opacity="0"/>
        </radialGradient>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="18"/>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="#071412"/>
      <rect width="${width}" height="${height}" fill="url(#glow)"/>
      <path d="${pathData(points, center, scale)}" fill="none" stroke="#2B8B78" stroke-opacity="0.24" stroke-width="${(
        scale * 0.43
      ).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft)"/>
      <path d="${pathData(points, center, scale)}" fill="none" stroke="#0C3A34" stroke-opacity="0.92" stroke-width="${(
        scale * 0.34
      ).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${pathData(copperA, center, scale)}" fill="none" stroke="#FF7A3D" stroke-width="${Math.max(
        3,
        scale * 0.026,
      ).toFixed(2)}" stroke-linecap="round"/>
      <path d="${pathData(copperB, center, scale)}" fill="none" stroke="#FF7A3D" stroke-width="${Math.max(
        3,
        scale * 0.026,
      ).toFixed(2)}" stroke-linecap="round"/>
      ${viaMarkup}
    </svg>`;
}

async function writePoster(name, config) {
  const source = Buffer.from(makePosterSvg(config));
  const avifPath = path.join(outputDirectory, `${name}.avif`);
  const webpPath = path.join(outputDirectory, `${name}.webp`);
  const [avifOutput, webpOutput] = await Promise.all([
    sharp(source).avif({ quality: 58, effort: 5 }).toBuffer(),
    sharp(source).webp({ quality: 76, effort: 5 }).toBuffer(),
  ]);
  await Promise.all([
    writeIfChanged(avifPath, avifOutput),
    writeIfChanged(webpPath, webpOutput),
  ]);
  const [avif, webp] = await Promise.all([stat(avifPath), stat(webpPath)]);
  return { name, avifBytes: avif.size, webpBytes: webp.size };
}

async function writeIfChanged(filePath, output) {
  try {
    const current = await readFile(filePath);
    if (current.equals(output)) return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(filePath, output);
}

await mkdir(outputDirectory, { recursive: true });
const results = await Promise.all([
  writePoster("desktop-initial", {
    width: 1440,
    height: 900,
    morph: 0.56,
    center: { x: 1000, y: 443 },
    scale: 235,
  }),
  writePoster("desktop-formed", {
    width: 1440,
    height: 900,
    morph: 1,
    center: { x: 1000, y: 438 },
    scale: 226,
  }),
  writePoster("mobile-static", {
    width: 390,
    height: 844,
    morph: 1,
    center: { x: 202, y: 558 },
    scale: 86,
  }),
]);

for (const result of results) {
  console.log(
    `${result.name}: AVIF=${result.avifBytes} bytes WEBP=${result.webpBytes} bytes`,
  );
}
