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

test("renders the fixed hero and branded JLCEDA product section", async () => {
  const html = await render("/");
  const [pageSource, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const heroActionsStart = html.indexOf('class="hero-actions"');
  const heroActions = html.slice(
    heroActionsStart,
    html.indexOf("</div>", heroActionsStart),
  );

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /让噪声化为秩序，/);
  assert.match(html, /让想法长出形状。/);
  assert.doesNotMatch(
    html,
    /把复杂理清|把判断留给人|把复杂工具做清楚|把产品想法做出来/,
  );
  assert.match(html, /Ocean · 产品经理/);
  assert.match(
    html,
    /我负责<span class="keep-together">嘉立创 EDA 专业版<\/span>中部分 PCB\s*功能的产品设计，也在用 AI 把自己的产品想法做成真实工具。/,
  );
  assert.match(
    html,
    /class="hero-actions"><a class="text-link" href="#lceda-work">继续看看/,
  );
  assert.equal((heroActions.match(/<a /g) ?? []).length, 1);
  assert.doesNotMatch(heroActions, /看我的工作|了解我|href="\/(?:work|about)"/);
  assert.doesNotMatch(heroActions, /class="button button-(?:primary|secondary)"/);
  assert.match(html, /id="lceda-work"/);
  assert.match(html, /产品工作/);
  assert.match(
    html,
    /<span class="lceda-title-line">让 <span class="keep-together">PCB 工程师<\/span>的想法<\/span><span class="lceda-title-line">在 <span class="keep-together">嘉立创 EDA<\/span><\/span><span class="lceda-title-line">落地生根。<\/span>/,
  );
  assert.match(
    html,
    /嘉立创 EDA\s*是工程师用来设计电路和电路板的软件。工程师在这里连接元件、安排布局和走线、检查设计，再生成交给工厂的文件。/,
  );
  assert.match(
    html,
    /我的工作不是设计电路板，而是设计工程师用来完成这些工作的软件。我负责专业版中部分\s*PCB\s*功能的产品设计：先弄清实际问题，再把信息、操作和反馈整理成清楚的流程，和研发、测试一起把功能做出来。/,
  );
  assert.match(
    html,
    /src="\/images\/brand\/jlceda-logo-cn\.svg"[^>]*alt="嘉立创 EDA"/,
  );
  assert.match(
    html,
    /src="\/images\/brand\/jlceda-professional-banner\.png"[^>]*alt="嘉立创 EDA 专业版公开产品主视觉"/,
  );
  assert.match(html, /打开嘉立创 EDA 专业版/);
  assert.doesNotMatch(
    html,
    /我的工作 · 嘉立创 EDA 专业版|先弄清工程师哪里卡住|嘉立创 EDA 专业版由团队共同完成。下面只说明我参与的部分 PCB\s*产品工作。/,
  );
  assert.doesNotMatch(
    html,
    /找到真实问题|把流程设计清楚|跟到真正能用|团队产品 · 主案例|一台小设备|USB-C|扩展坞|名词解释|查看公开帮助文档|eda-story|home-about|contact-cta/,
  );
  assert.doesNotMatch(
    html,
    /关于 Ocean|保持联系|查看两个插件的完整工作过程/,
  );
  assert.doesNotMatch(pageSource, /EdaScrollStory|eda-main-case|productWork/);
  assert.match(
    css,
    /\.keep-together\s*\{[^}]*white-space:\s*nowrap;[^}]*\}/,
  );
  assert.match(
    css,
    /\.lceda-feature h2,[\s\S]*?\{[^}]*text-wrap:\s*balance;[^}]*\}/,
  );
  assert.match(
    css,
    /\.lceda-title-line\s*\{[^}]*display:\s*block;[^}]*white-space:\s*nowrap;[^}]*\}/,
  );
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\.site-brand > span:last-child\s*\{[^}]*display:\s*inline;/,
  );
  assert.match(html, /我眼中的世界/);
  assert.doesNotMatch(html, /12 张照片，分成三组。/);
  assert.match(html, /01 深圳美术馆/);
  assert.match(html, /02 海边/);
  assert.match(html, /03 深圳/);
  assert.match(html, /看看更多/);
  assert.doesNotMatch(html, /看摄影作品/);
});

test("keeps only the home logo in every public header and exposes no About link", async () => {
  const pages = await Promise.all(
    ["/", "/work", "/about", "/photography"].map(async (pathname) => ({
      pathname,
      html: await render(pathname),
    })),
  );

  for (const { pathname, html } of pages) {
    const headerStart = html.indexOf('<header class="site-header">');
    const header = html.slice(headerStart, html.indexOf("</header>", headerStart));

    assert.match(html, /<a href="\/" class="site-brand" aria-label="Ocean 首页">/);
    assert.equal((header.match(/<a /g) ?? []).length, 1, pathname);
    assert.doesNotMatch(header, /<nav\b|site-nav|aria-current/, pathname);
    assert.doesNotMatch(html, /href="\/about"/, pathname);
  }
});

test("keeps the personal tool exploration factual and concise", async () => {
  const html = await render("/");
  const { diffPair, fpc } = getToolSegments(html, "/");

  assert.match(html, /个人作品/);
  assert.match(html, /把具体问题，做成可以使用的工具。/);
  assert.match(
    html,
    /我通过嘉立创 EDA 的公开扩展能力做了两个个人插件。它们是个人作品，不是公司项目。/,
  );
  for (const segment of [diffPair, fpc]) {
    assert.equal((segment.match(/<img /g) ?? []).length, 1);
    assert.equal((segment.match(/https:\/\/jlc-ext\.com/g) ?? []).length, 1);
    assert.doesNotMatch(
      segment,
      /<dl|project-meta|公开源码|github\.com|不能推出什么结论/,
    );
  }
  assert.match(
    diffPair,
    /按命名规则找出可能的差分对，工程师核对后可批量写入规则，减少逐条查找和配置。/,
  );
  assert.match(
    diffPair,
    /我负责问题定义、范围、交互和验收，通过 Trae\s*完成实现，没有手写代码。/,
  );
  assert.match(
    fpc,
    /把焊盘处理、补强厚度和材料参考整理成图解与估算，帮助工程师做前期判断。/,
  );
  assert.match(
    fpc,
    /我负责把专业知识和决策步骤整理成可操作的界面。/,
  );
  assert.match(
    fpc,
    /src="\/images\/fpc-stiffener-calculator\.png"/,
  );
  assert.doesNotMatch(
    html,
    /个人插件 · 边界探索|观察核心与|正式产品边界|fpc-pad-tool/,
  );
});

test("keeps public plugin evidence on home and detailed boundaries on work", async () => {
  const [home, work] = await Promise.all([render("/"), render("/work")]);

  for (const html of [home, work]) {
    assert.match(
      html,
      /https:\/\/jlc-ext\.com\/item\/oshwhub\/diff-pair-assistant/,
    );
    assert.match(
      html,
      /https:\/\/jlc-ext\.com\/item\/oshwhub\/fpc-workshop/,
    );
  }

  assert.doesNotMatch(
    home,
    /https:\/\/github\.com\/ocean1798\/(?:JLCEDA-diff-pair-assistant|fpc-workshop)/,
  );
  assert.match(
    work,
    /https:\/\/github\.com\/ocean1798\/JLCEDA-diff-pair-assistant/,
  );
  assert.match(
    work,
    /https:\/\/github\.com\/ocean1798\/fpc-workshop/,
  );

  for (const html of [home, work]) {
    assert.doesNotMatch(
      html,
      /边界已验证|作者体验顺畅|生态成功|影响内部路线/,
    );
  }

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
  assert.match(html, /mailto:2711180012@qq\.com/);
});

test("renders the photography route as twelve unclassified observations", async () => {
  const html = await render("/photography");
  const [pageSource, css] = await Promise.all([
    readFile(new URL("../app/photography/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const expectedAlts = [
    "展厅中，密集红线从天花垂下，旧行李箱散落在地面",
    "浅色背景前，由细金属丝交叠形成的团状雕塑",
    "夜色中，红色桥梁与放射状桥索横跨江面",
    "暮色里，高楼立面由重复窗格和竖线分割",
    "蓝色海面上一枚黄色浮标，远处货船沿山脚排开",
    "海浪拍向褐色礁石，远处小船散在蓝色海面",
    "右侧岩壁切开大面积天空与海面，远处有一艘小船",
    "蓝色海港中，一艘红帆船驶过城市与山影",
    "厚重雨云压过城市，远处雨幕落在建筑群上",
    "高空俯瞰深圳建筑群，明亮积云覆盖城市上空",
    "橙色晚霞越过深色山影与云层",
    "飞机翼尖指向橙紫色地平线，弯月悬在暗色天空",
  ];
  const expectedCaptions = [
    "01 深圳美术馆",
    "02 深圳美术馆",
    "03 重庆",
    "04 楼宇间的白云",
    "05 海边",
    "06 天文台",
    "07 美人鱼拍摄取景地",
    "08 香港",
    "09 深圳",
    "10 深圳",
    "11 夕阳",
    "12 飞机上拍下的景象",
  ];

  assert.match(html, /<h1>我眼中的世界<\/h1>/);
  assert.doesNotMatch(
    html,
    /Photography \/ 摄影|线条与形状|云、雨和暮色|Lines &amp; Shapes|By the Sea|Clouds, Rain &amp; Dusk|材料不同，但它们都靠重复和交叠形成画面|我喜欢把海拍得有一个明确的参照物|天空一变，熟悉的城市也会跟着变/,
  );
  assert.equal(
    (html.match(/class="photography-item /g) ?? []).length,
    12,
    "photography page should render twelve fixed photo positions",
  );

  for (const alt of expectedAlts) {
    assert.ok(html.includes(`alt="${alt}"`), `missing alt text: ${alt}`);
  }
  for (const caption of expectedCaptions) {
    const [number, ...source] = caption.split(" ");
    assert.ok(
      html.includes(`<span>${number}</span>${source.join(" ")}`),
      `missing photo source caption: ${caption}`,
    );
  }

  assert.doesNotMatch(pageSource, /masonry|carousel|lightbox|object-fit/i);
  assert.doesNotMatch(html, /weather-fog-tower|weather-sunset-city/);
  assert.match(css, /\.photo-pair-large\s*\{[\s\S]*?grid-column:\s*1 \/ 8/);
  assert.match(css, /\.photo-pair-small\s*\{[\s\S]*?grid-column:\s*8 \/ 13/);
  assert.match(css, /\.photo-closing\s*\{[\s\S]*?grid-column:\s*5 \/ 13/);
  assert.match(css, /\.photography-frame\s*\{[\s\S]*?border-radius:\s*18px/);
  assert.match(css, /translateY\(24px\)/);
  assert.match(css, /transition-delay:\s*80ms/);
  assert.match(css, /translateY\(-3px\) scale\(1\.015\)/);
  assert.match(
    css,
    /@media \(max-width: 680px\)[\s\S]*?\.photography-frame\s*\{[\s\S]*?border-radius:\s*12px/,
  );
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("keeps all public pages free of job-seeking and preview signals", async () => {
  const pages = await Promise.all(
    ["/", "/work", "/about", "/photography"].map(render),
  );

  for (const html of pages) {
    assert.doesNotMatch(html, /codex-preview|_sites-preview/i);
    assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
    assert.doesNotMatch(
      html,
      /公开求职|正在求职|求职中|求职意向|下载简历|简历下载|接受机会/,
    );
    assert.doesNotMatch(html, /react-loading-skeleton/);
    assert.match(
      html,
      /Ocean｜负责<span class="keep-together">嘉立创 EDA 专业版<\/span>部分 PCB 功能的产品设计/,
    );
    assert.doesNotMatch(
      html,
      /用个人工具(?:探索|验证)新的解决办法/,
    );
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

test("uses local evidence images and an HTML/CSS story with static fallbacks", async () => {
  const publicImageNames = await readdir(
    new URL("../public/images/", import.meta.url),
  );
  const builtImageNames = await readdir(
    new URL("../dist/client/images/", import.meta.url),
  );
  const evidenceImageNames = [
    "diff-pair-management.png",
    "fpc-pad-tool.png",
    "fpc-stiffener-calculator.png",
  ];

  for (const name of evidenceImageNames) {
    assert.ok(publicImageNames.includes(name), `public should include ${name}`);
    assert.ok(builtImageNames.includes(name), `dist should include ${name}`);
  }

  const [css, component] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/eda-scroll-story.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  const storySource = `${css}\n${component}`;

  assert.match(css, /height:\s*430svh/);
  assert.match(
    css,
    /@media \(max-width: 680px\), \(max-height: 619px\), \(prefers-reduced-motion: reduce\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 900px\) and \(min-width: 681px\) and \(min-height: 620px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 0\.7fr\) minmax\(260px, 1\.3fr\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 360px\)[\s\S]*?\.connection-node\s*\{[\s\S]*?min-width:\s*3\.6rem[\s\S]*?\.connection-node-control\s*\{[\s\S]*?left:\s*36%/,
  );
  assert.match(css, /clip-path:\s*inset\(50%\)/);
  assert.match(css, /height:\s*auto/);
  assert.match(
    css,
    /\.eda-story-presentation\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?transform:\s*none;/,
  );
  assert.match(
    css,
    /\.eda-story-presentation \.dock-story-canvas\s*\{[\s\S]*?opacity:\s*var\(--frame-opacity\)/,
  );
  assert.doesNotMatch(
    css,
    /\.eda-story-presentation \.dock-story-visual\s*\{[^}]*opacity:\s*var\(--frame-opacity\)/,
  );
  assert.match(
    css,
    /\.eda-story-presentation\[data-current\][\s\S]*?\.eda-story-copy\s*\{[\s\S]*?opacity:\s*1/,
  );
  assert.match(
    css,
    /\.eda-story-presentation\[data-current\] \.dock-story-caption\s*\{[\s\S]*?opacity:\s*1/,
  );
  assert.match(
    css,
    /\.eda-story-presentation \.dock-story-caption\s*\{[\s\S]*?color:\s*rgba\(255, 255, 255, 0\.68\)/,
  );
  assert.doesNotMatch(
    css,
    /\.eda-story-presentation[\s\S]*?\.eda-story-copy\s*\{[^}]*transition:\s*opacity/,
  );
  assert.doesNotMatch(
    css,
    /\.eda-story-presentation \.dock-story-caption\s*\{[^}]*transition:\s*opacity/,
  );
  assert.match(component, /<ol className="eda-story-semantic-list">/);
  assert.match(component, /aria-hidden="true"/);
  assert.doesNotMatch(css, /visibility:\s*hidden/);
  assert.doesNotMatch(storySource, /eda-device-pcb-story-v2|<svg|Three\.js|three/i);
  assert.doesNotMatch(component, /<img|backgroundImage/);
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
