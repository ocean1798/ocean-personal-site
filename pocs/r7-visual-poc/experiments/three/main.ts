import { mountOceanScene } from "../../src/hero/ocean-scene";

const stage = document.querySelector<HTMLElement>("#stage");
const status = document.querySelector<HTMLElement>("#status");

if (!stage || !status) {
  throw new Error("Three experiment DOM is incomplete");
}

const controller = mountOceanScene(stage, {
  onReady: () => {
    status.textContent = "READY · one renderer / one context";
  },
  onContextLost: () => {
    status.textContent = "FALLBACK · context lost handled";
  },
});

(window as Window & { __THREE_EXPERIMENT__?: unknown }).__THREE_EXPERIMENT__ = {
  getMetrics: controller.getMetrics,
  loseContext: controller.requestContextLoss,
};

window.addEventListener("pagehide", controller.dispose, { once: true });
