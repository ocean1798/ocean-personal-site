---
开发契约版本: "v3"
事务黑板: "lead/projects/20260725-个人网站/board.md"
REQ 路径: "[REQ-R7](product/projects/20260725-个人网站/output/requirements/REQ-R7.md)"
设计事实源: "REQ-R7@v1.0：`design/projects/20260725-个人网站/specs/R7-视觉系统与交互首屏样机规格.md`；判断预览：`design/projects/20260725-个人网站/assets/r7-visual-poc/desktop-enhanced-1440x900.svg`、`design/projects/20260725-个人网站/assets/r7-visual-poc/mobile-static-390x844.svg`、`design/projects/20260725-个人网站/assets/r7-visual-poc/four-state-overview.svg`"
技术设计或 ADR: "不适用：普通 PoC 实现；依赖结论见 pocs/r7-visual-poc/evidence/decisions/"
项目入口: "AGENTS.md"
代码目录: "dev/projects/20260725-个人网站/pocs/r7-visual-poc"
统一 verify: "cd dev/projects/20260725-个人网站/pocs/r7-visual-poc && npm ci && npm run verify"
当前 REQ-ID: "REQ-R7"
---

# 开发计划：REQ-R7 视觉系统与交互首屏样机

本计划把现有隔离 PoC 归入三个 DEV；当前仅完成构建层自证，尚不能正式交 test。

## 本轮边界

| 项 | 内容 |
|---|---|
| 本轮实现 | 本地可运行的 R7 首屏切片、四态与无障碍边界、四类依赖及性能证据。 |
| 本轮不实现 | 不接入正式首页，不部署，不生成 OG 图，不扩展首屏以外功能。 |
| 允许修改 | `dev/projects/20260725-个人网站/pocs/r7-visual-poc/**`、本计划、checkpoint 后的 `dev/projects/20260725-个人网站/evidence/REQ-R7/**`。 |
| 禁止修改 | `app/**`、根 `package*.json`、`next.config.ts`、全局 CSS、Pages workflow、公共 tests、`.openai/hosting.json`、Sites/Vinext 配置及其他共享热点。 |
| 待确认 | `无`；但 checkpoint、Design QA、formal dev-run、test/review 尚未完成。 |

## 开发任务

| DEV ID | 来源 R/AC/BUG | 主要结果 | 依赖 | planned files | 验证层 | 开发状态 |
|---|---|---|---|---|---|---|
| DEV-R7-001 | REQ-R7 / AC-001、AC-002、AC-007、AC-009、AC-010、AC-022、AC-023、AC-024 | 可运行首屏切片：DOM 首帧含确认文案，程序化 Ocean Loop、HUD、五贴纸和海报仅作增强；nested app 独立运行。 | REQ v1.1、设计规格 v1.0 | `pocs/r7-visual-poc/index.html; README.md; src/main.ts; src/styles.css; src/hero/ocean-geometry.ts; src/hero/ocean-scene.ts; scripts/generate-posters.mjs; public/posters/*` | contract, build, smoke | doing |
| DEV-R7-002 | REQ-R7 / AC-003、AC-004、AC-005、AC-006、AC-008、AC-018、AC-019、AC-020、AC-021、AC-025 | 四态与交互/无障碍：增强、静态、reduced、noWebGL/noJS/context lost 可读；移动端默认轻量；Canvas 不阻断链接、选择、键盘和原生滚动。 | DEV-R7-001 | `pocs/r7-visual-poc/index.html; src/main.ts; src/styles.css; src/hero/experience-mode.ts; src/hero/ocean-scene.ts; tests/contracts.test.mjs` | contract, accessibility-smoke | doing |
| DEV-R7-003 | REQ-R7 / AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-026、AC-027、AC-028、AC-029、AC-030、AC-031 | 四依赖与性能证据：直接 Three、R3F、Lenis、后处理独立实验；记录 gzip、Windows 基线、adopt/reject、Git 边界和回滚入口。 | DEV-R7-001、nested lockfile | `pocs/r7-visual-poc/package.json; package-lock.json; tsconfig.json; eslint.config.js; experiments/**; scripts/report-gzip.mjs; tests/contracts.test.mjs; evidence/**` | typecheck, lint, test, build, measure | doing |

三个 DEV 均保持 `doing`。已有实现不能代替冻结 checkpoint 后的正式 v3 自证。

## 验证安排

| 批次 ID | 阶段 | 触发时点 | 包含 DEV | 验证目标 | 命令/入口 | RUN_ID | 证据 | 结果 |
|---|---|---|---|---|---|---|---|---|
| DB-R7-001 | dev-check | nested PoC 已形成 | DEV-R7-001、DEV-R7-002、DEV-R7-003 | 安装、typecheck、lint、4 项测试、主样机与四实验构建、gzip 测量 | `npm ci`；`npm run verify` | 不适用 | 本表 | PASS |
| DB-R7-002 | dev-check | 独立实验已形成 | DEV-R7-003 | 逐项构建并测量 | `npm run build:three`；`npm run build:r3f`；`npm run build:lenis`；`npm run build:postprocessing`；`npm run measure` | 不适用 | 本表 | PASS |
| DB-R7-003 | dev-smoke | checkpoint 形成后 | DEV-R7-001、DEV-R7-002 | 验证桌面、手机、四态、键盘、缩放、FPS/DPR 与 context lost 的真实运行切片 | `manual-browser: http://127.0.0.1:4177/` | 待创建 | 待生成 | PENDING |
| DB-R7-004 | dev-verify | checkpoint 与 Design QA 后 | DEV-R7-001、DEV-R7-002、DEV-R7-003 | 生成正式 `dev-run.json` 并验证冻结 subject | 统一 verify | 待创建 | `evidence/REQ-R7/<RUN_ID>/dev-run.json` | PENDING |

## 实际变动与验证

| DEV ID | actual files | change summary | command/入口 | exitCode | RUN_ID | evidence | covered | uncovered / open issues |
|---|---|---|---|---:|---|---|---|---|
| DEV-R7-001 | `index.html; README.md; src/main.ts; src/styles.css; src/hero/ocean-geometry.ts; src/hero/ocean-scene.ts; scripts/generate-posters.mjs; public/posters/*` | DOM-first 首屏、程序化主视觉、五贴纸与海报已形成。 | `npm run build:main` | 0 | 不适用 | `evidence/dev-verify.md` | 构建与桌面有限 smoke | 视觉冷读、持续 FPS 待 Design QA/test |
| DEV-R7-002 | `index.html; src/main.ts; src/styles.css; src/hero/experience-mode.ts; src/hero/ocean-scene.ts; tests/contracts.test.mjs` | 已形成模式选择、静态偏好及 DOM/no-script 契约。 | `npm run test` | 0 | 不适用 | `evidence/dev-verify.md` | 4/4 contract tests | 四态、移动端、键盘、缩放、高对比、context lost 待 test |
| DEV-R7-003 | `package.json; package-lock.json; tsconfig.json; eslint.config.js; experiments/**; scripts/report-gzip.mjs; evidence/**` | 主样机 WebGL chunk 132,021 B gzip；Three adopt，R3F/Lenis/后处理 reject。 | `npm run verify` | 0 | 不适用 | `evidence/dev-verify.md; evidence/generated/bundle-sizes.json; evidence/decisions/**` | 静态检查、构建、体积与决策 | FPS/DPR 和正式 subject 未验证 |

## 流程纠正

实现先于 v3 计划和联合门禁，这是流程偏差。本次核对仅为追溯纠正，不能写成编码前已完成。

| 项 | 实际记录 |
|---|---|
| 命令 | `cd E:\Users\27111\Desktop\Project\Agent_V3` 后执行 `python .claude\tests\validate_dev_artifacts.py --plan dev\projects\20260725-个人网站\plans\REQ-R7-视觉系统与交互首屏样机-dev-plan.md --test-plan lead\projects\20260725-个人网站\test\plans\REQ-R7-视觉系统与交互首屏样机-test-plan.md --require-precode-ready` |
| exitCode | `1` |
| 原始结果 | `[FAIL] ... v3 dev-plan 必须位于 dev/projects/<项目>/plans/<REQ-ID>-dev-plan.md` |
| 处理 | 当前文件名不符合验证器要求的严格 `REQ-R7-dev-plan.md`，但指定门禁命令固定引用现路径，无法靠修改正文路径、字段或 AC→DEV 映射消除。已停止，不修改 REQ、test plan、验证器或功能，也不把本次结果记为事前 PASS。 |

### Canonical 联合门禁追溯（2026-08-09）

| 项 | 实际记录 |
|---|---|
| 命令 | `cd E:\Users\27111\Desktop\Project\Agent_V3` 后执行 `python .claude\tests\validate_dev_artifacts.py --plan dev\projects\20260725-个人网站\plans\REQ-R7-dev-plan.md --test-plan lead\projects\20260725-个人网站\test\plans\REQ-R7-test-plan.md --require-precode-ready` |
| exitCode | `1` |
| 结论 | `FAIL`，属于实现后的流程纠正核对，不是事前门禁结果；未复跑。 |
| 外部阻塞 | 开发路线门禁判定 R7 前置轮次 R4 未完成；同时判定 `REQ 路径` 未指向当前有效文件。两项不属于只改 dev-plan 字段/映射即可安全关闭的范围，按指令停止。 |
| dev-plan 自身问题 | 验证器同时指出：`设计事实源` 缺反引号/Markdown 路径；批次中的 `全部` 不是有效 DEV ID；已执行批次的结果、RUN_ID/证据格式无效；DEV-R7-002 未被有效批次覆盖。因同轮已命中外部阻塞，本轮不做部分修正。 |
| 未修改 | 未修改 REQ、test plan、board、功能代码或验证器。 |

### 修正后唯一复跑（2026-08-09）

| 项 | 实际记录 |
|---|---|
| 本轮修正 | 已确认 REQ 文件实际存在，并将 `REQ 路径`、`设计事实源` 改为验证器可解析的反引号路径；补齐全部 AC 前缀、显式 DEV 批次映射、合法结果值及 compact dev-check 记录。 |
| 命令 | `python .claude\tests\validate_dev_artifacts.py --plan dev\projects\20260725-个人网站\plans\REQ-R7-dev-plan.md --test-plan lead\projects\20260725-个人网站\test\plans\REQ-R7-test-plan.md --require-precode-ready` |
| exitCode | `1` |
| 新外部问题 | 验证器要求事务黑板在同一行记录 `REQ-R7` 的设计/UI 前置“适用”结论及已列设计产物；同时仍判定 `REQ 路径` 未指向当前有效文件。 |
| 处理 | 已达到最多一次复跑，并命中 board/当前有效 REQ 判定等外部事实源问题，立即停止；未修改 test plan、REQ、board、功能或验证器。 |

### 外部事实修正后再核对（2026-08-09）

| 项 | 实际记录 |
|---|---|
| 性质 | 前两次失败门禁修正后的复核，不记作实现前已完成。 |
| 命令 | `cd E:\Users\27111\Desktop\Project\Agent_V3` 后执行 `python .claude\tests\validate_dev_artifacts.py --plan dev\projects\20260725-个人网站\plans\REQ-R7-dev-plan.md --test-plan lead\projects\20260725-个人网站\test\plans\REQ-R7-test-plan.md --require-precode-ready` |
| exitCode | `1` |
| 完整 findings | `[FAIL] dev-artifacts: dev/projects/20260725-个人网站/plans/REQ-R7-dev-plan.md: 编码前联合核对要求 REQ 路径 指向当前有效文件`；`Summary: checked=1 FAIL=1`。 |
| 处理 | 按指令仅记录并报告，不修改功能、REQ、test plan、board 或验证器。 |

### REQ Markdown 链接修正后复核（2026-08-09）

| 项 | 实际记录 |
|---|---|
| 命令 | `python .claude\tests\validate_dev_artifacts.py --plan dev\projects\20260725-个人网站\plans\REQ-R7-dev-plan.md --test-plan lead\projects\20260725-个人网站\test\plans\REQ-R7-test-plan.md --require-precode-ready` |
| exitCode | `1` |
| findings | `[FAIL] dev-artifacts: lead/projects/20260725-个人网站/test/plans/REQ-R7-test-plan.md: dev/test 计划的 REQ 路径 必须指向同一文件`；`Summary: checked=1 FAIL=1`。 |
| 处理 | 仅记录结果；未修改其他内容。 |

### 联合前置门禁通过（2026-08-09）

| 项 | 实际记录 |
|---|---|
| 命令 | `python .claude\tests\validate_dev_artifacts.py --plan dev\projects\20260725-个人网站\plans\REQ-R7-dev-plan.md --test-plan lead\projects\20260725-个人网站\test\plans\REQ-R7-test-plan.md --require-precode-ready` |
| exitCode | `0` |
| findings | `[PASS] dev-artifacts: 1 个 v3 dev-plan/dev-run 通过对应检查`。 |
| 性质 | 外部事实与路径修正后的复核结果，仅记录当前一致性；不追溯写成实现前已完成。 |

## 交接摘要

| 项 | 内容 |
|---|---|
| v3 dev 自证 | 尚无；不得以 `pocs/r7-visual-poc/evidence/dev-verify.md` 冒充 formal dev-run。 |
| 未覆盖 / 开放问题 | 缺 checkpoint、Design QA、formal dev-run、test acceptance 与独立 review。 |
| Git 收口 | branch `codex/r7-visual-poc`；base/target `main@71a99c83918ef9f2a5730a2353ef9ec41ede723a`；未提交、未推送、未部署。 |
| test/review 重点 | AC 全链路、四态、手机、无障碍、context lost、FPS/DPR、gzip、原创资产及禁止路径。 |
| 交接结论 | `not-ready` |
