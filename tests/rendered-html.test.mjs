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

test("renders the R4 hero and JLCEDA main story", async () => {
  const html = await render("/");
  const [pageSource, storySource] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/eda-scroll-story.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /让噪声化为秩序，/);
  assert.match(html, /让想法长出形状。/);
  assert.doesNotMatch(
    html,
    /把复杂理清|把判断留给人|把复杂工具做清楚|把产品想法做出来/,
  );
  assert.match(
    html,
    /我是 Ocean，负责嘉立创 EDA 专业版的 PCB\s*相关功能设计。我把复杂工程任务整理成清楚的软件流程，让工程师更容易看见问题、完成工作并保留判断。/,
  );
  assert.match(html, /团队产品 · 主案例/);
  assert.match(html, /一台小设备背后，/);
  assert.match(html, /是一场复杂性的整理/);
  assert.match(
    html,
    /普通用户只看到一个 USB-C\s*扩展坞；工程师要同时处理接口、连接、信号、电源、空间和制造。嘉立创 EDA\s*专业版帮助工程师把这些约束组织成可看、可做、可检查、可交付的设计工作。/,
  );
  assert.match(
    html,
    /这个扩展坞是帮助解释 EDA 的通用示意，不对应 Ocean\s*或公司的真实硬件项目；Ocean 没有参与它的硬件设计。/,
  );
  assert.match(html, /真正装进电子设备里的电路板/);
  assert.match(html, /工程师用来设计电路和电路板的软件/);
  assert.match(
    html,
    /嘉立创 EDA 专业版由团队共同完成；Ocean 负责其中部分 PCB\s*功能的产品设计，与研发、测试共同推进落地。/,
  );
  assert.equal(
    (
      `${pageSource}\n${storySource}`.match(
        /嘉立创 EDA 专业版由团队共同完成；Ocean 负责其中部分 PCB/g,
      ) ?? []
    ).length,
    1,
    "home should include the behind-the-scenes ownership note once",
  );
  assert.match(html, /EDA\s*帮助工程师看见和处理约束，但不替代工程判断/);
  assert.match(html, /也不是\s*Ocean 设计的硬件项目/);
});

test("keeps the complete six-step story and six constraints in semantic HTML", async () => {
  const html = await render("/");
  const expectedCopy = [
    "目标很直观：用一根 USB-C 线，把需要的设备连接起来。",
    "工程师要同时权衡接口、连接、信号、电源、空间和制造；它们彼此影响，没有一个按钮能自动给出正确答案。",
    "工程师借助 EDA 梳理元件和网络关系，让连接可见、可编辑、可检查。",
    "EDA 提供设计画布和工具，工程师结合信号、电源、结构与制造要求作出布局和布线判断。",
    "规则检查帮助工程师更早发现冲突；提示是判断线索，不是替工程师作决定。",
    "工程师确认设计后，才生成制造文件并进入生产；最终电路板回到通用扩展坞，熟悉目标成为可交付成品。",
  ];
  const expectedConstraints = [
    ["接口", "要接入哪些设备、提供哪些能力"],
    ["连接", "元件和网络应该怎样相连"],
    ["信号", "高速信号怎样稳定传输"],
    ["电源", "不同器件怎样得到合适供电"],
    ["空间", "接口、元件和线路怎样放进有限板面"],
    ["制造", "设计怎样完成检查并交给工厂生产"],
  ];

  assert.match(html, /<ol class="eda-story-semantic-list">/);
  for (const title of [
    "熟悉目标",
    "工程约束",
    "连接",
    "布局",
    "规则检查",
    "制造交付",
  ]) {
    assert.match(html, new RegExp(title));
  }
  for (const copy of expectedCopy) {
    assert.ok(html.includes(copy), `story should include: ${copy}`);
  }
  for (const [name, explanation] of expectedConstraints) {
    assert.match(html, new RegExp(`<strong>${name}</strong>`));
    assert.ok(
      html.includes(explanation),
      `constraint should explain: ${explanation}`,
    );
  }
  assert.match(html, /提示问题，决定仍由工程师完成/);
  assert.match(html, /板图/);
  assert.match(html, /钻孔/);
  assert.match(html, /装配资料/);
});

test("keeps the same four-evidence plugin contract on home and work", async () => {
  const [home, work] = await Promise.all([render("/"), render("/work")]);
  const sectionIntro =
    "差分对雷达处理重复操作，FPC 工坊整理专业知识。它们让我从个人扩展作者一侧走过发现问题、定义范围、实现、核对和公开发布的链路，帮助继续探索哪些需求适合核心产品、哪些可由扩展承接；这不是公司的正式边界结论。";

  for (const [pathname, html] of [
    ["/", home],
    ["/work", work],
  ]) {
    assert.match(html, /个人插件 · 边界探索/);
    assert.match(
      html,
      /<span class="section-heading-title-line">从两个个人插件，<\/span><span class="section-heading-title-line">观察核心与<span class="keep-together">扩展<\/span>的边界<\/span>/,
    );
    assert.ok(html.includes(sectionIntro));
    assertPluginEvidenceContract(html, pathname);
    assert.match(
      html,
      /https:\/\/jlc-ext\.com\/item\/oshwhub\/diff-pair-assistant/,
    );
    assert.match(
      html,
      /https:\/\/github\.com\/ocean1798\/JLCEDA-diff-pair-assistant/,
    );
    assert.match(
      html,
      /https:\/\/jlc-ext\.com\/item\/oshwhub\/fpc-workshop/,
    );
    assert.match(html, /https:\/\/github\.com\/ocean1798\/fpc-workshop/);
    assert.doesNotMatch(
      html,
      /边界已验证|作者体验顺畅|生态成功|影响内部路线/,
    );
  }
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
  assert.match(html, /mailto:2711180012@qq\.com/);
});

test("keeps all public pages free of job-seeking and preview signals", async () => {
  const pages = await Promise.all(["/", "/work", "/about"].map(render));

  for (const html of pages) {
    assert.doesNotMatch(html, /codex-preview|_sites-preview/i);
    assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
    assert.doesNotMatch(
      html,
      /公开求职|正在求职|求职中|求职意向|下载简历|简历下载|接受机会/,
    );
    assert.doesNotMatch(html, /react-loading-skeleton/);
    assert.match(html, /用个人工具探索新的解决办法/);
    assert.doesNotMatch(html, /用个人工具验证新的解决办法/);
  }
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
