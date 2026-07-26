import type { Metadata } from "next";
import {
  ExternalArrow,
  SectionHeading,
  SiteChrome,
} from "../components/site-chrome";
import { withBasePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "工作",
  description:
    "Ocean 如何把复杂问题变成可用产品：嘉立创 EDA 专业版 PCB 功能设计，以及差分对雷达和 FPC 工坊。",
};

const edaChapters = [
  {
    number: "01",
    eyebrow: "先看真实任务",
    title: "工程师不是在“画一张图”，而是在安排一个产品怎样工作。",
    body: "一块 PCB 上有元件、焊盘、线路、层叠与制造规则。工程师既要让电路实现预期功能，也要确保它可以被生产、装配和验证。产品设计的起点，是先理解这条完整任务，而不是先增加一个按钮。",
  },
  {
    number: "02",
    eyebrow: "再整理复杂关系",
    title: "把专业规则放到用户真正做决定的地方。",
    body: "我关注操作从哪里开始、信息何时出现、错误怎样被发现，以及方案如何与上下游衔接。目标不是让界面看起来简单，而是让使用者面对复杂问题时仍然知道下一步该做什么。",
  },
  {
    number: "03",
    eyebrow: "最后共同落地",
    title: "产品方案要经过实现、测试与真实使用，才算完成。",
    body: "我把问题、目标、边界与交互整理成团队可以共同验证的方案，再与研发、测试一起推进实现和核对结果。过程中保留取舍，也不把团队共同完成的产品包装成个人成果。",
  },
] as const;

const responsibilities = [
  {
    title: "把线路连清楚",
    body: "梳理元件、焊盘、网络和布线之间的关系，让关键操作与反馈更容易理解。",
  },
  {
    title: "把问题挡在生产前",
    body: "让约束、检查与修改线索更早出现，帮助工程师在交付制造前发现问题。",
  },
  {
    title: "让设计安全协作并交付",
    body: "围绕协作、确认和制造交付，减少设计信息在不同环节之间的丢失与误解。",
  },
] as const;

export default function WorkPage() {
  return (
    <SiteChrome currentPath="/work">
      <header className="page-hero work-page-hero section">
        <div>
          <p className="eyebrow">Work / 工作</p>
          <h1>
            <span>我如何把复杂问题</span>
            <span>变成可用产品</span>
          </h1>
        </div>
        <p>
          先理解工程师真正要完成的任务，再把规则、流程与协作关系整理清楚。下面是一项团队主案例，以及两项由真实问题长出来的个人工具。
        </p>
      </header>

      <article className="work-eda-case" aria-labelledby="work-eda-title">
        <header className="work-eda-header section">
          <div>
            <p className="eyebrow">团队产品 · 主案例</p>
            <h2 id="work-eda-title">嘉立创 EDA 专业版</h2>
          </div>
          <div className="work-eda-lede">
            <p>
              这是一款帮助工程师完成电路与电路板设计的 EDA
              软件。原理图定义电路如何连接，PCB
              设计则把元件与线路安排到真实板子上，并为制造准备数据。
            </p>
            <p>
              嘉立创 EDA 专业版由团队共同完成；我负责其中部分 PCB
              功能的产品设计，与研发、测试共同推进落地。
            </p>
          </div>
        </header>

        <section className="work-eda-chapters section" aria-label="主案例三章">
          {edaChapters.map((chapter) => (
            <article className="work-eda-chapter" key={chapter.number}>
              <div className="work-eda-chapter-index">
                <span>{chapter.number}</span>
                <p>{chapter.eyebrow}</p>
              </div>
              <div>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="work-responsibility section">
          <SectionHeading
            eyebrow="我负责的方向"
            title="把复杂工程工作，整理成清楚的产品流程"
          />
          <div className="work-responsibility-grid">
            {responsibilities.map((item, index) => (
              <article key={item.title}>
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="work-eda-boundary section">
          <div>
            <p className="eyebrow">职责边界</p>
            <h2>团队产品，清楚说明我的部分。</h2>
          </div>
          <div>
            <p>
              我展示的是自己参与 PCB
              功能设计时采用的问题理解、产品判断与协作方式，不把整套产品、平台规模或团队成果归为个人成绩。这里也不公开内部项目、客户信息或未公开方案。
            </p>
            <div className="case-actions">
              <a
                className="button button-primary"
                href="https://pro.lceda.cn/editor"
                target="_blank"
                rel="noreferrer"
              >
                打开公开编辑器 <ExternalArrow />
              </a>
              <a
                className="button button-secondary"
                href="https://prodocs.lceda.cn/cn/"
                target="_blank"
                rel="noreferrer"
              >
                查看帮助文档 <ExternalArrow />
              </a>
            </div>
          </div>
        </section>
      </article>

      <section
        className="work-tool-lab section"
        aria-label="个人插件 · 边界探索"
      >
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

        <article className="work-tool-case" data-tool="diff-pair">
          <div className="work-tool-copy">
            <div className="project-meta">
              <span>01</span>
              <span>个人工具实验</span>
              <span>重复操作自动化</span>
            </div>
            <h2>差分对雷达</h2>
            <p className="work-tool-plain">
              高速信号常用两条线路成对传输。网络一多，工程师逐条寻找、核对和配置就容易反复往返。
            </p>

            <dl className="work-tool-story">
              <div>
                <dt>解决什么问题</dt>
                <dd>
                  按命名规则识别候选线路组合，让工程师在表格中确认后批量写入设计，减少逐条寻找和配置。
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
                <dd className="work-tool-links">
                  <a
                    className="text-link"
                    href="https://jlc-ext.com/item/oshwhub/diff-pair-assistant"
                    target="_blank"
                    rel="noreferrer"
                  >
                    扩展页面 <ExternalArrow />
                  </a>
                  <a
                    className="text-link"
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

          <figure className="work-tool-evidence">
            <div className="work-tool-image-crop diff-pair-image-crop">
              <img
                src={withBasePath("/images/diff-pair-management.png")}
                alt="差分对雷达的规则管理界面，可勾选网络并批量应用规则"
                width="1000"
                height="647"
                loading="lazy"
              />
            </div>
            <figcaption>
              公开功能截图：按照规则识别候选线路组合，在表格中确认后批量应用。
            </figcaption>
          </figure>
        </article>

        <article className="work-tool-case" data-tool="fpc-workshop">
          <div className="work-tool-copy">
            <div className="project-meta">
              <span>02</span>
              <span>个人工具实验</span>
              <span>专业知识工具化</span>
            </div>
            <h2>FPC 工坊</h2>
            <p className="work-tool-plain">
              FPC
              是可以弯折的电路板，但金手指（连接器接触区域）等位置仍常需补强。材料与厚度需要结合具体设计与制造要求判断。
            </p>

            <dl className="work-tool-story">
              <div>
                <dt>解决什么问题</dt>
                <dd>
                  把分散的压
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
                <dd className="work-tool-links">
                  <a
                    className="text-link"
                    href="https://jlc-ext.com/item/oshwhub/fpc-workshop"
                    target="_blank"
                    rel="noreferrer"
                  >
                    扩展页面 <ExternalArrow />
                  </a>
                  <a
                    className="text-link"
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

            <p className="work-tool-caution">
              计算结果用于前期辅助判断，最终以项目叠层、连接器要求和板厂工艺规范为准。
            </p>
          </div>

          <div className="work-tool-evidence-grid">
            <figure className="work-tool-evidence">
              <img
                src={withBasePath("/images/fpc-pad-tool.png")}
                alt="FPC 工坊压 PAD 工具，用截面图和顶视图展示处理前后差异"
                width="1004"
                height="730"
                loading="lazy"
              />
              <figcaption>
                公开功能截图：用截面与顶视图解释压 PAD 前后的工艺变化。
              </figcaption>
            </figure>
            <figure className="work-tool-evidence">
              <img
                src={withBasePath("/images/fpc-stiffener-calculator.png")}
                alt="FPC 工坊 PI 补强计算器，显示材料截面、补强厚度估算和应用选项"
                width="997"
                height="735"
                loading="lazy"
              />
              <figcaption>
                公开功能截图：计算补强厚度、展示材料截面，并把建议应用到目标区域。
              </figcaption>
            </figure>
          </div>
        </article>
      </section>

      <section className="contact-cta section">
        <p className="eyebrow">保持联系</p>
        <h2>如果你也在处理复杂工具、工程协作或 AI 落地，欢迎和我交流。</h2>
        <div className="contact-actions">
          <a className="button button-primary" href="mailto:2711180012@qq.com">
            2711180012@qq.com <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </SiteChrome>
  );
}
