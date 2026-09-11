import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  Euler,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RectAreaLight,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

const MODEL_NAME = "ocean-wordmark.glb";
const MODEL_URL = new URL("../../public/models/ocean-wordmark.glb", import.meta.url).href;
const MAX_DPR = 1.5;
const SCROLL_RANGE_PX = 360;
const REFERENCE_ASPECT = 1280 / 720;
const BASE_MODEL_SCALE = 0.86;
const MIN_ASPECT_FIT = 0.28;
const MODEL_CENTER_X_RATIO = 702.5 / 1280;
const MODEL_CENTER_Y_RATIO = 0.5;
const DEFAULT_ROTATION = new Euler(
  MathUtils.degToRad(-4),
  MathUtils.degToRad(-6),
  MathUtils.degToRad(-1),
);

type M1Mode =
  | "loading"
  | "enhanced"
  | "static"
  | "reduced"
  | "no-webgl"
  | "context-lost"
  | "error";

interface M1DebugState {
  ready: boolean;
  mode: M1Mode;
  modelName: string;
  meshNames: string[];
  materialType: "MeshPhysicalMaterial";
  drawCalls: number;
  triangles: number;
  parallax: {
    enabled: boolean;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
  };
  scrollRotation: {
    progress: number;
    x: number;
    y: number;
    z: number;
  };
  contextLossHook: {
    available: boolean;
    lose: () => boolean;
    restore: () => boolean;
  };
}

interface EnhancedController {
  setStaticReading: (enabled: boolean) => void;
}

declare global {
  interface Window {
    __R7_M1__: M1DebugState;
  }
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`M1 DOM contract is missing ${selector}`);
  return element;
}

const canvasLayer = requireElement<HTMLElement>("#m1-canvas-layer");
const interactionField = requireElement<HTMLElement>("#m1-interaction-field");
const staticToggle = requireElement<HTMLButtonElement>("#m1-static-toggle");
const status = requireElement<HTMLElement>("#m1-status");

const debugState: M1DebugState = {
  ready: false,
  mode: "loading",
  modelName: MODEL_NAME,
  meshNames: [],
  materialType: "MeshPhysicalMaterial",
  drawCalls: 0,
  triangles: 0,
  parallax: { enabled: false, x: 0, y: 0, targetX: 0, targetY: 0 },
  scrollRotation: { progress: 0, x: -4, y: -6, z: -1 },
  contextLossHook: {
    available: false,
    lose: () => false,
    restore: () => false,
  },
};

window.__R7_M1__ = debugState;

function setMode(mode: M1Mode, label: string): void {
  debugState.mode = mode;
  document.documentElement.dataset.m1Mode = mode;
  document.documentElement.dataset.m1Ready = String(debugState.ready);
  status.textContent = label;
}

function setToggleState(staticReading: boolean, loading = false): void {
  const label = loading ? "正在开启 3D" : staticReading ? "开启 3D" : "静态阅读";
  staticToggle.textContent = label;
  staticToggle.setAttribute("aria-label", label);
  staticToggle.setAttribute("aria-pressed", String(staticReading));
  staticToggle.toggleAttribute("aria-busy", loading);
  staticToggle.disabled = loading;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const staticViewport = window.matchMedia("(max-width: 900px), (max-height: 620px)").matches;
let enhancedController: EnhancedController | null = null;
let startPromise: Promise<boolean> | null = null;
let activeRuntimeCleanup: (() => void) | null = null;

function restoreOperableStaticFallback(mode: "no-webgl" | "error", label: string): void {
  debugState.ready = false;
  debugState.meshNames = [];
  debugState.drawCalls = 0;
  debugState.triangles = 0;
  setToggleState(true);
  setMode(mode, label);
}

async function ensureEnhancedScene(): Promise<boolean> {
  if (!startPromise) {
    startPromise = (async () => {
      try {
        return await startEnhancedScene();
      } catch {
        activeRuntimeCleanup?.();
        restoreOperableStaticFallback("error", "3D 初始化中断，已回到静态海报；可重试");
        return false;
      } finally {
        startPromise = null;
      }
    })();
  }
  return await startPromise;
}

staticToggle.addEventListener("click", () => {
  if (enhancedController) {
    const staticReading = staticToggle.getAttribute("aria-pressed") === "true";
    enhancedController.setStaticReading(!staticReading);
    return;
  }

  setToggleState(true, true);
  void ensureEnhancedScene();
});

if (reducedMotion || staticViewport) {
  setToggleState(true);
  setMode(
    reducedMotion ? "reduced" : "static",
    reducedMotion ? "减少动态效果：静态阅读" : "静态视口：静态阅读",
  );
} else {
  setToggleState(false, true);
  setMode("loading", "正在准备三维模型");
  void ensureEnhancedScene();
}

async function startEnhancedScene(): Promise<boolean> {
  let renderer: WebGLRenderer | null = null;
  let roomEnvironment: RoomEnvironment | null = null;
  let pmremGenerator: PMREMGenerator | null = null;
  let environmentTarget: ReturnType<PMREMGenerator["fromScene"]> | null = null;
  let glassMaterial: MeshPhysicalMaterial | null = null;
  let backdrop: ReturnType<typeof createSoftShadowBackdrop> | null = null;
  const modelMeshes: Mesh[] = [];
  let frameId = 0;
  let running = false;
  let staticReading = true;
  let contextAvailable = true;
  let controller: EnhancedController | null = null;
  let cleaned = false;
  let onPointerMove: ((event: PointerEvent) => void) | null = null;
  let onResize: (() => void) | null = null;
  let onContextLost: ((event: Event) => void) | null = null;
  let onContextRestored: (() => void) | null = null;

  const safely = (cleanup: () => void): void => {
    try {
      cleanup();
    } catch {
      // Cleanup is best-effort so one failing dispose cannot block the static fallback.
    }
  };

  const stopLoop = (): void => {
    running = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const cleanupRuntime = (): void => {
    if (cleaned) return;
    cleaned = true;
    stopLoop();
    contextAvailable = false;
    staticReading = true;

    if (onPointerMove) window.removeEventListener("pointermove", onPointerMove);
    if (onResize) window.removeEventListener("resize", onResize);
    if (renderer && onContextLost) {
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    }
    if (renderer && onContextRestored) {
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
    }

    for (const mesh of modelMeshes) safely(() => mesh.geometry.dispose());
    if (backdrop) {
      safely(() => backdrop?.geometry.dispose());
      safely(() => backdrop?.material.dispose());
    }
    if (glassMaterial) safely(() => glassMaterial?.dispose());
    if (environmentTarget) safely(() => environmentTarget?.dispose());
    if (pmremGenerator) safely(() => pmremGenerator?.dispose());
    if (roomEnvironment) safely(() => roomEnvironment?.dispose());
    if (renderer) {
      safely(() => renderer?.dispose());
      safely(() => renderer?.domElement.remove());
    }

    if (enhancedController === controller) enhancedController = null;
    if (activeRuntimeCleanup === cleanupRuntime) activeRuntimeCleanup = null;
    debugState.ready = false;
    debugState.meshNames = [];
    debugState.drawCalls = 0;
    debugState.triangles = 0;
    debugState.parallax = { enabled: false, x: 0, y: 0, targetX: 0, targetY: 0 };
    debugState.contextLossHook = {
      available: false,
      lose: () => false,
      restore: () => false,
    };
  };

  const failRuntime = (mode: "no-webgl" | "error", label: string): void => {
    cleanupRuntime();
    restoreOperableStaticFallback(mode, label);
  };

  activeRuntimeCleanup = cleanupRuntime;

  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const activeRenderer = renderer;
    activeRenderer.domElement.setAttribute("aria-hidden", "true");
    activeRenderer.domElement.tabIndex = -1;
    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    activeRenderer.setSize(window.innerWidth, window.innerHeight, false);
    activeRenderer.outputColorSpace = SRGBColorSpace;
    activeRenderer.toneMapping = ACESFilmicToneMapping;
    activeRenderer.toneMappingExposure = 0.96;
    activeRenderer.setClearColor(new Color("#070D55"), 0);
    activeRenderer.transmissionResolutionScale = 1;
    canvasLayer.querySelectorAll("canvas").forEach((canvas) => canvas.remove());
    canvasLayer.append(activeRenderer.domElement);

    const scene = new Scene();
    scene.background = null;
    const camera = new PerspectiveCamera(31, window.innerWidth / window.innerHeight, 0.1, 50);
    const cameraTarget = new Vector3(0.2, 0.08, 0);
    camera.position.set(0, 0, 11.1);
    camera.lookAt(cameraTarget);

    roomEnvironment = new RoomEnvironment();
    pmremGenerator = new PMREMGenerator(activeRenderer);
    environmentTarget = pmremGenerator.fromScene(roomEnvironment, 0.04);
    scene.environment = environmentTarget.texture;
    roomEnvironment.dispose();
    roomEnvironment = null;
    pmremGenerator.dispose();
    pmremGenerator = null;

    backdrop = createSoftShadowBackdrop();
    scene.add(backdrop);
    addLights(scene);

    glassMaterial = new MeshPhysicalMaterial({
      color: new Color("#3439D1"),
      roughness: 0.24,
      metalness: 0,
      transmission: 0.64,
      thickness: 0.62,
      ior: 1.45,
      dispersion: 0,
      attenuationColor: new Color("#232078"),
      attenuationDistance: 0.82,
      clearcoat: 0.22,
      clearcoatRoughness: 0.28,
      specularIntensity: 0.42,
      specularColor: new Color("#F7F8FF"),
      envMapIntensity: 0.38,
      emissive: new Color("#090D43"),
      emissiveIntensity: 0.04,
    });

    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    const modelRoot = gltf.scene;
    const expectedMeshName = "OCEAN";
    modelRoot.traverse((object) => {
      if (!(object instanceof Mesh) || object.name !== expectedMeshName) return;
      object.material = glassMaterial;
      object.renderOrder = 1;
      modelMeshes.push(object);
    });

    debugState.meshNames = modelMeshes.map((mesh) => mesh.name);
    if (debugState.meshNames.length !== 1) {
      throw new Error("M1 model mesh contract is incomplete");
    }

    const bounds = new Box3().setFromObject(modelRoot);
    const center = bounds.getCenter(new Vector3());
    const fitModelToViewport = (): void => {
      const aspectFit = MathUtils.clamp(
        camera.aspect / REFERENCE_ASPECT,
        MIN_ASPECT_FIT,
        1,
      );
      const scale = BASE_MODEL_SCALE * aspectFit;
      const cameraDistance = camera.position.distanceTo(cameraTarget);
      const verticalView =
        2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * cameraDistance;
      const horizontalView = verticalView * camera.aspect;
      const targetYPx = window.innerHeight * MODEL_CENTER_Y_RATIO;
      const targetWorldX =
        cameraTarget.x + (MODEL_CENTER_X_RATIO - 0.5) * horizontalView;
      const targetWorldY =
        cameraTarget.y + (0.5 - targetYPx / window.innerHeight) * verticalView;

      modelRoot.scale.setScalar(scale);
      modelRoot.position.set(
        targetWorldX - center.x * scale,
        targetWorldY - center.y * scale,
        -center.z * scale,
      );
    };
    fitModelToViewport();
    modelRoot.rotation.copy(DEFAULT_ROTATION);
    scene.add(modelRoot);

    const contextExtension = activeRenderer.getContext().getExtension("WEBGL_lose_context");
    debugState.contextLossHook = {
      available: Boolean(contextExtension),
      lose: () => {
        if (!contextExtension) return false;
        contextExtension.loseContext();
        return true;
      },
      restore: () => {
        if (!contextExtension) return false;
        contextExtension.restoreContext();
        return true;
      },
    };

    let pointerInside = false;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let previousTime = performance.now();

    const startLoop = (): void => {
      if (running || staticReading || !contextAvailable) return;
      running = true;
      previousTime = performance.now();
      frameId = requestAnimationFrame(renderFrame);
    };

    const updateStaticReading = (enabled: boolean): void => {
      if (!enabled && !contextAvailable) {
        stopLoop();
        staticReading = true;
        setToggleState(true);
        setMode("context-lost", "图形上下文尚未恢复，继续静态阅读");
        return;
      }
      staticReading = enabled;
      setToggleState(enabled);
      if (enabled) {
        stopLoop();
        setMode("static", "静态阅读已开启");
      } else {
        setMode("enhanced", "真实 3D 已就绪");
        startLoop();
      }
    };

    controller = { setStaticReading: updateStaticReading };
    enhancedController = controller;

    onPointerMove = (event) => {
      if (staticReading) return;
      const rect = interactionField.getBoundingClientRect();
      pointerInside =
        rect.width > 0 &&
        rect.height > 0 &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!pointerInside) {
        targetParallaxX = 0;
        targetParallaxY = 0;
        return;
      }
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetParallaxX = MathUtils.clamp(normalizedX, -1, 1);
      targetParallaxY = MathUtils.clamp(-normalizedY, -1, 1);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    onResize = () => {
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
      activeRenderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      fitModelToViewport();
    };
    window.addEventListener("resize", onResize);

    onContextLost = (event) => {
      event.preventDefault();
      contextAvailable = false;
      stopLoop();
      staticReading = true;
      debugState.ready = false;
      setToggleState(true);
      setMode("context-lost", "图形上下文已中断，已回到静态海报");
    };

    onContextRestored = () => {
      stopLoop();
      contextAvailable = true;
      staticReading = true;
      debugState.ready = true;
      setToggleState(true);
      setMode("static", "图形上下文已恢复；保持静态阅读，可手动开启 3D");
    };

    activeRenderer.domElement.addEventListener("webglcontextlost", onContextLost);
    activeRenderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    function renderFrame(time: number): void {
      if (!running || staticReading || !contextAvailable) {
        stopLoop();
        return;
      }
      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const smoothingMs = pointerInside ? 160 : 420;
      const smoothing = 1 - Math.exp((-deltaSeconds * 1000) / smoothingMs);
      parallaxX = MathUtils.lerp(parallaxX, targetParallaxX, smoothing);
      parallaxY = MathUtils.lerp(parallaxY, targetParallaxY, smoothing);

      const scrollProgress = MathUtils.clamp(window.scrollY / SCROLL_RANGE_PX, 0, 1);
      const rotationX = MathUtils.degToRad(MathUtils.lerp(-4, 1, scrollProgress) + parallaxY * 1.5);
      const rotationY = MathUtils.degToRad(MathUtils.lerp(-6, 4, scrollProgress) + parallaxX * 2.5);
      const rotationZ = MathUtils.degToRad(MathUtils.lerp(-1, 0, scrollProgress));
      modelRoot.rotation.set(
        MathUtils.clamp(rotationX, MathUtils.degToRad(-6), MathUtils.degToRad(3)),
        MathUtils.clamp(rotationY, MathUtils.degToRad(-10), MathUtils.degToRad(5)),
        rotationZ,
      );

      camera.position.x = parallaxX * 0.18;
      camera.position.y = parallaxY * 0.1;
      camera.lookAt(cameraTarget);
      try {
        activeRenderer.render(scene, camera);
      } catch {
        failRuntime("error", "3D 渲染中断，已回到静态海报；可重试");
        return;
      }

      debugState.drawCalls = activeRenderer.info.render.calls;
      debugState.triangles = activeRenderer.info.render.triangles;
      debugState.parallax = {
        enabled: pointerInside,
        x: Number(parallaxX.toFixed(4)),
        y: Number(parallaxY.toFixed(4)),
        targetX: Number(targetParallaxX.toFixed(4)),
        targetY: Number(targetParallaxY.toFixed(4)),
      };
      debugState.scrollRotation = {
        progress: Number(scrollProgress.toFixed(4)),
        x: Number(MathUtils.radToDeg(modelRoot.rotation.x).toFixed(2)),
        y: Number(MathUtils.radToDeg(modelRoot.rotation.y).toFixed(2)),
        z: Number(MathUtils.radToDeg(modelRoot.rotation.z).toFixed(2)),
      };
      frameId = requestAnimationFrame(renderFrame);
    }

    activeRenderer.render(scene, camera);
    debugState.drawCalls = activeRenderer.info.render.calls;
    debugState.triangles = activeRenderer.info.render.triangles;
    debugState.ready = true;
    staticReading = false;
    updateStaticReading(false);
    return true;
  } catch {
    const fallbackMode = renderer ? "error" : "no-webgl";
    failRuntime(
      fallbackMode,
      fallbackMode === "no-webgl"
        ? "当前环境无法开启 3D，继续静态阅读；可重试"
        : "3D 初始化失败，已回到静态海报；可重试",
    );
    return false;
  }
}

function createSoftShadowBackdrop(): Mesh<PlaneGeometry, ShaderMaterial> {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;

      void main() {
        vec2 centered = (vUv - vec2(0.52, 0.48)) / vec2(0.54, 0.42);
        float falloff = 1.0 - smoothstep(0.18, 1.0, length(centered));
        gl_FragColor = vec4(vec3(0.035294, 0.050980, 0.262745), falloff * 0.34);
      }
    `,
  });
  const backdrop = new Mesh(new PlaneGeometry(9.6, 3.8), material);
  backdrop.name = "soft-wordmark-shadow";
  backdrop.position.set(0.5, -0.12, -0.85);
  backdrop.renderOrder = 0;
  return backdrop;
}

function addLights(scene: Scene): void {
  RectAreaLightUniformsLib.init();
  const key = new RectAreaLight(0xf7f8ff, 3.2, 14, 3.4);
  key.position.set(-1.8, 4.8, 7.4);
  key.lookAt(0.4, 0, 0);
  scene.add(key);

  const rim = new PointLight(0x3439d1, 1.2, 18);
  rim.position.set(4.8, 2.4, -1.8);
  scene.add(rim);

  const fill = new PointLight(0x232078, 1, 18);
  fill.position.set(-4.2, -2.4, 4.6);
  scene.add(fill);
  scene.add(new AmbientLight(0xc3c9f2, 0.36));
}
