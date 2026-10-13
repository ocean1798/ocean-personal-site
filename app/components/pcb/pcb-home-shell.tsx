"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { withBasePath } from "../../lib/site-path";
import { initPcbHome } from "../pcb-home-runtime.js";

/** Fixed PCB canvas background + client behaviour for the home page. */
export function PcbHomeShell({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    return initPcbHome(rootRef.current, withBasePath("/pcb-data"));
  }, []);

  return (
    <div className="pcb" ref={rootRef}>
      <canvas id="pcb" className="wait" aria-hidden="true"></canvas>
      <div id="pcb-load" aria-hidden="true">
        <i></i>正在加载电路板
      </div>
      <div className="vignette" aria-hidden="true"></div>
      <div className="hero-keepout" aria-hidden="true"></div>
      <div id="net-label" aria-hidden="true"></div>
      <div className="noise" aria-hidden="true"></div>
      <div className="wrap">{children}</div>
    </div>
  );
}
