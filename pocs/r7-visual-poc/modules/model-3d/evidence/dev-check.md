# R7 M1 模型样机 dev-check

本记录只说明 M1 独立样机的开发级定向检查结果，不代表 Design QA、test-acceptance 或正式 R7 PASS。

## 当前结论

- M1 独立入口、原创 OCEAN GLB、海报回退、模块契约和定向构建已完成。
- 本轮经 Ocean 明确授权重写 M1 海报，`npm run assets:model-3d` 在必要权限下 exit `0`；GLB 前后 SHA-256 均为 `E8D61475833DF0C71DC7C87DB5F1E5D731543F5742F593E433B5693BBFC18147`，模型内容未变。
- 页面、动态 Canvas 和静态海报已统一为深靛蓝体系：页面/阴影 `#050719`、舞台 `#08123A`、模型正面 `#5267F0`、内部 `#38329A`、高光 `#F5F6FF`、正文 `#F1F3FF`、次级及眉题 `#AEB6D5`、按钮边框 `#5367F2`。青绿、cyan 和全光谱 RGB 色散已移除，边缘只保留蓝紫至白。
- 针对 O/C/E 正面融入背景的问题，key、rim、fill、ambient 和近白 Fresnel 只做小幅提升；模型结构、布局、交互和字体未变。
- 不重复生成资产的五项定向链中，typecheck、lint、4 项契约测试、build 和 measure 均为 exit `0`。
- 第二轮视觉平衡态保留缩小右移后的完整五字母，恢复较细较暗的背景网格，并在优先读出 OCEAN 的前提下保留字内网格偏折和克制的边缘 RGB。设计非正式结论：**可交 Ocean 第一轮判断机制但非正式 PASS**。
- 第二轮平衡态截图已保存为 `desktop-balanced-enhanced-1280x720.png` 与 `desktop-balanced-pointer-1280x720.png`。
- 此前 1280×720 独立浏览器检查已证明增强、指针、滚动、静态与 context-lost 机制可工作；这些 debug 数值属于视觉修正前的机制基线，不作为第二轮材质参数证据。

## 依赖与资产

| 项目 | 实际结果 |
| --- | --- |
| 字形包 | `three.regular.helvetiker@1.0.0`，已写入 nested `package.json` 与 lock；MIT 包 |
| GLB | `public/models/ocean-wordmark.glb`，O/C/E/A/N 五个命名网格，5,168 triangles，374,752 B，gzip 79,855 B |
| AVIF 海报 | `public/posters/model-3d-default.avif`，10,419 B |
| WebP 海报 | `public/posters/model-3d-default.webp`，11,732 B |
| 动态代码 | JS + CSS gzip 257,163 B |

资产由 `npm run assets:model-3d` 调用 `scripts/generate-model-3d.mjs` 生成，没有下载或复制参考站模型、Logo 或字形资产。

## 验证事实

| 命令或检查 | 结果 |
| --- | --- |
| `npm install` | exit 0；nested lock 已更新 |
| `npm run assets:model-3d` | exit 0；更新两种 M1 海报，GLB SHA-256 前后相同 |
| `npm run verify:model-3d` | 本轮未运行；已按要求逐项运行资产生成和五项定向检查，避免再次重复重写资产 |
| `npm run typecheck:model-3d` | exit 0 |
| `npm run lint:model-3d` | exit 0；脚本明确排除 `modules/model-3d/dist/**`，只检查模块源、生成/测量脚本和模块测试 |
| `npm run test:model-3d` | exit 0，4/4 tests |
| `npm run build:model-3d` | exit 0；Vite 有单个 JS chunk 超过 500 kB raw 的 warning |
| `npm run measure:model-3d` | exit 0；详见 `model-3d-sizes.json` |
| M1 URL 健康检查 | HTTP 200 |
| 第二轮视觉平衡态 | 已记录增强态与指针态截图；设计非正式结论为“可交 Ocean 第一轮判断机制但非正式 PASS” |
| 独立浏览器机制基线 | 完成；1280×720 下增强、指针、滚动、静态和 context-lost 路径均有历史运行证据，但不等同于第二轮正式 Design QA |

开发服务器由隐藏后台进程启动：launcher PID `47620`，listener PID `32316`。stdout/stderr 位于 `evidence/runtime/vite-4178-20260809-222633.*.log`。stderr 中只有 Vite 对 `/public/...` 开发路径的提示；开发态 `/public/...` 与 `/posters|models/...` 实测均返回 200，构建产物使用带 hash 的本地资产路径。

## 可见证据与边界

- 第二轮平衡增强态：`evidence/browser/desktop-balanced-enhanced-1280x720.png`
- 第二轮平衡指针态：`evidence/browser/desktop-balanced-pointer-1280x720.png`
- 增强态截图：`evidence/browser/desktop-enhanced-1280x720.png`
- 指针态截图：`evidence/browser/desktop-pointer-1280x720.png`
- 滚动态截图：`evidence/browser/desktop-scroll-1280x720.png`
- 静态态截图：`evidence/browser/desktop-static-1280x720.png`
- 体积证据：`evidence/model-3d-sizes.json`
- 当前材质仍为 `MeshPhysicalMaterial`，保留 transmission、IOR 1.46、thickness、clearcoat 和内层折射；物理全光谱 dispersion 设为 `0`，由蓝紫至白的轻量内层与轮廓承担克制色差。
- 样机只验证 M1。没有贴纸、流体、M3 整屏形变，也没有接入正式站点。
- 本轮按要求未做浏览器截图；现有平衡态截图属于上一配色，当前配色等待 Ocean 使用同尺寸实看。
- 未做正式 Design QA、test-acceptance、部署或生产性能验收；当前结果保持 WIP。
