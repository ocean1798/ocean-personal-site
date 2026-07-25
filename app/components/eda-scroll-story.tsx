"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

const constraints = [
  {
    name: "接口",
    explanation: "要接入哪些设备、提供哪些能力",
  },
  {
    name: "连接",
    explanation: "元件和网络应该怎样相连",
  },
  {
    name: "信号",
    explanation: "高速信号怎样稳定传输",
  },
  {
    name: "电源",
    explanation: "不同器件怎样得到合适供电",
  },
  {
    name: "空间",
    explanation: "接口、元件和线路怎样放进有限板面",
  },
  {
    name: "制造",
    explanation: "设计怎样完成检查并交给工厂生产",
  },
] as const;

const storySteps = [
  {
    number: "01",
    title: "熟悉目标",
    body: "目标很直观：用一根 USB-C 线，把需要的设备连接起来。",
  },
  {
    number: "02",
    title: "工程约束",
    body: "工程师要同时权衡接口、连接、信号、电源、空间和制造；它们彼此影响，没有一个按钮能自动给出正确答案。",
  },
  {
    number: "03",
    title: "连接",
    body: "工程师借助 EDA 梳理元件和网络关系，让连接可见、可编辑、可检查。",
  },
  {
    number: "04",
    title: "布局",
    body: "EDA 提供设计画布和工具，工程师结合信号、电源、结构与制造要求作出布局和布线判断。",
  },
  {
    number: "05",
    title: "规则检查",
    body: "规则检查帮助工程师更早发现冲突；提示是判断线索，不是替工程师作决定。",
  },
  {
    number: "06",
    title: "制造交付",
    body: "工程师确认设计后，才生成制造文件并进入生产；最终电路板回到通用扩展坞，熟悉目标成为可交付成品。",
  },
] as const;

type StoryStep = (typeof storySteps)[number];

function StoryCopy({
  step,
  includeConstraintDetails = false,
}: {
  step: StoryStep;
  includeConstraintDetails?: boolean;
}) {
  return (
    <div className="eda-story-copy">
      <p className="eda-story-step-label">
        <span>{step.number}</span>
        设计过程
      </p>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      {step.number === "05" ? (
        <p className="eda-story-team-note">
          嘉立创 EDA 专业版由团队共同完成；Ocean 负责其中部分 PCB
          功能的产品设计，与研发、测试共同推进落地。
        </p>
      ) : null}
      {includeConstraintDetails ? (
        <ul className="eda-constraint-details">
          {constraints.map((constraint) => (
            <li key={constraint.name}>
              <strong>{constraint.name}</strong>
              <span>{constraint.explanation}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DockShell({ boardInstalled = false }: { boardInstalled?: boolean }) {
  return (
    <div className={`dock-shell${boardInstalled ? " has-board" : ""}`}>
      <div className="dock-cable">
        <i />
        <span>USB-C</span>
      </div>
      <div className="dock-body">
        <div className="dock-board-window">
          <div className="dock-board-mini">
            <i className="dock-mini-chip" />
            <i className="dock-mini-trace dock-mini-trace-a" />
            <i className="dock-mini-trace dock-mini-trace-b" />
          </div>
        </div>
        <div className="dock-port dock-port-a" />
        <div className="dock-port dock-port-b" />
        <div className="dock-port dock-port-c" />
        <div className="dock-status-light" />
      </div>
    </div>
  );
}

function PcbBoard({ showIssues = false }: { showIssues?: boolean }) {
  return (
    <div className={`pcb-board${showIssues ? " has-issues" : ""}`}>
      <span className="pcb-mount pcb-mount-a" />
      <span className="pcb-mount pcb-mount-b" />
      <span className="pcb-mount pcb-mount-c" />
      <span className="pcb-mount pcb-mount-d" />
      <span className="pcb-chip pcb-chip-main">控制</span>
      <span className="pcb-chip pcb-chip-power">电源</span>
      <span className="pcb-pad pcb-pad-a">USB-C</span>
      <span className="pcb-pad pcb-pad-b">显示</span>
      <span className="pcb-pad pcb-pad-c">存储</span>
      <i className="pcb-trace pcb-trace-a" />
      <i className="pcb-trace pcb-trace-b" />
      <i className="pcb-trace pcb-trace-c" />
      <i className="pcb-trace pcb-trace-d" />
      {showIssues ? (
        <>
          <b className="pcb-issue pcb-issue-a">1</b>
          <b className="pcb-issue pcb-issue-b">2</b>
          <b className="pcb-issue pcb-issue-c">3</b>
        </>
      ) : null}
    </div>
  );
}

function DockVisual({ step }: { step: number }) {
  return (
    <div className="dock-story-visual-frame">
      <div className={`dock-story-visual dock-story-visual-${step}`}>
        <div className="dock-story-canvas">
          <DockShell boardInstalled={step === 6} />

          {step === 1 ? (
            <div className="dock-targets">
              <span>显示器</span>
              <span>存储设备</span>
              <span>电源</span>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="dock-constraint-cloud">
              {constraints.map((constraint) => (
                <span key={constraint.name}>
                  <strong>{constraint.name}</strong>
                  <small>{constraint.explanation}</small>
                </span>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="connection-map">
              <div className="connection-board-outline">
                <PcbBoard />
              </div>
              <span className="connection-node connection-node-input">
                USB-C 输入
              </span>
              <span className="connection-node connection-node-control">
                控制芯片
              </span>
              <span className="connection-node connection-node-display">
                显示输出
              </span>
              <span className="connection-node connection-node-storage">
                存储连接
              </span>
              <span className="connection-node connection-node-power">
                电源分配
              </span>
              <i className="connection-line connection-line-a" />
              <i className="connection-line connection-line-b" />
              <i className="connection-line connection-line-c" />
              <i className="connection-line connection-line-d" />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="pcb-layout">
              <PcbBoard />
              <div className="layout-toolbox">
                <span>放置元件</span>
                <span>安排线路</span>
                <span>保留间距</span>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="pcb-check">
              <PcbBoard showIssues />
              <div className="rule-result">
                <strong>规则检查</strong>
                <span>
                  <i>1</i> 间距需要确认
                </span>
                <span>
                  <i>2</i> 连接仍待核对
                </span>
                <span>
                  <i>3</i> 边界需要调整
                </span>
                <small>提示问题，决定仍由工程师完成</small>
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="delivery-flow">
              <div className="delivery-files">
                <span>板图</span>
                <span>钻孔</span>
                <span>装配资料</span>
              </div>
              <div className="delivery-board">
                <PcbBoard />
              </div>
              <i className="delivery-arrow">→</i>
            </div>
          ) : null}
        </div>
      </div>
      <p className="dock-story-caption">
        品牌中立 USB-C 扩展坞示意 · 非真实硬件项目
      </p>
    </div>
  );
}

export function EdaScrollStory() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const narrowViewport = window.matchMedia("(max-width: 680px)");
    const shortViewport = window.matchMedia("(max-height: 619px)");
    let frameRequest = 0;

    const render = () => {
      frameRequest = 0;

      if (
        reducedMotion.matches ||
        narrowViewport.matches ||
        shortViewport.matches
      ) {
        track.classList.remove("is-enhanced");
        track.removeAttribute("data-active-step");
        return;
      }

      track.classList.add("is-enhanced");

      const rect = track.getBoundingClientRect();
      const scrollableDistance = Math.max(rect.height - window.innerHeight, 1);
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / scrollableDistance),
      );
      const phase = progress * (storySteps.length - 1);
      const activeIndex = Math.min(
        storySteps.length - 1,
        Math.round(phase),
      );

      track.dataset.activeStep = String(activeIndex + 1);
      track.style.setProperty("--story-progress", String(progress));

      track
        .querySelectorAll<HTMLElement>(".eda-story-presentation")
        .forEach((presentation, index) => {
          const distance = Math.abs(phase - index);
          const opacity = Math.max(0, 1 - distance);
          const direction = index < phase ? -1 : 1;
          const shift = Math.min(distance, 1) * direction;

          presentation.style.setProperty(
            "--frame-opacity",
            opacity.toFixed(4),
          );
          presentation.style.setProperty("--step-shift", shift.toFixed(4));
          presentation.toggleAttribute(
            "data-current",
            index === activeIndex,
          );
        });

      track
        .querySelectorAll<HTMLElement>(".eda-story-progress-dots i")
        .forEach((dot, index) => {
          dot.toggleAttribute("data-current", index === activeIndex);
          dot.toggleAttribute("data-complete", index < activeIndex);
        });
    };

    const requestRender = () => {
      if (!frameRequest) {
        frameRequest = window.requestAnimationFrame(render);
      }
    };

    const mediaQueries = [reducedMotion, narrowViewport, shortViewport];

    render();
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);
    mediaQueries.forEach((query) =>
      query.addEventListener("change", requestRender),
    );

    return () => {
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      mediaQueries.forEach((query) =>
        query.removeEventListener("change", requestRender),
      );
      window.cancelAnimationFrame(frameRequest);
    };
  }, []);

  return (
    <div className="eda-story-track" ref={trackRef}>
      <ol className="eda-story-semantic-list">
        {storySteps.map((step, index) => (
          <li className="eda-story-static-card" key={step.number}>
            <StoryCopy
              step={step}
              includeConstraintDetails={index === 1}
            />
            <div className="eda-story-static-visual" aria-hidden="true">
              <DockVisual step={index + 1} />
            </div>
          </li>
        ))}
      </ol>

      <div className="eda-story-enhanced-stage" aria-hidden="true">
        <div className="eda-story-presentations">
          {storySteps.map((step, index) => (
            <section
              className="eda-story-presentation"
              key={step.number}
              style={
                {
                  "--frame-opacity": index === 0 ? 1 : 0,
                  "--step-shift": index === 0 ? 0 : 1,
                } as CSSProperties
              }
            >
              <StoryCopy
                step={step}
                includeConstraintDetails={index === 1}
              />
              <DockVisual step={index + 1} />
            </section>
          ))}
        </div>

        <div className="eda-story-progress">
          <span className="eda-story-progress-number">01</span>
          <div className="eda-story-progress-track">
            <span />
          </div>
          <div className="eda-story-progress-dots">
            {storySteps.map((step) => (
              <i key={step.number}>{step.number}</i>
            ))}
          </div>
          <span className="eda-story-progress-number">06</span>
        </div>
      </div>
    </div>
  );
}
