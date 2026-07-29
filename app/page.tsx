import Link from "next/link";
import {
  ExternalArrow,
  SectionHeading,
  SiteChrome,
} from "./components/site-chrome";
import { ResponsivePhoto } from "./components/responsive-photo";
import { withBasePath } from "./lib/site-path";

export default function Home() {
  return (
    <SiteChrome>
      <section className="hero section">
        <div className="hero-copy">
          <p className="eyebrow">Ocean · 产品经理</p>
          <h1>
            <span className="hero-line">让噪声化为秩序，</span>
            <span className="hero-line">让想法长出形状。</span>
          </h1>
          <p className="hero-description">
            我负责
            <span className="keep-together">嘉立创 EDA 专业版</span>
            中部分 PCB
            功能的产品设计，也在用 AI 把自己的产品想法做成真实工具。
          </p>
          <div className="hero-actions">
            <a className="text-link" href="#lceda-work">
              继续看看 <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="hero-portrait">
          <div className="portrait-frame">
            <img
              src={withBasePath("/images/ocean-pixel-portrait-v1.png")}
              alt="Ocean 的像素插画肖像，戴圆框眼镜、穿深色上衣"
              width="1254"
              height="1254"
            />
          </div>
        </div>
      </section>

      <section className="lceda-feature section" id="lceda-work">
        <div className="lceda-feature-grid">
          <div className="lceda-feature-copy">
            <p className="eyebrow">产品工作</p>
            <h2>
              <span className="lceda-title-line">
                让 <span className="keep-together">PCB 工程师</span>的想法
              </span>
              <span className="lceda-title-line">
                在 <span className="keep-together">嘉立创 EDA</span>
              </span>
              <span className="lceda-title-line">落地生根。</span>
            </h2>
            <p className="lceda-explainer">
              嘉立创 EDA
              是工程师用来设计电路和电路板的软件。工程师在这里连接元件、安排布局和走线、检查设计，再生成交给工厂的文件。
            </p>
            <p className="lceda-role">
              我的工作不是设计电路板，而是设计工程师用来完成这些工作的软件。我负责专业版中部分
              PCB
              功能的产品设计：先弄清实际问题，再把信息、操作和反馈整理成清楚的流程，和研发、测试一起把功能做出来。
            </p>
            <a
              className="text-link"
              href="https://pro.lceda.cn/editor"
              target="_blank"
              rel="noreferrer"
            >
              打开嘉立创 EDA 专业版 <ExternalArrow />
            </a>
          </div>

          <a
            className="lceda-product-panel"
            href="https://pro.lceda.cn/editor"
            target="_blank"
            rel="noreferrer"
            aria-label="打开嘉立创 EDA 专业版（新标签页）"
          >
            <span className="lceda-logo-row">
              <img
                src={withBasePath("/images/brand/jlceda-logo-cn.svg")}
                alt="嘉立创 EDA"
                width="280"
                height="47"
              />
              <span>专业版</span>
            </span>
            <span className="lceda-product-image">
              <img
                src={withBasePath(
                  "/images/brand/jlceda-professional-banner.png",
                )}
                alt="嘉立创 EDA 专业版公开产品主视觉"
                width="740"
                height="727"
                loading="lazy"
              />
            </span>
          </a>
        </div>
      </section>

      <section className="personal-tools section">
        <SectionHeading
          eyebrow="个人作品"
          title="把具体问题，做成可以使用的工具。"
          description="我通过嘉立创 EDA 的公开扩展能力做了两个个人插件。它们是个人作品，不是公司项目。"
        />

        <div className="tool-grid">
          <article className="tool-card" data-tool="diff-pair">
            <figure className="tool-card-visual">
              <div className="tool-image-crop diff-pair-image-crop">
                <img
                  src={withBasePath("/images/diff-pair-management.png")}
                  alt="差分对雷达的规则管理界面"
                  width="1000"
                  height="647"
                  loading="lazy"
                />
              </div>
            </figure>

            <div className="tool-card-body">
              <h3>差分对雷达</h3>
              <p className="tool-card-summary">
                按命名规则找出可能的差分对，工程师核对后可批量写入规则，减少逐条查找和配置。
              </p>
              <p className="tool-role">
                我负责问题定义、范围、交互和验收，通过 Trae
                完成实现，没有手写代码。
              </p>
              <a
                className="text-link"
                href="https://jlc-ext.com/item/oshwhub/diff-pair-assistant"
                target="_blank"
                rel="noreferrer"
              >
                查看扩展页面 <ExternalArrow />
              </a>
            </div>
          </article>

          <article className="tool-card" data-tool="fpc-workshop">
            <figure className="tool-card-visual">
              <img
                src={withBasePath("/images/fpc-stiffener-calculator.png")}
                alt="FPC 工坊的补强厚度估算界面"
                width="997"
                height="735"
                loading="lazy"
              />
            </figure>

            <div className="tool-card-body">
              <h3>FPC 工坊</h3>
              <p className="tool-card-summary">
                把焊盘处理、补强厚度和材料参考整理成图解与估算，帮助工程师做前期判断。
              </p>
              <p className="tool-role">
                我负责把专业知识和决策步骤整理成可操作的界面。
              </p>
              <a
                className="text-link"
                href="https://jlc-ext.com/item/oshwhub/fpc-workshop"
                target="_blank"
                rel="noreferrer"
              >
                查看扩展页面 <ExternalArrow />
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="photography-preview section">
        <header className="photography-preview-heading">
          <p className="eyebrow">工作之外 · 摄影</p>
          <h2>我眼中的世界</h2>
        </header>
        <div className="photography-preview-grid">
          <figure>
            <ResponsivePhoto
              name="lines-red-installation"
              alt="展厅中，密集红线从天花垂下，旧行李箱散落在地面"
              width={1800}
              height={1200}
              sizes="(max-width: 680px) calc(100vw - 2.3rem), 30vw"
            />
            <figcaption>01 深圳美术馆</figcaption>
          </figure>
          <figure>
            <ResponsivePhoto
              name="sea-yellow-buoy"
              alt="蓝色海面上一枚黄色浮标，远处货船沿山脚排开"
              width={1800}
              height={1200}
              sizes="(max-width: 680px) calc(100vw - 2.3rem), 30vw"
            />
            <figcaption>02 海边</figcaption>
          </figure>
          <figure>
            <ResponsivePhoto
              name="sky-rain-city"
              alt="厚重雨云压过城市，远处雨幕落在建筑群上"
              width={1800}
              height={1200}
              sizes="(max-width: 680px) calc(100vw - 2.3rem), 30vw"
            />
            <figcaption>03 深圳</figcaption>
          </figure>
        </div>
        <Link className="work-deep-link" href="/photography">
          <span>看看更多</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </SiteChrome>
  );
}
