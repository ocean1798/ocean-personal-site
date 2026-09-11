import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from "three";

import {
  createRibbonGeometry,
  LOOP_SEGMENTS,
  MORPH_START,
  sampleLoop,
  updateRibbonGeometry,
} from "./ocean-geometry";

type SceneOptions = {
  onReady: () => void;
  onContextLost: () => void;
};

const REVEAL_RADIUS_UV = 0.16;
const REVEAL_FEATHER_UV = 0.055;
const REVEAL_ENTER_MS = 140;
const REVEAL_EXIT_MS = 360;
const MAX_DPR = 1.5;

const vertexShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec2 vScreenUv;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 clipPosition = projectionMatrix * viewPosition;
    vNormalView = normalize(normalMatrix * normal);
    vScreenUv = clipPosition.xy / clipPosition.w * 0.5 + 0.5;
    gl_Position = clipPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec2 uPointerUv;
  uniform float uReveal;
  uniform float uTime;
  uniform float uRadius;
  uniform float uFeather;
  varying vec3 vNormalView;
  varying vec2 vScreenUv;

  float edgeNoise(vec2 uv) {
    return sin(uv.x * 72.0 + uTime * 0.65) * sin(uv.y * 58.0 - uTime * 0.42) * 0.0025;
  }

  void main() {
    float distanceToPointer = distance(vScreenUv, uPointerUv) + edgeNoise(vScreenUv);
    float mask = 1.0 - smoothstep(uRadius - uFeather, uRadius, distanceToPointer);
    float revealMask = mask * uReveal;
    float diffuse = 0.58 + max(dot(normalize(vNormalView), normalize(vec3(-0.35, 0.5, 0.8))), 0.0) * 0.42;
    vec3 solder = vec3(0.047, 0.227, 0.204) * diffuse;
    float edge = (1.0 - smoothstep(0.0, 0.012, abs(distanceToPointer - uRadius))) * uReveal;
    vec3 color = mix(solder, vec3(0.463, 0.894, 0.827), edge * 0.72);
    float alpha = mix(0.78, 0.18, revealMask);
    gl_FragColor = vec4(color, alpha);
  }
`;

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

export function mountOceanScene(container: HTMLElement, options: SceneOptions) {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.tabIndex = -1;
  renderer.domElement.style.pointerEvents = "none";
  container.append(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.12, 5.2);
  camera.lookAt(0, 0, 0);

  const loop = new Group();
  loop.rotation.x = MathUtils.degToRad(4);
  loop.rotation.y = MathUtils.degToRad(-12);
  scene.add(loop);

  const solderMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uPointerUv: { value: new Vector2(-2, -2) },
      uReveal: { value: 0 },
      uTime: { value: 0 },
      uRadius: { value: REVEAL_RADIUS_UV },
      uFeather: { value: REVEAL_FEATHER_UV },
    },
    vertexShader,
    fragmentShader,
  });
  const solderGeometry = createRibbonGeometry(MORPH_START, {
    width: 0.34,
    thickness: 0.022,
  });
  const solder = new Mesh(solderGeometry, solderMaterial);
  solder.renderOrder = 3;
  loop.add(solder);

  const copperMaterial = new MeshStandardMaterial({
    color: new Color("#ff7a3d"),
    roughness: 0.3,
    metalness: 0.08,
  });
  const copperGeometries = [-0.07, 0.07].map((offset) =>
    createRibbonGeometry(MORPH_START, {
      width: 0.026,
      thickness: 0.008,
      normalOffset: offset,
      depthOffset: 0.018,
    }),
  );
  copperGeometries.forEach((geometry) => {
    const mesh = new Mesh(geometry, copperMaterial);
    mesh.renderOrder = 2;
    loop.add(mesh);
  });

  const viaMaterial = new MeshStandardMaterial({
    color: new Color("#ff7a3d"),
    roughness: 0.34,
    metalness: 0.16,
  });
  const viaGeometry = new TorusGeometry(0.036, 0.011, 8, 18);
  const viaCoreGeometry = new CylinderGeometry(0.018, 0.018, 0.018, 16);
  const viaGroups: Group[] = [];
  [0.18, 0.44, 0.7].forEach((_t) => {
    [-0.07, 0.07].forEach(() => {
      const via = new Group();
      const ring = new Mesh(viaGeometry, viaMaterial);
      const core = new Mesh(viaCoreGeometry, viaMaterial);
      core.rotation.x = Math.PI / 2;
      via.add(ring, core);
      viaGroups.push(via);
      loop.add(via);
    });
  });

  scene.add(new AmbientLight("#bce7d9", 0.42));
  const keyLight = new DirectionalLight("#fff1d2", 2.1);
  keyLight.position.set(-2.4, 3.1, 4.2);
  scene.add(keyLight);
  const rimLight = new DirectionalLight("#76e4d3", 1.55);
  rimLight.position.set(3.2, -1.4, 2.4);
  scene.add(rimLight);

  let disposed = false;
  let frameRequest = 0;
  let currentMorph = MORPH_START;
  let targetMorph = MORPH_START;
  let reveal = 0;
  let revealFrom = 0;
  let revealTarget = 0;
  let revealStartedAt = performance.now();
  let revealDuration = REVEAL_ENTER_MS;
  let lastFrameAt = performance.now();
  const frameIntervals: number[] = [];

  function updateViaPositions(morph: number) {
    const sample = sampleLoop(morph, LOOP_SEGMENTS);
    let viaIndex = 0;
    [0.18, 0.44, 0.7].forEach((t) => {
      const pointIndex = Math.round(t * LOOP_SEGMENTS);
      [-0.07, 0.07].forEach((offset) => {
        viaGroups[viaIndex]
          .position.copy(sample.points[pointIndex])
          .addScaledVector(sample.normals[pointIndex], offset)
          .addScaledVector(sample.binormals[pointIndex], 0.026);
        viaIndex += 1;
      });
    });
  }

  function updateMorph(morph: number) {
    updateRibbonGeometry(solderGeometry, morph);
    copperGeometries.forEach((geometry) =>
      updateRibbonGeometry(geometry, morph),
    );
    updateViaPositions(morph);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestFrame();
  }

  function requestFrame() {
    if (!frameRequest && !disposed) {
      frameRequest = window.requestAnimationFrame(renderFrame);
    }
  }

  function setRevealTarget(nextTarget: number) {
    if (nextTarget === revealTarget) {
      return;
    }
    revealFrom = reveal;
    revealTarget = nextTarget;
    revealStartedAt = performance.now();
    revealDuration = nextTarget > reveal ? REVEAL_ENTER_MS : REVEAL_EXIT_MS;
    requestFrame();
  }

  function renderFrame(now: number) {
    frameRequest = 0;
    const delta = Math.min(64, now - lastFrameAt);
    lastFrameAt = now;
    if (delta > 0) {
      frameIntervals.push(delta);
      if (frameIntervals.length > 180) {
        frameIntervals.shift();
      }
    }

    const revealProgress = Math.min(1, (now - revealStartedAt) / revealDuration);
    reveal = MathUtils.lerp(
      revealFrom,
      revealTarget,
      easeOutCubic(revealProgress),
    );
    solderMaterial.uniforms.uReveal.value = reveal;
    solderMaterial.uniforms.uTime.value = now / 1000;

    const morphAlpha = 1 - Math.exp(-delta / 72);
    const nextMorph = MathUtils.lerp(currentMorph, targetMorph, morphAlpha);
    const morphChanged = Math.abs(nextMorph - currentMorph) > 0.00005;
    if (morphChanged) {
      currentMorph = nextMorph;
      updateMorph(currentMorph);
    } else {
      currentMorph = targetMorph;
    }

    renderer.render(scene, camera);
    const revealChanging = revealProgress < 1;
    const morphChanging = Math.abs(currentMorph - targetMorph) > 0.0001;
    if (revealChanging || morphChanging || reveal > 0.001) {
      requestFrame();
    }
  }

  function onScroll() {
    const progress = MathUtils.clamp(window.scrollY / 360, 0, 1);
    targetMorph = MathUtils.lerp(MORPH_START, 1, progress);
    requestFrame();
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType === "touch") {
      setRevealTarget(0);
      return;
    }

    const rect = container.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const overInteractive = Boolean(
      hit?.closest("a, button, input, textarea, select, [contenteditable='true']"),
    );

    if (!inside || overInteractive) {
      setRevealTarget(0);
      return;
    }

    solderMaterial.uniforms.uPointerUv.value.set(
      (event.clientX - rect.left) / rect.width,
      1 - (event.clientY - rect.top) / rect.height,
    );
    setRevealTarget(1);
  }

  function onPointerLeave() {
    setRevealTarget(0);
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    options.onContextLost();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("blur", onPointerLeave);
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);

  updateMorph(MORPH_START);
  resize();
  onScroll();
  renderer.render(scene, camera);
  window.requestAnimationFrame(() => options.onReady());

  function getMetrics() {
    const averageInterval =
      frameIntervals.length > 0
        ? frameIntervals.reduce((sum, value) => sum + value, 0) /
          frameIntervals.length
        : 0;
    return {
      contexts: 1,
      dpr: renderer.getPixelRatio(),
      fps: averageInterval ? Math.round(1000 / averageInterval) : "pending",
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      morph: Number(currentMorph.toFixed(3)),
      reveal: Number(reveal.toFixed(3)),
      loopSegments: LOOP_SEGMENTS,
    };
  }

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    window.cancelAnimationFrame(frameRequest);
    resizeObserver.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("blur", onPointerLeave);
    document.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    solderGeometry.dispose();
    copperGeometries.forEach((geometry) => geometry.dispose());
    viaGeometry.dispose();
    viaCoreGeometry.dispose();
    solderMaterial.dispose();
    copperMaterial.dispose();
    viaMaterial.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return {
    dispose,
    getMetrics,
    requestContextLoss: () => {
      renderer.getContext().getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
