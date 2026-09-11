import { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";

import { createRibbonGeometry, MORPH_START } from "../../src/hero/ocean-geometry";

function requireElement(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`R3F experiment DOM is missing ${selector}`);
  }
  return element;
}

const status = requireElement("#status");
const rootElement = requireElement("#root");

function ContextLifecycle() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      status.textContent = "FALLBACK · context lost handled";
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    status.textContent = "READY · React lifecycle mounted";
    (
      window as Window & { __R3F_EXPERIMENT__?: Record<string, unknown> }
    ).__R3F_EXPERIMENT__ = {
      dpr: gl.getPixelRatio(),
      loseContext: () =>
        gl.getContext().getExtension("WEBGL_lose_context")?.loseContext(),
    };
    return () => canvas.removeEventListener("webglcontextlost", onContextLost);
  }, [gl]);

  return null;
}

function Loop() {
  const geometry = useMemo(
    () =>
      createRibbonGeometry(MORPH_START, {
        width: 0.34,
        thickness: 0.022,
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} rotation={[0.07, -0.21, 0]}>
      <meshStandardMaterial
        color="#0c3a34"
        roughness={0.48}
        transparent
        opacity={0.78}
      />
    </mesh>
  );
}

function Experiment() {
  return (
    <Canvas
      camera={{ fov: 34, position: [0, 0.12, 5.2] }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[-2.4, 3.1, 4.2]} intensity={2.1} />
      <Loop />
      <ContextLifecycle />
    </Canvas>
  );
}

createRoot(rootElement).render(<Experiment />);
