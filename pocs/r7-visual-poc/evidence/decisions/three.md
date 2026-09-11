# Three.js 决策证据

- 假设：直接 Three.js 能以单 Canvas、单 WebGL context 实现 Ocean Loop 和材质内揭层 Shader，同时让 DOM 与海报先显示。
- 命令：`npm run build:main`；`npm run measure`。
- 本轮结果：两条命令均 exit 1。源码与海报生成已完成，Vite 在覆盖原实例留下的 `dist/main` 时因 Windows `EPERM` 停止；measure 在覆盖既有 JSON 时同因 `EPERM` 停止。本轮未获得新的动态 gzip。
- 可复核既有结果：`evidence/generated/bundle-sizes.json` 记录于 2026-08-09T13:01:51.347Z；主样机总 JS/CSS 为 137,655 B（134.43 KiB），其中异步 WebGL enhancement 为 132,021 B（128.93 KiB），低于 400 KiB。任务给出的 133.42 KiB 在当前文件中没有可核对原始记录，因此不冒充本轮实测。
- 生命周期：`src/hero/ocean-scene.ts` 由一个 controller 负责监听器、动画帧、geometry、material、renderer 和 Canvas 清理；`webglcontextlost` 回到海报与 DOM。
- 结论：`adopt`。采用范围仅为当前隔离 PoC 的直接 Three.js 路径；包体满足预算，且没有引入 React renderer 生命周期。

