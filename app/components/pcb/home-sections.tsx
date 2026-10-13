import Link from "next/link";
import { withBasePath } from "../../lib/site-path";
import { CONTACT_EMAIL } from "./pcb-chrome";

const HEADLINE = ["让噪声化为秩序，", "让想法长出形状。"];

export function Hero() {
  return (
    <header className="pcb-hero" id="top">
      <span className="chip-tag">
        ● <span style={{ whiteSpace: "nowrap" }}>Ocean · 产品经理</span> ·{" "}
        <span style={{ whiteSpace: "nowrap" }}>嘉立创 EDA 专业版 · 深圳</span>
      </span>
      <h1 className="silk" id="silk" aria-label={HEADLINE.join("")}>
        {HEADLINE.map((line) => (
          <span className="sl" key={line} aria-hidden="true">
            {[...line].map((c, i) => (
              <span
                className="ch"
                key={i}
                style={c === "，" || c === "。" ? { marginRight: "0.08em" } : undefined}
              >
                {c}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <div className="silk-rule" aria-hidden="true"></div>
      <p className="hero-lead">
        嘉立创 EDA 专业版产品经理，做 PCB 功能。
        <br />
        业余用 AI 做 EDA 插件。
      </p>
      <div className="cta">
        <a className="btn btn-cu" href="#plugins">看我的插件</a>
        <a className="btn btn-ghost" href="https://github.com/ocean1798" target="_blank" rel="noopener">GitHub</a>
        <a className="btn btn-neon" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
      <div className="mouse-hint">
        移动鼠标 · <span>点亮板上的网络</span>
      </div>
      <p className="attrib">
        背景电路板：
        <a href="https://oshwhub.com/oshwhub/dian-nao-zhu-ban" target="_blank" rel="noopener">
          【全网首发】X86电脑主板
        </a>
        （LGA1700 · 4 层）· 作者 OSHWHub 官方 · GPL-3.0 · 由原始 PCB 文件渲染
      </p>
    </header>
  );
}

export function WorkSection() {
  return (
    <section className="board-sec" id="work">
      <div className="sec-label" data-lit>01 · 本职工作</div>
      <h2>为画电路板的人设计软件。</h2>
      <p className="sub">
        嘉立创 EDA 专业版 · PCB 功能产品经理 ·{" "}
        <a href="https://pro.lceda.cn/editor" target="_blank" rel="noopener">打开编辑器 ↗</a>
      </p>
      <div className="flow-min" data-comp>
        <span>布局</span><i></i><span>布线</span><i></i><span>设计检查</span><i></i><span>生产文件</span>
      </div>
      <details className="more">
        <summary>了解更多</summary>
        <p>
          我负责专业版里部分 PCB 功能的产品设计：弄清工程师在哪一步卡住，定下做什么、不做什么，再和研发、测试一起交付。产品由团队共同完成，内部项目细节不在这里展示。之前做过测试和嵌入式研发。{" "}
          <Link href="/work/">工作详情 →</Link>
        </p>
      </details>
    </section>
  );
}

const ROLE = "我：定义与验收 · AI：实现";
const DIFF_PAIRS = [
  ["USB_D_P", "USB_D_N"],
  ["HDMI_TX0_P", "HDMI_TX0_N"],
  ["EDP_TX_D1_P", "EDP_TX_D1_N"],
  ["PCIE_RX2_P", "PCIE_RX2_N"],
  ["CLK_P", "CLK_N"],
];

function PluginHead(p: { pin: string; title: string; one: string; github: string; store: string }) {
  return (
    <div className="comp-hd">
      <div>
        <div className="pin">
          {p.pin} · <span className="role">{ROLE}</span>
        </div>
        <h3>{p.title}</h3>
        <p className="one">{p.one}</p>
      </div>
      <div className="links">
        <a href={p.github} target="_blank" rel="noopener">GitHub ↗</a>
        <a href={p.store} target="_blank" rel="noopener">扩展商店 ↗</a>
      </div>
    </div>
  );
}

export function PluginsSection() {
  return (
    <section className="board-sec" id="plugins">
      <div className="sec-label" data-lit>02 · 个人插件</div>
      <h2>把一个具体的麻烦拿掉。</h2>
      <p className="sub">三个嘉立创 EDA 插件，已上架扩展商店。</p>

      <article className="component plug" data-comp data-tool="diff-pair">
        <PluginHead
          pin="U1 · v26.7.1"
          title="差分对雷达"
          one="不用再一对一对加差分对。"
          github="https://github.com/ocean1798/JLCEDA-diff-pair-assistant"
          store="https://jlc-ext.com/item/oshwhub/diff-pair-assistant"
        />
        <div className="comp-body two">
          <img className="shot" src={withBasePath("/images/plugins/diff-pair-radar.png")} alt="差分对雷达界面" loading="lazy" />
          <div>
            <div className="demo" id="diff-demo">
              <div className="demo-title">试一试：悬停查看配对</div>
              <div className="nets" id="nets">
                {DIFF_PAIRS.map(([a, b]) => (
                  <div className="net-row" key={a}>
                    <div className="net p">{a}</div>
                    <div className="net-link"></div>
                    <div className="net">{b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <details className="more">
          <summary>了解更多</summary>
          <p>按命名规则识别 P/N、_H/_L、DP/DM、+/- 等，前缀、中缀、后缀都能认；支持规则管理、网络定位高亮、导出 CSV。我定义问题、范围和交互并负责验收，代码由 Trae 生成。</p>
        </details>
      </article>

      <article className="component plug" data-comp data-tool="fpc-workshop">
        <PluginHead
          pin="U2 · v26.7.4"
          title="FPC 工坊"
          one="补强厚度不用再手算。"
          github="https://github.com/ocean1798/fpc-workshop"
          store="https://jlc-ext.com/item/oshwhub/fpc-workshop"
        />
        <div className="comp-body two">
          <img className="shot" src={withBasePath("/images/plugins/fpc-workshop-stiffener.png")} alt="FPC 工坊补强计算界面" loading="lazy" />
          <div>
            <div className="demo">
              <div className="demo-title">试一试：切换补强材质</div>
              <div className="fpc-demo">
                <div className="stack" id="fpc-stack"></div>
                <div className="fpc-ctrl">
                  <label htmlFor="fpc-mat">补强材质</label>
                  <select id="fpc-mat" defaultValue="PI">
                    <option value="PI">PI 聚酰亚胺</option>
                    <option value="FR4">FR4</option>
                    <option value="STEEL">钢片</option>
                  </select>
                  <label htmlFor="fpc-th">目标总厚 (mm)</label>
                  <input type="range" id="fpc-th" min="0.2" max="0.6" step="0.01" defaultValue="0.35" />
                  <div className="fpc-readout" id="fpc-out">
                    0.20<small>建议补强厚度（示意）</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <details className="more">
          <summary>了解更多</summary>
          <p>一键扩展阻焊压住焊盘；按总厚、叠层和材质（PI / FR4 / 钢片）反推标准补强厚度并写回画布；另带走线载流、线圈电阻、过孔电流估算。结果用于前期判断，以板厂工艺为准。需专业版 3.2.152+，Apache-2.0。</p>
        </details>
      </article>

      <article className="component plug" data-comp data-tool="file-viewer">
        <PluginHead
          pin="U3 · v26.1.1"
          title="文件查看器"
          one="看规格书不用切出 EDA。"
          github="https://github.com/ocean1798/eda-extension-fileViewer"
          store="https://jlc-ext.com/item/zero1798/eda-file-viewer"
        />
        <div className="comp-body two">
          <img className="shot" src={withBasePath("/images/plugins/file-viewer.png")} alt="文件查看器界面" loading="lazy" />
          <div>
            <div className="demo">
              <div className="demo-title">试一试：拖入一个文件</div>
              <div className="dropzone" id="dropzone" tabIndex={0} role="button" aria-label="选择或拖入文件预览">
                <div>
                  <div className="icon">📄</div>
                  <div className="hint">
                    拖入图片或文本，或点击选择
                    <br />
                    <span style={{ color: "var(--mute)", fontSize: 11 }}>只在你的浏览器里预览，不会上传</span>
                  </div>
                  <div className="fname" id="drop-name"></div>
                  <img className="drop-preview" id="drop-prev" alt="" />
                </div>
                <input type="file" id="drop-input" hidden accept="image/*,.txt,.md,.pdf" />
              </div>
            </div>
          </div>
        </div>
        <details className="more">
          <summary>了解更多</summary>
          <p>在 EDA 面板里打开 PDF（连续滚动、缩放）、图片、Markdown 和文本。说明文档提供 5 种语言。</p>
        </details>
      </article>

      <details className="more" style={{ border: 0, padding: "8px 0 0" }}>
        <summary>做这些插件的流程</summary>
        <p>找问题 → 定范围 → 设计交互 → AI 实现 → 验收发布。代码全部由 AI 生成（差分对雷达用 Trae），我不手写。</p>
      </details>
    </section>
  );
}

const PROJECTS = [
  ["CellHive", "4G 模组变短信网关，验证码直接进剪贴板。", "https://github.com/ocean1798/CellHive", "GitHub ↗"],
  ["AirTrack Pro", "Air8202G 轨迹看板，网页、APK、小程序一套代码。", "https://ocean1798.github.io/Air8202G-AirTrack-Pro/", "在线体验 ↗"],
  ["doc-translate", "Word 技术文档中译英，格式和术语都不跑偏。", "https://github.com/ocean1798/doc-translate", "GitHub ↗"],
];

export function MoreSection() {
  return (
    <section className="board-sec" id="more">
      <div className="sec-label" data-lit>03 · 其它项目</div>
      <h2>工作之外，也在折腾。</h2>
      <div className="bento">
        {PROJECTS.map(([name, line, href, go]) => (
          <a key={name} className="mod component" data-comp style={{ margin: 0 }} href={href} target="_blank" rel="noopener">
            <h3>{name}</h3>
            <p>{line}</p>
            <span className="go">{go}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

const TOOLS: { code: string; name: string; line: string; href?: string }[] = [
  { code: "U1 · CODEX", name: "Codex", line: "OpenAI 的编码 agent，读写代码、跑命令。", href: "https://openai.com/codex/" },
  { code: "U2 · PI", name: "Pi Agent", line: "Mario Zechner 写的极简终端编码 agent，可用 TypeScript 扩展。", href: "https://github.com/badlogic/pi-mono" },
  { code: "U3 · CPAMP", name: "CPA Manager Plus", line: "CLIProxyAPI 的自托管管理面板：请求、用量、成本、账号健康。", href: "https://github.com/seakee/CPA-Manager-Plus" },
  { code: "U4 · GROK", name: "Grok Bot", line: "帮我跑杂活的 AI 助手，这个页面也是它一起做的。" },
];

export function ToolsSection() {
  return (
    <section className="board-sec" id="tools">
      <div className="sec-label" data-lit>04 · 最近在用</div>
      <div className="tools">
        {TOOLS.map((t) => {
          const inner = (
            <>
              <code>{t.code}</code>
              <b>{t.name}</b>
              <span>{t.line}</span>
            </>
          );
          return t.href ? (
            <a key={t.name} className="chip" href={t.href} target="_blank" rel="noopener">{inner}</a>
          ) : (
            <div key={t.name} className="chip">{inner}</div>
          );
        })}
      </div>
    </section>
  );
}

const PLAYLIST = "https://music.163.com/playlist?id=12243639089";
const TRACKS = [
  ["28828076", "Where Is the Love", "Josh Vietti"],
  ["385965", "知足", "五月天"],
  ["37196629", "不为谁而作的歌", "林俊杰"],
  ["27566017", "Paperman", "Christophe Beck"],
  ["27853883", "爱，不解释", "张杰"],
  ["2161934816", "向阳而生", "华晨宇"],
  ["28167247", "没有理想的人不伤心", "新裤子"],
  ["1970560262", "夜的尽头", "G.E.M.邓紫棋"],
] as const;
const song = (id: string) => `https://music.163.com/song?id=${id}`;
const cover = (id: string) => withBasePath(`/images/music/${id}.jpg`);

export function MusicSection() {
  const [npId, npName, npArtist] = TRACKS[0];
  return (
    <section className="board-sec" id="music">
      <div className="ph-head">
        <div>
          <div className="sec-label" data-lit style={{ margin: "0 0 10px" }}>05 · 音乐</div>
          <h2 style={{ margin: 0 }}>最近在听。</h2>
        </div>
        <a className="ph-more" href={PLAYLIST} target="_blank" rel="noopener">完整歌单 →</a>
      </div>
      <div className="music component" data-comp>
        <a className="np" href={song(npId)} target="_blank" rel="noopener">
          <div className="np-top">
            <img src={cover(npId)} alt={`${npName} 封面`} />
            <div>
              <small>NOW PLAYING</small>
              <b>{npName}</b>
              <span>{npArtist}</span>
            </div>
          </div>
          <canvas id="scope" aria-hidden="true"></canvas>
          <div className="np-foot">
            <span>CH1 · 网易云音乐 · 百听不厌</span>
            <span className="led-on">● LIVE</span>
          </div>
        </a>
        <ol className="tracks">
          {TRACKS.map(([id, name, artist], i) => (
            <li key={id}>
              <a href={song(id)} target="_blank" rel="noopener">
                <span className="tn">{String(i + 1).padStart(2, "0")}</span>
                <img src={cover(id)} alt="" loading="lazy" />
                <span className="tt"><b>{name}</b><small>{artist}</small></span>
                <span className="go">↗</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const PHOTO_STRIP = [
  ["p01", "深圳美术馆", "lines-red-installation"],
  ["p05", "海边", "sea-yellow-buoy"],
  ["p09", "深圳", "sky-rain-city"],
  ["p03", "重庆", "lines-bridge-cables"],
  ["p08", "香港", "sea-harbor-boat"],
] as const;

export function PhotoSection() {
  return (
    <section className="board-sec" id="photo">
      <div className="ph-head">
        <div className="sec-label" data-lit style={{ margin: 0 }}>06 · 摄影</div>
        <Link className="ph-more" href="/photography/">全部 12 张 →</Link>
      </div>
      <div className="ph-row">
        {PHOTO_STRIP.map(([anchor, place, name], i) => (
          <Link key={anchor} className="ph" href={`/photography/#${anchor}`}>
            <span className="ph-ref">{String(i + 1).padStart(2, "0")} · {place}</span>
            <span className="ph-frame">
              <img src={withBasePath(`/images/photography/${name}-900.webp`)} alt={place} loading="lazy" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section className="board-sec" id="contact">
      <div className="sec-label" data-lit>07 · 联系</div>
      <div className="contact">
        <div>
          <h2>聊聊？</h2>
          <p>EDA、硬件工具、AI 落地，或者工作机会。</p>
        </div>
        <div className="cta">
          <a className="btn btn-neon" href={`mailto:${CONTACT_EMAIL}`}>✉ {CONTACT_EMAIL}</a>
          <a className="btn btn-ghost" href="https://github.com/ocean1798" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    </section>
  );
}
