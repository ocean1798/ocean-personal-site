import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const basePath = "/ocean-personal-site";
const outputDirectory = new URL("../out/", import.meta.url);
const routes = [
  ["home", new URL("../out/index.html", import.meta.url)],
  ["work", new URL("../out/work/index.html", import.meta.url)],
  ["about", new URL("../out/about/index.html", import.meta.url)],
  [
    "photography",
    new URL("../out/photography/index.html", import.meta.url),
  ],
];

async function assertLocalReferencesResolve(html, pageName) {
  const directReferences = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const responsiveReferences = [
    ...html.matchAll(/src[Ss]et="([^"]+)"/g),
  ].flatMap((match) =>
    match[1].split(",").map((candidate) => candidate.trim().split(/\s+/, 1)[0]),
  );
  const references = [...directReferences, ...responsiveReferences];
  let localReferenceCount = 0;

  for (const reference of references) {
    if (
      reference.startsWith("#") ||
      reference.startsWith("//") ||
      /^[a-z][a-z\d+.-]*:/i.test(reference)
    ) {
      continue;
    }

    if (!reference.startsWith("/")) {
      continue;
    }

    localReferenceCount += 1;
    assert.ok(
      reference.startsWith(`${basePath}/`),
      `${pageName}: ${reference} should include the repository base path`,
    );

    const pathWithoutBase = reference
      .slice(basePath.length + 1)
      .split(/[?#]/, 1)[0];
    const exportedPath = pathWithoutBase.endsWith("/")
      ? `${pathWithoutBase}index.html`
      : pathWithoutBase || "index.html";

    await assert.doesNotReject(
      access(new URL(exportedPath, outputDirectory)),
      `${pageName}: ${reference} should resolve to an exported file`,
    );
  }

  assert.ok(localReferenceCount > 0, `${pageName} should contain local assets`);
}

test("exports every public route for directory-based GitHub Pages URLs", async () => {
  for (const [name, route] of routes) {
    await assert.doesNotReject(access(route), `${name} route should be exported`);
  }
});

test("prefixes framework assets, links, and public images with the repository path", async () => {
  const pages = await Promise.all(
    routes.map(([, route]) => readFile(route, "utf8")),
  );

  for (const [index, html] of pages.entries()) {
    assert.match(html, new RegExp(`${basePath}/_next/`));
    assert.doesNotMatch(html, /(?:src|href)="\/_next\//);
    assert.doesNotMatch(html, /(?:src|href)="\/images\//);
    await assertLocalReferencesResolve(html, routes[index][0]);
  }

  const home = pages[0];
  assert.match(home, new RegExp(`href="${basePath}/"`));
  assert.match(home, new RegExp(`href="${basePath}/work/"`));
  assert.match(home, new RegExp(`href="${basePath}/about/"`));
  assert.match(home, new RegExp(`href="${basePath}/photography/"`));
  assert.match(home, new RegExp(`src="${basePath}/images/plugins/diff-pair-radar.png"`));
  assert.match(home, new RegExp(`src="${basePath}/images/music/28828076.jpg"`));
  assert.doesNotMatch(home, /__pcb/);
});

test("rejects root-relative references that omit the repository base path", async () => {
  await assert.rejects(
    assertLocalReferencesResolve(
      '<a href="/about/">About</a><source srcset="/photo.webp 1x"><img src="/favicon.svg">',
      "invalid fixture",
    ),
    /should include the repository base path/,
  );
});

test("exports the framework asset directory used by the HTML", async () => {
  const nextDirectory = new URL("../out/_next/", import.meta.url);
  const nextFiles = await readdir(nextDirectory, { recursive: true });

  assert.ok(
    nextFiles.some((name) => name.endsWith(".js")),
    "Next.js client JavaScript should be exported",
  );
  assert.ok(
    nextFiles.some((name) => name.endsWith(".css")),
    "Next.js styles should be exported",
  );
});

test("exports the PCB board data and bakes the base path into the client loader", async () => {
  for (const name of ["board-x86.json.gz", "board-x86.json", "LICENSE", "README.md"]) {
    await assert.doesNotReject(access(new URL(`pcb-data/${name}`, outputDirectory)), `missing pcb-data/${name}`);
  }
  const chunksDirectory = new URL("../out/_next/static/chunks/", import.meta.url);
  const chunkNames = await readdir(chunksDirectory, { recursive: true });
  const js = (
    await Promise.all(chunkNames.filter((n) => n.endsWith(".js")).map((n) => readFile(new URL(n, chunksDirectory), "utf8")))
  ).join("\n");
  assert.match(js, /\/ocean-personal-site\/pcb-data/);
  assert.doesNotMatch(js, /__pcb/);
});
