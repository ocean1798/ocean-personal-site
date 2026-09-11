import Lenis from "lenis";

const status = document.querySelector<HTMLElement>("#status");
if (!status) {
  throw new Error("Lenis experiment DOM is incomplete");
}

const useLenis = new URLSearchParams(window.location.search).get("engine") === "lenis";
const lenis = useLenis
  ? new Lenis({
      autoRaf: true,
      anchors: true,
      smoothWheel: true,
    })
  : null;

history.scrollRestoration = "auto";
status.textContent = useLenis
  ? "LENIS · opt-in comparison"
  : "NATIVE · default baseline";

document.addEventListener("keydown", (event) => {
  if (["Home", "End", "PageUp", "PageDown", "ArrowUp", "ArrowDown"].includes(event.key)) {
    status.textContent = `${useLenis ? "LENIS" : "NATIVE"} · ${event.key} left to browser`;
  }
});

(window as Window & { __LENIS_EXPERIMENT__?: unknown }).__LENIS_EXPERIMENT__ = {
  engine: useLenis ? "lenis" : "native",
  preventsKeyboardDefault: false,
  historyRestoration: history.scrollRestoration,
};

window.addEventListener("pagehide", () => lenis?.destroy(), { once: true });
