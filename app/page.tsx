import Link from "next/link";
import {
  ExternalArrow,
  SectionHeading,
  SiteChrome,
} from "./components/site-chrome";
import { EdaScrollStory } from "./components/eda-scroll-story";
import { withBasePath } from "./lib/site-path";

const responsibilities = [
  {
    number: "01",
    title: "把线路连清楚",
    body: "把元件、焊盘、网络和布线之间的关系，整理成工程师能理解、能操作的产品流程。",
  },
  {
    number: "02",
    title: "把问题挡在生产前",
    body: "让设计约束、检查结果和修改线索更早出现，减少问题被带到制造环节的机会。",
  },
  {
    number: "03",
    title: "让设计安全协作并交付",
    body: "围绕多人协作、设计确认和制造交付，减少信息在不同环节之间的丢失与误解。",
  },
] as const;

export default function Home() {
  return (
    <SiteChrome currentPath="/">
      <section className="hero section">
        <div className="hero-copy">
          <p className="eyebrow">Product Manager · PCB / EDA</p>
          <h1>
            让噪声化为秩序，
            <br />
            让想法长出形状。
          </h1>
          <p className="hero-description">
            我是 Ocean，负责嘉立创 EDA 专业版的 PCB
            相关功能设计。我把复杂工程任务整理成清楚的软件流程，让工程师更容易看见问题、完成工作并保留判断。
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/work">
              看我的工作 <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button-secondary" href="/about">
              了解我
            </Link>
          </div>
        </div>

        <figure className="hero-portrait">
          <div className="portrait-frame">
            <img
              src={withBasePath("/images/ocean-pixel-portrait-v1.png")}
              alt="Ocean 的像素插画肖像，戴圆框眼镜、穿深色上衣"
              width="1254"
              height="1254"
            />
          </div>
          <figcaption>
            <span className="status-dot" aria-hidden="true" />
            Product manager · PCB / EDA
          </figcaption>
        </figure>
      </section>

      <article className="eda-main-case" aria-labelledby="eda-main-title">
        <header className="eda-main-intro section">
          <p className="eyebrow">团队产品 · 主案例</p>
          <h2 id="eda-main-title">
            <span>一台小设备背后，</span>
            <span>是一场复杂性的整理</span>
          </h2>
          <p className="eda-main-lede">
            普通用户只看到一个 USB-C
            扩展坞；工程师要同时处理接口、连接、信号、电源、空间和制造。嘉立创 EDA
            专业版帮助工程师把这些约束组织成可看、可做、可检查、可交付的设计工作。
          </p>
          <p className="eda-main-boundary">
            这个扩展坞是帮助解释 EDA 的通用示意，不对应 Ocean
            或公司的真实硬件项目；Ocean 没有参与它的硬件设计。
          </p>
          <div className="eda-terms" aria-label="名词解释">
            <p>
              <strong>PCB</strong>
              真正装进电子设备里的电路板
            </p>
            <p>
              <strong>EDA</strong>
              工程师用来设计电路和电路板的软件
            </p>
          </div>
        </header>

        <EdaScrollStory />

        <section className="eda-main-summary section">
          <div className="eda-main-summary-copy">
            <p className="eyebrow">Ocean 的职责</p>
            <h2>让专业能力真正变成工程师用得上的产品。</h2>
            <p className="eda-main-closing-boundary">
              嘉立创 EDA 专业版是团队共同完成的产品；这段故事展示它怎样支持工程工作，以及
              Ocean 参与的部分 PCB 软件设计。EDA
              帮助工程师看见和处理约束，但不替代工程判断；通用扩展坞只用于解释流程，也不是
              Ocean 设计的硬件项目。
            </p>
            <div className="eda-main-actions">
              <a
                className="button button-primary"
                href="https://pro.lceda.cn/editor"
                target="_blank"
                rel="noreferrer"
              >
                打开嘉立创 EDA 专业版 <ExternalArrow />
              </a>
              <a
                className="text-link"
                href="https://prodocs.lceda.cn/cn/"
                target="_blank"
                rel="noreferrer"
              >
                查看公开帮助文档 <ExternalArrow />
              </a>
            </div>
          </div>

          <div className="responsibility-grid">
            {responsibilities.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </article>

      <section className="personal-tools section">
        <SectionHeading
          eyebrow="个人插件 · 边界探索"
          title={
            <>
              <span className="section-heading-title-line">
                从两个个人插件，
              </span>
              <span className="section-heading-title-line">
                观察核心与<span className="keep-together">扩展</span>的边界
              </span>
            </>
          }
          description="差分对雷达处理重复操作，FPC 工坊整理专业知识。它们让我从个人扩展作者一侧走过发现问题、定义范围、实现、核对和公开发布的链路，帮助继续探索哪些需求适合核心产品、哪些可由扩展承接；这不是公司的正式边界结论。"
        />

        <div className="tool-grid">
          <article className="tool-card" data-tool="diff-pair">
            <figure className="tool-card-visual">
              <div className="tool-image-crop diff-pair-image-crop">
                <img
                  src={withBasePath("/images/diff-pair-management.png")}
                  alt="差分对雷达的规则管理界面，可在表格中确认差分网络并批量应用规则"
                  width="1000"
                  height="647"
                  loading="lazy"
                />
              </div>
              <figcaption>公开功能截图 · 差分对规则管理</figcaption>
            </figure>

            <div className="tool-card-body">
              <div className="project-meta">
                <span>个人工具实验</span>
                <span>重复操作自动化</span>
              </div>
              <h3>差分对雷达</h3>
              <dl className="tool-evidence-contract">
                <div>
                  <dt>解决什么问题</dt>
                  <dd>
                    高速信号常用两条线路成对传输。这个插件按命名规则找到候选线路组合，让工程师先在表格中确认，再批量写入设计，减少逐条寻找和配置。
                  </dd>
                </div>
                <div>
                  <dt>Ocean 做了什么</dt>
                  <dd>
                    完成问题定义、范围取舍、产品与交互设计，并通过 Trae
                    实现，过程中没有手写一行代码。AI
                    缩短了这次个人验证从想法到可用插件的距离。
                  </dd>
                </div>
                <div>
                  <dt>公开证据</dt>
                  <dd className="tool-card-links">
                    <a
                      className="text-link"
                      href="https://jlc-ext.com/item/oshwhub/diff-pair-assistant"
                      target="_blank"
                      rel="noreferrer"
                    >
                      扩展页面 <ExternalArrow />
                    </a>
                    <a
                      className="text-link text-link-muted"
                      href="https://github.com/ocean1798/JLCEDA-diff-pair-assistant"
                      target="_blank"
                      rel="noreferrer"
                    >
                      公开源码 <ExternalArrow />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>不能推出什么结论</dt>
                  <dd>
                    这项个人探索不能代表公司的正式产品边界，也不能据此评价整个扩展生态。
                  </dd>
                </div>
              </dl>
            </div>
          </article>

          <article className="tool-card" data-tool="fpc-workshop">
            <div className="tool-card-visual tool-card-visual-split">
              <figure>
                <img
                  src={withBasePath("/images/fpc-pad-tool.png")}
                  alt="FPC 工坊的压 PAD 工具，通过阻焊处理增强焊盘结合，并用截面图和顶视图解释变化"
                  width="1004"
                  height="730"
                  loading="lazy"
                />
              </figure>
              <figure>
                <img
                  src={withBasePath("/images/fpc-stiffener-calculator.png")}
                  alt="FPC 工坊的 PI（常用柔性补强材料）补强计算器，展示材料截面、补强厚度估算和批量应用选项"
                  width="997"
                  height="735"
                  loading="lazy"
                />
              </figure>
              <p>
                公开功能截图 · 压 PAD（阻焊处理）与 PI（常用柔性补强材料）补强厚度估算
              </p>
            </div>

            <div className="tool-card-body">
              <div className="project-meta">
                <span>个人工具实验</span>
                <span>专业知识工具化</span>
              </div>
              <h3>FPC 工坊</h3>
              <dl className="tool-evidence-contract">
                <div>
                  <dt>解决什么问题</dt>
                  <dd>
                    FPC
                    是可以弯折的电路板，但金手指（连接器接触区域）等位置仍常需补强。插件把压
                    PAD、PI（常用柔性补强材料）厚度估算、材料参考和批量操作整理成前期辅助判断。
                  </dd>
                </div>
                <div>
                  <dt>Ocean 做了什么</dt>
                  <dd>
                    从真实 FPC
                    场景整理知识和决策步骤，用截面与顶视图解释处理变化，并把计算参考接到可操作的插件界面。
                  </dd>
                </div>
                <div>
                  <dt>公开证据</dt>
                  <dd className="tool-card-links">
                    <a
                      className="text-link"
                      href="https://jlc-ext.com/item/oshwhub/fpc-workshop"
                      target="_blank"
                      rel="noreferrer"
                    >
                      扩展页面 <ExternalArrow />
                    </a>
                    <a
                      className="text-link text-link-muted"
                      href="https://github.com/ocean1798/fpc-workshop"
                      target="_blank"
                      rel="noreferrer"
                    >
                      公开源码 <ExternalArrow />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>不能推出什么结论</dt>
                  <dd>
                    计算结果只是前期参考，不能替代项目叠层、连接器要求和板厂工艺规范，也不能代表公司的正式产品边界。
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        </div>

        <Link className="work-deep-link" href="/work">
          <span>继续看问题、判断与落地过程</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="home-about section">
        <div>
          <p className="eyebrow">关于 Ocean</p>
          <h2>先弄懂事情怎样真实运转，再决定产品应该怎样工作。</h2>
        </div>
        <div>
          <p>
            从测试、嵌入式研发到产品，我习惯先找到事实与约束，再把不同视角推进到同一个结果。
          </p>
          <Link className="text-link" href="/about">
            了解我的经历与做事方式 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="contact-cta section">
        <p className="eyebrow">保持联系</p>
        <h2>如果你也在做复杂产品、EDA 工具或 AI 实验，欢迎和我聊聊。</h2>
        <div className="contact-actions">
          <a className="button button-primary" href="mailto:2711180012@qq.com">
            发邮件 <span aria-hidden="true">↗</span>
          </a>
          <a
            className="button button-secondary"
            href="https://github.com/ocean1798"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ExternalArrow />
          </a>
        </div>
      </section>
    </SiteChrome>
  );
}
