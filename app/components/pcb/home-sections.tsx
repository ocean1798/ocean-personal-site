import Link from "next/link";
import { withBasePath } from "../../lib/site-path";
import { ResponsivePhoto } from "../responsive-photo";
import { AlbumLazy } from "../album/album-lazy";
import { SITE_PHOTOS, albumPhotosFrom, photoNumber } from "../album/photo-data";
import { CONTACT_EMAIL } from "./pcb-chrome";

const HEADLINE = ["让噪声化为秩序，", "让想法长出形状。"];

export function Hero() {
  return (
    <header className="pcb-hero" id="top">
      <div className="id-row">
        <img
          className="avatar"
          src={withBasePath("/images/ocean-pixel-portrait-320.png")}
          alt="海洋湃的像素头像"
          width={160}
          height={160}
        />
        <div>
          <h1 className="name">
            海洋湃<span className="latin">Ocean</span>
          </h1>
          <p className="id-line">嘉立创 EDA 产品经理 · 深圳</p>
        </div>
      </div>
      <p className="silk" id="silk" aria-label={HEADLINE.join("")}>
        {HEADLINE.map((line) => (
          <span className="sl" key={line} aria-hidden="true">
            {[...line].map((c, i) => (
              <span className="ch" key={i}>
                {c}
              </span>
            ))}
          </span>
        ))}
      </p>
      <div className="cta">
        <a className="btn btn-cu" href="#plugins">看我的插件</a>
        <a className="btn btn-neon" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <a className="icon-link" href="https://github.com/ocean1798" target="_blank" rel="noopener" aria-label="GitHub（新标签页打开）" title="GitHub">
          <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
      <a className="board-credit" href="#board-credit">背景板 ↗</a>
    </header>
  );
}

export function WorkSection() {
  return (
    <section className="board-sec" id="work">
      <div className="sec-label" data-lit>01 · 本职工作</div>
      <h2>为画电路板的人设计软件。</h2>
      <p className="sub" data-power>
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
      <p className="sub" data-power>三个嘉立创 EDA 插件，已上架扩展商店。</p>

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

export function PhotoSection() {
  const albumPhotos = albumPhotosFrom(SITE_PHOTOS);
  return (
    <section className="board-sec" id="photography">
      <span id="photo" />
      <div className="sec-label" data-lit>
        03 · 摄影
      </div>
      <h2>我眼中的世界</h2>
      <div className="ph-page">
        <AlbumLazy photos={albumPhotos}>
          <div className="ph-grid">
            {SITE_PHOTOS.map((photo, index) => {
              const number = photoNumber(index);
              return (
                <a
                  className="ph"
                  id={`p${number}`}
                  key={photo.name}
                  href={withBasePath(`/images/photography/${photo.name}-1800.jpg`)}
                >
                  <span className="ph-ref">
                    {number} · {photo.source}
                  </span>
                  <span className="ph-frame">
                    <ResponsivePhoto
                      name={photo.name}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 800px) 50vw, 300px"
                      loading={number === "01" ? "eager" : "lazy"}
                    />
                  </span>
                </a>
              );
            })}
          </div>
        </AlbumLazy>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section className="board-sec" id="contact">
      <div className="sec-label" data-lit>04 · 联系</div>
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
