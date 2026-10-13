import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

async function render(pathname) {
  const response = await worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200, `${pathname} should render successfully`);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
    `${pathname} should return HTML`,
  );

  return response.text();
}

function getToolSegments(html, pathname) {
  const diffPairStart = html.indexOf('data-tool="diff-pair"');
  const fpcStart = html.indexOf('data-tool="fpc-workshop"');

  assert.notEqual(diffPairStart, -1, `${pathname} should include diff-pair`);
  assert.notEqual(fpcStart, -1, `${pathname} should include fpc-workshop`);
  assert.ok(diffPairStart < fpcStart, `${pathname} should keep tool order`);

  const diffPairEnd = html.indexOf("</article>", diffPairStart);
  const fpcEnd = html.indexOf("</article>", fpcStart);

  return {
    diffPair: html.slice(diffPairStart, diffPairEnd),
    fpc: html.slice(fpcStart, fpcEnd),
  };
}

function readJpegDimensions(buffer) {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += 2 + length;
  }

  throw new Error("JPEG dimensions not found");
}

function assertPluginEvidenceContract(html, pathname) {
  const { diffPair, fpc } = getToolSegments(html, pathname);
  const requiredLabels = [
    "解决什么问题",
    "Ocean 做了什么",
    "公开证据",
    "不能推出什么结论",
  ];

  for (const label of requiredLabels) {
    assert.match(diffPair, new RegExp(label));
    assert.match(fpc, new RegExp(label));
  }

  assert.match(diffPair, /Trae/);
  assert.match(diffPair, /没有手写一行代码/);
  assert.match(diffPair, /AI/);
  assert.doesNotMatch(fpc, /Trae|没有手写一行代码|\bAI\b/);
}

const HOME_SECTIONS = [
  ["work", "01 · 本职工作"],
  ["plugins", "02 · 个人插件"],
  ["more", "03 · 其它项目"],
  ["tools", "04 · 最近在用"],
  ["music", "05 · 音乐"],
  ["photo", "06 · 摄影"],
  ["contact", "07 · 联系"],
];

test("renders the PCB hero with the fixed headline and board attribution", async () => {
  const html = await render("/");

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /class="pcb"/);
  assert.match(html, /<canvas id="pcb"/);
  assert.match(html, /aria-label="让噪声化为秩序，让想法长出形状。"/);
  assert.match(html, /Ocean · 产品经理/);
  assert.match(html, /嘉立创 EDA 专业版产品经理，做 PCB 功能。/);
  assert.match(html, /https:\/\/oshwhub\.com\/oshwhub\/dian-nao-zhu-ban/);
  assert.match(html, /GPL-3\.0/);
  assert.doesNotMatch(html, /__pcb/);
});

test("renders every home section in order with matching nav anchors", async () => {
  const html = await render("/");
  let last = -1;

  for (const [id, label] of HOME_SECTIONS) {
    const at = html.indexOf(`id="${id}"`);
    assert.ok(at > last, `${id} should follow the previous section`);
    assert.ok(html.includes(label), `missing section label ${label}`);
    assert.ok(html.includes(`href="#${id}"`) || id === "photo", `nav should link #${id}`);
    last = at;
  }

  const navStart = html.indexOf('class="pcb-nav"');
  const nav = html.slice(navStart, html.indexOf("</nav>", navStart));
  for (const route of ["/work/", "/about/", "/photography/"]) {
    assert.ok(nav.includes(`href="${route}"`), `nav should link ${route}`);
  }
});

test("lists the three plugins with store links and an honest AI role", async () => {
  const html = await render("/");
  const { diffPair, fpc } = getToolSegments(html, "/");

  assert.match(html, /把一个具体的麻烦拿掉。/);
  assert.match(diffPair, /https:\/\/jlc-ext\.com\/item\/oshwhub\/diff-pair-assistant/);
  assert.match(diffPair, /不用再一对一对加差分对。/);
  assert.match(diffPair, /代码由 Trae 生成/);
  assert.match(fpc, /https:\/\/jlc-ext\.com\/item\/oshwhub\/fpc-workshop/);
  assert.match(fpc, /补强厚度不用再手算。/);
  assert.match(html, /data-tool="file-viewer"/);
  assert.match(html, /https:\/\/jlc-ext\.com\/item\/zero1798\/eda-file-viewer/);
  assert.equal((html.match(/class="role">我：定义与验收 · AI：实现/g) ?? []).length, 3);
  assert.match(html, /与公司无关/);
  assert.doesNotMatch(html, /stars?\b|★/i);
});

test("shows the real playlist tracks and the tools in use", async () => {
  const html = await render("/");

  assert.match(html, /href="https:\/\/music\.163\.com\/playlist\?id=12243639089"/);
  assert.match(html, /<canvas id="scope"/);
  assert.equal((html.match(/<li><a href="https:\/\/music\.163\.com\/song\?id=\d+"/g) ?? []).length, 8);
  for (const title of ["Where Is the Love", "知足", "夜的尽头"]) {
    assert.ok(html.includes(title), `missing track ${title}`);
  }
  for (const tool of ["Codex", "Pi Agent", "CPA Manager Plus", "Grok Bot"]) {
    assert.ok(html.includes(`<b>${tool}</b>`), `missing tool ${tool}`);
  }
  assert.match(html, /https:\/\/github\.com\/seakee\/CPA-Manager-Plus/);
});

test("uses the duck.com contact address everywhere", async () => {
  const pages = await Promise.all(["/", "/work", "/about", "/photography"].map(render));
  const sources = await Promise.all(
    ["../app/page.tsx", "../app/work/page.tsx", "../app/about/page.tsx", "../app/components/site-chrome.tsx", "../app/components/pcb/pcb-chrome.tsx"].map(
      (path) => readFile(new URL(path, import.meta.url), "utf8"),
    ),
  );

  for (const text of [...pages, ...sources]) {
    assert.doesNotMatch(text, /qq\.com|2711180012/);
  }
  assert.match(pages[0], /mailto:1798@duck\.com/);
});

test("ships the board data with its GPL-3.0 license and attribution", async () => {
  const [license, readme, runtime] = await Promise.all([
    readFile(new URL("../public/pcb-data/LICENSE", import.meta.url), "utf8"),
    readFile(new URL("../public/pcb-data/README.md", import.meta.url), "utf8"),
    readFile(new URL("../app/components/pcb-home-runtime.js", import.meta.url), "utf8"),
  ]);
  const names = await readdir(new URL("../public/pcb-data/", import.meta.url));

  assert.match(license, /GNU GENERAL PUBLIC LICENSE\s+Version 3/);
  assert.match(readme, /oshwhub\.com\/oshwhub\/dian-nao-zhu-ban/);
  assert.ok(names.includes("board-x86.json.gz"));
  assert.ok(names.includes("board-x86.json"));
  assert.doesNotMatch(runtime, /window\.__pcb|location\.search/);
});

test("keeps detailed plugin boundaries on work", async () => {
  const work = await render("/work");

  assert.match(work, /https:\/\/jlc-ext\.com\/item\/oshwhub\/diff-pair-assistant/);
  assert.match(work, /https:\/\/jlc-ext\.com\/item\/oshwhub\/fpc-workshop/);
  assert.doesNotMatch(work, /边界已验证|作者体验顺畅|生态成功|影响内部路线/);
  assertPluginEvidenceContract(work, "/work");
  assert.match(work, /个人插件 · 边界探索/);
});

test("renders the work route in the right evidence hierarchy", async () => {
  const html = await render("/work");

  assert.match(
    html,
    /<h1><span>我如何把复杂问题<\/span><span>变成可用产品<\/span><\/h1>/,
  );
  assert.match(html, /团队产品 · 主案例/);
  assert.match(html, /嘉立创 EDA 专业版/);
  assert.match(
    html,
    /嘉立创 EDA 专业版由团队共同完成；我负责其中部分 PCB/,
  );
  assert.match(html, /先看真实任务/);
  assert.match(html, /再整理复杂关系/);
  assert.match(html, /最后共同落地/);
  assert.match(html, /https:\/\/pro\.lceda\.cn\/editor/);
  assert.match(html, /https:\/\/prodocs\.lceda\.cn\/cn\//);
  assert.match(
    html,
    /计算结果用于前期辅助判断，最终以项目叠层、连接器要求和板厂工艺规范为准/,
  );
  assert.doesNotMatch(html, /下载量|评分|v\d+\.\d+/);
});

test("renders the about route as a point of view rather than a resume", async () => {
  const html = await render("/about");

  assert.match(html, /先弄懂一件事怎样运转/);
  assert.match(html, /测试：先找到事实/);
  assert.match(html, /研发：理解系统怎样工作/);
  assert.match(html, /产品：让不同视角走向同一个结果/);
  assert.match(html, /AI 与 Agent，不急着给答案/);
  assert.match(html, /https:\/\/pro\.lceda\.cn\/editor/);
  assert.match(html, /看我的摄影作品/);
  assert.match(html, /href="\/photography"/);
  assert.match(html, /mailto:1798@duck\.com/);
});

test("renders the photography route as twelve PCB-styled frames", async () => {
  const html = await render("/photography");
  const expectedCaptions = [
    "01 · 深圳美术馆", "02 · 深圳美术馆", "03 · 重庆", "04 · 楼宇间的白云",
    "05 · 海边", "06 · 天文台", "07 · 美人鱼拍摄取景地", "08 · 香港",
    "09 · 深圳", "10 · 深圳", "11 · 夕阳", "12 · 飞机上拍下的景象",
  ];

  assert.match(html, /<h1>我眼中的世界<\/h1>/);
  assert.match(html, /class="pcb pcb-plain"/);
  assert.equal((html.match(/class="ph" id="p\d\d"/g) ?? []).length, 12);
  for (const caption of expectedCaptions) {
    const [number, place] = caption.split(" · ");
    assert.ok(
      html.includes(`<span class="ph-ref">${number}<!-- --> · <!-- -->${place}</span>`) ||
        html.includes(`<span class="ph-ref">${number} · ${place}</span>`),
      `missing caption ${caption}`,
    );
  }
  assert.doesNotMatch(html, /鼠标悬停看原色/);
});

test("keeps all public pages free of job-seeking and preview signals", async () => {
  const pages = await Promise.all(["/", "/work", "/about", "/photography"].map(render));

  for (const html of pages) {
    assert.doesNotMatch(html, /codex-preview|_sites-preview/i);
    assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
    assert.doesNotMatch(html, /公开求职|正在求职|求职中|求职意向|下载简历|简历下载|接受机会/);
    assert.doesNotMatch(html, /react-loading-skeleton/);
  }
});

test("ships only sanitized responsive photography derivatives", async () => {
  const html = await render("/photography");
  const expectedNames = [
    "lines-red-installation",
    "lines-wire-sculpture",
    "lines-bridge-cables",
    "lines-window-grid",
    "sea-yellow-buoy",
    "sea-rock-waves",
    "sea-cliff",
    "sea-harbor-boat",
    "sky-rain-city",
    "sky-clouds-city",
    "sky-sunset",
    "sky-airplane-twilight",
  ];
  const publicPhotoNames = await readdir(
    new URL("../public/images/photography/", import.meta.url),
  );
  const builtPhotoNames = await readdir(
    new URL("../dist/client/images/photography/", import.meta.url),
  );

  assert.equal(publicPhotoNames.length, 36);
  assert.deepEqual(builtPhotoNames.sort(), publicPhotoNames.sort());

  for (const name of expectedNames) {
    for (const suffix of ["-900.webp", "-1800.webp", "-1800.jpg"]) {
      assert.ok(
        publicPhotoNames.includes(`${name}${suffix}`),
        `missing ${name}${suffix}`,
      );
    }

    const declaredSize = html.match(
      new RegExp(
        `<img src="/images/photography/${name}-1800\\.jpg"[^>]*width="(\\d+)" height="(\\d+)"`,
      ),
    );
    assert.ok(declaredSize, `missing rendered dimensions for ${name}`);

    const jpeg = await readFile(
      new URL(
        `../public/images/photography/${name}-1800.jpg`,
        import.meta.url,
      ),
    );
    const actualSize = readJpegDimensions(jpeg);
    assert.deepEqual(
      {
        width: Number(declaredSize[1]),
        height: Number(declaredSize[2]),
      },
      actualSize,
      `${name} rendered dimensions should match its 1800 JPEG`,
    );
  }

  assert.doesNotMatch(
    publicPhotoNames.join("\n"),
    /\.(?:arw|heic|mov|jpeg)$/i,
  );
});

test("keeps the local evidence images used by the work route", async () => {
  const publicImageNames = await readdir(new URL("../public/images/", import.meta.url));
  const builtImageNames = await readdir(new URL("../dist/client/images/", import.meta.url));

  for (const name of ["diff-pair-management.png", "fpc-pad-tool.png", "fpc-stiffener-calculator.png"]) {
    assert.ok(publicImageNames.includes(name), `public should include ${name}`);
    assert.ok(builtImageNames.includes(name), `dist should include ${name}`);
  }
});

test("loads the Dify assistant once with an accessible branded bubble", async () => {
  const [layout, component, css, readme] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/dify-chatbot.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /import \{ DifyChatbot \}/);
  assert.match(layout, /<DifyChatbot \/>/);
  assert.match(component, /window as DifyWindow/);
  assert.match(component, /difyWindow\.difyChatbotConfig\s*=/);
  assert.match(component, /token:\s*DIFY_TOKEN/);
  assert.match(component, /dynamicScript:\s*true/);
  assert.match(component, /v6MceBc699WCQuNp/);
  assert.match(component, /https:\/\/udify\.app\/embed\.min\.js/);
  assert.match(component, /getElementById\(DIFY_TOKEN\)/);
  assert.match(component, /document\.body\.appendChild\(script\)/);
  assert.ok(
    component.indexOf("difyWindow.difyChatbotConfig =") <
      component.indexOf("document.body.appendChild(script)"),
    "Dify config should exist before the external script is appended",
  );
  assert.match(component, /isOpen \? "关闭" : "打开"/);
  assert.match(component, /Ocean 的聊天助手/);
  assert.match(component, /aria-describedby/);
  assert.match(component, /aria-expanded/);
  assert.match(component, /aria-controls/);
  assert.match(component, /getComputedStyle\(chatWindow\)\.display/);
  assert.match(component, /chatWindowObserver\.observe\(chatWindow/);
  assert.match(
    component,
    /documentObserver\.observe\(document\.documentElement,\s*\{\s*childList:\s*true,\s*subtree:\s*true/,
  );
  assert.match(component, /let disposed = false/);
  assert.match(component, /if \(disposed\)/);
  assert.match(component, /removeEventListener\("load", handleLoad\)/);
  assert.match(component, /removeEventListener\("error", handleError\)/);
  assert.match(component, /CHAT_PRIVACY_HINT_ID/);
  assert.match(component, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(component, /由 Dify 提供 · 请勿输入敏感信息/);

  assert.match(css, /#dify-chatbot-bubble-button\s*\{/);
  assert.match(css, /content:\s*"和 Ocean 聊聊"/);
  assert.match(css, /background:\s*var\(--ink\)\s*!important/);
  assert.doesNotMatch(css, /#1C64F2/i);
  assert.match(css, /#dify-chatbot-bubble-window\s*\{/);
  assert.match(
    css,
    /#dify-chatbot-bubble-window\s*\{[\s\S]*?position:\s*fixed\s*!important/,
  );
  assert.match(css, /width:\s*min\(24rem, calc\(100vw - 2rem\)\)/);
  assert.match(css, /height:\s*min\(40rem,/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /\.dify-chatbot-privacy-hint\s*\{/);
  assert.match(readme, /前端公开标识/);
  assert.match(readme, /不是服务端密钥/);
  assert.match(readme, /聊天内容会由 Dify\s*及其连接的模型服务处理/);
});
