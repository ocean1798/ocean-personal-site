# R7 首屏隔离技术 PoC

这个 nested app 只验证 R7 首屏的静态首帧、可撤销 WebGL 增强和依赖取舍；它不接入正式网站，也不改变 Sites、Vinext、Next 或 GitHub Pages 配置。

## 本地运行

```text
npm install
npm run dev
```

主样机：`http://127.0.0.1:4177/`

可复现模式：

- `?mode=static`：静态阅读
- `?mode=reduced`：减少动态
- `?mode=mobile`：手机轻量状态
- `?mode=no-webgl`：无 WebGL 回退
- `?mode=enhanced`：强制桌面增强，用于受控测试

独立实验入口：

- `/experiments/three/`
- `/experiments/r3f/`
- `/experiments/lenis/`
- `/experiments/postprocessing/`

验证：

```text
npm run verify
```

证据与采用结论位于 `evidence/`。所有 Canvas 都是 `aria-hidden` 的装饰层，正文、身份、链接与状态均由 DOM 提供。
