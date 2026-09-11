import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const targets = ["main", "three", "r3f", "lenis", "postprocessing"];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const report = {
  generatedAt: new Date().toISOString(),
  metric: "gzipSync level 9 over emitted JS and CSS",
  webglBudgetBytes: 400 * 1024,
  targets: {},
};

for (const target of targets) {
  const directory = path.join(dist, target);
  const emitted = (await walk(directory)).filter((file) => /\.(?:js|css)$/.test(file));
  const files = [];
  let totalGzipBytes = 0;
  for (const file of emitted) {
    const contents = await readFile(file);
    const gzipBytes = gzipSync(contents, { level: 9 }).byteLength;
    totalGzipBytes += gzipBytes;
    files.push({
      file: path.relative(directory, file).replaceAll("\\", "/"),
      rawBytes: contents.byteLength,
      gzipBytes,
    });
  }
  report.targets[target] = {
    files,
    totalGzipBytes,
    totalGzipKiB: Number((totalGzipBytes / 1024).toFixed(2)),
  };
}

const mainFiles = report.targets.main.files;
const enhancementFiles = mainFiles.filter(
  ({ file }) => file.includes("ocean-scene") || file.includes("three"),
);
report.mainEnhancement = {
  files: enhancementFiles,
  totalGzipBytes: enhancementFiles.reduce((sum, file) => sum + file.gzipBytes, 0),
};
report.mainEnhancement.withinBudget =
  report.mainEnhancement.totalGzipBytes <= report.webglBudgetBytes;

const outputDirectory = path.join(root, "evidence", "generated");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, "bundle-sizes.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
