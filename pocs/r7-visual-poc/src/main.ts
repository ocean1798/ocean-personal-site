import {
  getPreferredExperienceMode,
  isStaticMode,
  setStaticReadingPreference,
  type ExperienceMode,
} from "./hero/experience-mode";

type SceneController = {
  dispose: () => void;
  getMetrics: () => Record<string, number | string>;
  requestContextLoss: () => void;
};

type PocDebugState = {
  mode: ExperienceMode;
  metrics: Record<string, number | string>;
  loseContext?: () => void;
};

function requireElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`R7 PoC DOM contract is missing ${selector}`);
  }
  return element;
}

const root = document.documentElement;
const stage = requireElement<HTMLElement>("#visual-stage");
const status = requireElement<HTMLElement>("#visual-status");
const staticState = requireElement<HTMLElement>("#static-reading-state");
const staticToggle = requireElement<HTMLButtonElement>(
  "#static-reading-toggle",
);

let activeScene: SceneController | null = null;
let currentMode = getPreferredExperienceMode();
let loadSequence = 0;

const debugWindow = window as Window & { __R7_POC__?: PocDebugState };

function publishState(metrics: Record<string, number | string> = {}) {
  debugWindow.__R7_POC__ = {
    mode: currentMode,
    metrics,
    loseContext: activeScene
      ? () => activeScene?.requestContextLoss()
      : undefined,
  };
}

function renderMode(mode: ExperienceMode, message: string) {
  currentMode = mode;
  root.dataset.experience = mode;
  status.textContent = message;
  const staticReading = isStaticMode(mode);
  staticToggle.setAttribute("aria-pressed", String(staticReading));
  staticState.textContent = staticReading ? "已开启" : "未开启";
  publishState(activeScene?.getMetrics());
}

function stopScene(mode: ExperienceMode, message: string) {
  loadSequence += 1;
  activeScene?.dispose();
  activeScene = null;
  delete root.dataset.sceneReady;
  renderMode(mode, message);
}

async function startEnhancedScene() {
  stopScene("enhanced", "静态首屏已就绪，正在准备可撤销增强");
  const sequence = ++loadSequence;

  try {
    const { mountOceanScene } = await import("./hero/ocean-scene");

    if (sequence !== loadSequence) {
      return;
    }

    activeScene = mountOceanScene(stage, {
      onReady: () => {
        root.dataset.sceneReady = "true";
        renderMode("enhanced", "桌面增强已就绪；正文与链接保持原生 DOM");
      },
      onContextLost: () => {
        stopScene("no-webgl", "视觉增强已停止，继续使用静态阅读");
      },
    });
    publishState(activeScene.getMetrics());
  } catch (error) {
    console.error("R7 visual enhancement could not start", error);
    stopScene("no-webgl", "视觉增强不可用，继续使用静态阅读");
  }
}

function scheduleEnhancement() {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => void startEnhancedScene(), {
      timeout: 900,
    });
    return;
  }

  globalThis.setTimeout(() => void startEnhancedScene(), 0);
}

root.dataset.experience = currentMode;
staticToggle.hidden = false;
staticToggle.addEventListener("click", () => {
  if (currentMode === "enhanced") {
    setStaticReadingPreference("static");
    stopScene("static", "静态阅读已开启；身份、主张与入口保持完整");
    return;
  }

  setStaticReadingPreference("enhanced");
  void startEnhancedScene();
});

window
  .matchMedia("(prefers-reduced-motion: reduce)")
  .addEventListener("change", (event) => {
    if (event.matches) {
      stopScene("reduced", "系统要求减少动态，已使用静态阅读");
    }
  });

window.matchMedia("(max-width: 860px)").addEventListener("change", (event) => {
  if (event.matches) {
    stopScene("mobile", "手机默认使用轻量静态首屏");
  }
});

if (currentMode === "enhanced") {
  scheduleEnhancement();
} else {
  renderMode(currentMode, "当前环境使用轻量静态首屏");
}
