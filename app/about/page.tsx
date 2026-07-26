import type { Metadata } from "next";
import {
  ExternalArrow,
  SectionHeading,
  SiteChrome,
} from "../components/site-chrome";
import { withBasePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "关于",
  description: "认识 Ocean：从测试、嵌入式研发到 PCB / EDA 产品，以及正在进行的 AI 与 Agent 探索。",
};

const perspectives = [
  {
    number: "01",
    title: "测试：先找到事实",
    body: "测试经历让我习惯从现象回到真实路径：问题在什么条件下发生，影响谁，证据是什么。面对模糊反馈时，我会先缩小问题，再讨论解法。",
  },
  {
    number: "02",
    title: "研发：理解系统怎样工作",
    body: "嵌入式研发经历让我更在意约束、边界和实现成本。做产品时，我希望和工程师讨论同一个问题，而不是只把需求文档交出去。",
  },
  {
    number: "03",
    title: "产品：让不同视角走向同一个结果",
    body: "产品工作让我把用户、业务与技术放进同一张图里。我的职责不是制造更多流程，而是帮助团队形成判断，并把方案推到真正可用。",
  },
] as const;

export default function AboutPage() {
  return (
    <SiteChrome currentPath="/about">
      <header className="about-hero section">
        <div className="about-hero-copy">
          <p className="eyebrow">About / 关于</p>
          <h1>我喜欢先弄懂一件事怎样运转，再决定产品应该怎样工作。</h1>
          <p>
            我是 Ocean，一名专注 PCB / EDA
            的产品经理。测试、研发与产品三个视角，让我能在复杂工程场景里保持具体，也愿意对每个判断问一句“为什么”。
          </p>
        </div>
        <figure className="about-portrait">
          <img
            src={withBasePath("/images/ocean-pixel-portrait-v1.png")}
            alt="Ocean 的像素插画肖像"
            width="1254"
            height="1254"
          />
          <figcaption>Ocean · Product Manager</figcaption>
        </figure>
      </header>

      <section className="story section">
        <SectionHeading
          eyebrow="三个视角"
          title="经历不是一条时间线，而是我看问题的方式。"
        />
        <div className="perspective-list">
          {perspectives.map((item) => (
            <article className="perspective-item" key={item.number}>
              <p className="perspective-number">{item.number}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="current-work section">
        <div className="current-work-heading">
          <p className="eyebrow">现在的工作</p>
          <h2>把 PCB 工程师面对的专业问题，转成清晰、可落地的产品方案。</h2>
        </div>
        <div className="current-work-copy">
          <p>
            我目前负责嘉立创 EDA 专业版部分 PCB
            功能的产品设计。工作从理解真实任务开始，经过需求定义、方案评审与协作落地，最终回到用户能否更顺畅地完成设计。
          </p>
          <a
            className="text-link"
            href="https://pro.lceda.cn/editor"
            target="_blank"
            rel="noreferrer"
          >
            查看嘉立创 EDA 专业版 <ExternalArrow />
          </a>
        </div>
      </section>

      <section className="principles section">
        <SectionHeading eyebrow="做事方式" title="清楚，比显得复杂更重要。" />
        <div className="principle-grid">
          <article>
            <span aria-hidden="true">01</span>
            <h3>理解问题</h3>
            <p>先找到真实用户、任务与约束，不急着把一段描述写成功能。</p>
          </article>
          <article>
            <span aria-hidden="true">02</span>
            <h3>对齐认知</h3>
            <p>把模糊讨论变成可以共同验证的事实、取舍和边界。</p>
          </article>
          <article>
            <span aria-hidden="true">03</span>
            <h3>推动落地</h3>
            <p>方案不是终点。持续跟进实现与反馈，直到它能解决实际问题。</p>
          </article>
        </div>
      </section>

      <section className="exploration section">
        <div className="exploration-intro">
          <p className="eyebrow">正在探索</p>
          <h2>AI 与 Agent，不急着给答案。</h2>
        </div>
        <div className="exploration-copy">
          <p>
            我正在搭建适合自己的 Agent
            协作方式，并尝试用 AI 跨过产品想法与可用作品之间的距离。现在更像一间持续工作的实验室：保留有效方法，也公开面对失败和边界。
          </p>
          <p>
            等真正可见的项目与文章出现后，它们会进入作品和笔记；在那之前，这里只如实说明我正在研究什么。
          </p>
        </div>
      </section>

      <section className="personal-side section">
        <p className="eyebrow">工作之外</p>
        <div>
          <h2>摄影教我观察，3D 打印让我动手。</h2>
          <p>
            我喜欢在取景时决定什么该留下，也喜欢看一个数字模型经过反复调整后变成真实物件。它们都提醒我：好的结果，往往来自很多次克制的小判断。
          </p>
        </div>
      </section>

      <section className="contact-cta section">
        <p className="eyebrow">保持联系</p>
        <h2>有复杂产品、EDA 工具或 AI 实验想交流？欢迎给我写信。</h2>
        <div className="contact-actions">
          <a className="button button-primary" href="mailto:2711180012@qq.com">
            2711180012@qq.com <span aria-hidden="true">↗</span>
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
