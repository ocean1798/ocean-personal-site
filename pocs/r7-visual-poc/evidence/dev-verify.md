# R7 PoC dev-verify

权限敏感验证已全部成功，当前状态为 `ready-for-test`：nested 依赖可按锁文件重建，静态检查、契约测试、主样机与四个独立实验均可构建，gzip 证据可重新生成。浏览器、FPS、键盘与降级运行态不在本轮执行范围，仍由 test 独立验证。

## Subject 与范围

- REQ：`REQ-R7 v1.1`
- 设计：`R7-视觉系统与交互首屏样机规格 v1.0`
- branch：`codex/r7-visual-poc`
- HEAD / base：`71a99c83918ef9f2a5730a2353ef9ec41ede723a`
- 写入范围：仅 `pocs/r7-visual-poc/**`
- 本轮动作：仅安装、构建、检查、测量并更新本证据；没有改功能、没有启动 server 或浏览器、没有提交、推送或部署。

## 实际命令与退出码

执行目录：

```text
E:\Users\27111\Desktop\Project\Agent_V3\dev\projects\20260725-个人网站\pocs\r7-visual-poc
```

| 顺序 | 命令 | exitCode | 实际结果 |
|---:|---|---:|---|
| 1 | `npm ci` | 0 | 按 nested lockfile 安装 177 packages |
| 2 | `npm run verify` | 0 | typecheck、lint、4/4 tests、主样机与四实验 build、measure 全部完成 |
| 3a | `npm run build:three` | 0 | 独立 Three 实验重建成功 |
| 3b | `npm run build:r3f` | 0 | 独立 R3F 实验重建成功 |
| 3c | `npm run build:lenis` | 0 | 独立 Lenis 实验重建成功 |
| 3d | `npm run build:postprocessing` | 0 | 独立材质 Shader / EffectComposer 实验重建成功 |
| 4 | `npm run measure` | 0 | 更新 `evidence/generated/bundle-sizes.json` |

`package.json` 没有 `build:experiments`，因此按任务要求逐项执行现有四个实验构建脚本。Vite 对大于 500 kB raw 的 chunk 给出优化提示；它不是构建错误，采用判断使用下述 gzip 口径。

## verify 细项

| 检查 | 结果 |
|---|---|
| TypeScript `tsc --noEmit` | PASS，exit 0 |
| ESLint | PASS，exit 0，0 error / 0 warning |
| Node contract tests | PASS，4 pass / 0 fail |
| 主样机 build | PASS，exit 0 |
| Three / R3F / Lenis / postprocessing build | PASS，四项均 exit 0 |
| 海报生成 | PASS，六个 AVIF/WebP 文件均低于规格预算 |
| gzip 报告 | PASS，生成时间 `2026-08-09T13:17:47.299Z` |

## 最新体积证据

统一口径：对 emitted JS/CSS 使用 Node `gzipSync` level 9。

| 入口 | gzip bytes | gzip KiB | 说明 |
|---|---:|---:|---|
| 主样机全部 JS/CSS | 137,655 | 134.43 | DOM 首包与异步增强合计 |
| 主样机异步 WebGL chunk | 132,021 | 128.93 | 低于 409,600 B 预算 |
| 直接 Three 独立实验 | 133,250 | 130.13 | 采用基线 |
| R3F 等价最小实验 | 292,393 | 285.54 | 比直接 Three 多 159,143 B / 155.41 KiB |
| Lenis 最小实验 | 6,537 | 6.38 | 仍未证明首屏需要平滑滚动 |
| 后处理实验 | 132,038 | 128.94 | Composer 相关异步 chunks 合计 2,643 B；视觉收益未证明 |

海报：desktop initial AVIF 10,446 B / WebP 18,814 B；desktop formed AVIF 10,814 B / WebP 19,224 B；mobile AVIF 4,440 B / WebP 6,050 B。

## Decision

结论保持不变：

- Three.js：`adopt`，主样机只采用直接 Three.js。
- R3F：`reject`，等价最小场景增加 155.41 KiB gzip，未证明生命周期收益足以抵消成本。
- Lenis：`reject`，当前首屏没有必须引入惯性滚动的叙事收益，保留原生锚点、历史和键盘行为。
- 后处理：`reject`，材质内 Shader 已覆盖局部揭层目标，没有运行证据证明 Composer 的额外 render target 与生命周期值得接入。

`evidence/decisions/*.md` 中既有 adopt / reject 结论不变；其中先前记录的 EPERM 是历史失败轮次，本文件的 2026-08-09 权限敏感复跑结果为当前退出码事实。

## AC 覆盖与未测

| 范围 | 状态 | 证据边界 |
|---|---|---|
| AC-006、007、009、010、015、016 | PASS（dev 静态/构建层） | DOM/no-script 契约、五贴纸数量、PoC 隔离、四实验独立输出、gzip 预算均有自动检查或构建证据 |
| AC-011～014 | PASS（dependency decision 层） | 四项均有独立入口、构建与体积；仅 Three adopt，其余未接入主样机 |
| AC-001～005、008、017～025 | 未由本轮运行态验证 | 视觉冷读、手机、reduced/noWebGL、Shader 作用域、FPS、DPR、键盘、200% 缩放、高对比与 context lost 交给 test 独立执行 |
| AC-026～031 | 不由本次 dev 命令关闭 | 仍需冻结 subject、test、review、Ocean 确认与 lead 关闭 |

## Ready 状态

`ready-for-test`。

理由：本轮指定的四条权限敏感验证链全部 exit 0，当前源码和生成证据能够从 nested lockfile 重建。这个状态只表示 dev 静态与构建层已就绪，不代表浏览器验收、test acceptance、独立 review 或 R7 整体 PASS。
