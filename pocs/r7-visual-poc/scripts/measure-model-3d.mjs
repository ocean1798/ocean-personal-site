import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const moduleRoot = path.join(root, "modules", "model-3d");
const distRoot = path.join(moduleRoot, "dist");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

const modelPath = path.join(root, "public", "models", "ocean-wordmark.glb");
const avifPath = path.join(root, "public", "posters", "model-3d-default.avif");
const webpPath = path.join(root, "public", "posters", "model-3d-default.webp");
const model = await readFile(modelPath);
const emitted = await walk(distRoot);
const dynamicAssets = [];
let codeGzipBytes = 0;

for (const file of emitted) {
  const relative = path.relative(moduleRoot, file).replaceAll("\\", "/");
  const bytes = await readFile(file);
  const gzipBytes = gzipSync(bytes, { level: 9 }).length;
  if (/\.(?:js|css)$/i.test(file)) codeGzipBytes += gzipBytes;
  if (/\.(?:js|css|glb|avif|webp)$/i.test(file)) {
    dynamicAssets.push({ path: relative, bytes: bytes.length, gzipBytes });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  model: {
    bytes: model.length,
    gzipBytes: gzipSync(model, { level: 9 }).length,
  },
  posters: {
    avifBytes: (await stat(avifPath)).size,
    webpBytes: (await stat(webpPath)).size,
  },
  codeGzipBytes,
  dynamicAssets,
};

const evidenceDirectory = path.join(moduleRoot, "evidence");
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(
  path.join(evidenceDirectory, "model-3d-sizes.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report));
