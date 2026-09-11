import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

function requireElement(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Postprocessing experiment DOM is missing ${selector}`);
  }
  return element;
}

const stage = requireElement("#stage");
const status = requireElement("#status");

const useComposer =
  new URLSearchParams(window.location.search).get("engine") === "composer";
const renderer = new WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.domElement.setAttribute("aria-hidden", "true");
stage.append(renderer.domElement);

const scene = new Scene();
const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 2;
const pointer = new Vector2(-2, -2);
const revealShader = {
  uniforms: {
    tDiffuse: { value: null },
    uPointer: { value: pointer },
  },
  vertexShader:
    "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader:
    "uniform sampler2D tDiffuse;uniform vec2 uPointer;varying vec2 vUv;void main(){float m=1.0-smoothstep(0.105,0.16,distance(vUv,uPointer));vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=vec4(mix(c.rgb,vec3(1.0,.48,.24),m*.55),1.0);}",
};
const material = useComposer
  ? new MeshBasicMaterial({ color: "#0c3a34" })
  : new ShaderMaterial({
      uniforms: { uPointer: { value: pointer } },
      vertexShader: revealShader.vertexShader,
      fragmentShader:
        "uniform vec2 uPointer;varying vec2 vUv;void main(){float m=1.0-smoothstep(0.105,0.16,distance(vUv,uPointer));gl_FragColor=vec4(mix(vec3(.047,.227,.204),vec3(1.0,.48,.24),m),1.0);}",
    });
scene.add(new Mesh(new PlaneGeometry(1.5, 1.5), material));

let composer: EffectComposer | null = null;

function resize() {
  const { width, height } = stage.getBoundingClientRect();
  renderer.setSize(width, height, false);
  composer?.setSize(width, height);
}

function render() {
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

stage.addEventListener("pointermove", (event) => {
  const rect = stage.getBoundingClientRect();
  pointer.set(
    (event.clientX - rect.left) / rect.width,
    1 - (event.clientY - rect.top) / rect.height,
  );
  render();
});
new ResizeObserver(() => {
  resize();
  render();
}).observe(stage);

async function start() {
  if (useComposer) {
    const [{ EffectComposer }, { RenderPass }, { ShaderPass }] =
      await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/ShaderPass.js"),
      ]);
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new ShaderPass(revealShader));
  }
  resize();
  render();
  status.textContent = useComposer
    ? "EFFECT COMPOSER · full-resolution pass"
    : "MATERIAL SHADER · default baseline";
  (
    window as Window & { __POSTPROCESS_EXPERIMENT__?: unknown }
  ).__POSTPROCESS_EXPERIMENT__ = {
    engine: useComposer ? "effect-composer" : "material-shader",
    dpr: renderer.getPixelRatio(),
  };
}

void start();
