# R3F 决策证据

- 假设：R3F 若能明显减少等价场景的挂载、卸载与资源清理复杂度，且增量包体可接受，则可替代直接 Three.js。
- 命令：`npm run build:three`；`npm run build:r3f`；`npm run measure`。
- 本轮结果：三条命令均 exit 1，原因是当前沙箱身份无权覆盖原实例留下的 `dist/**` 与 gzip JSON；没有伪造新构建结果。
- 可复核既有结果：同一既有 gzip 报告中，Three 最小实验为 133,250 B（130.13 KiB），R3F 等价最小场景为 292,393 B（285.54 KiB），R3F 增量为 159,143 B（155.41 KiB）。
- 生命周期对比：直接 Three 的 controller 显式持有并销毁渲染资源；R3F 实验仍需 React root/Canvas 的挂载与卸载，并未提供 `context lost`、页面切换或错误恢复比主样机更简单的证据。
- 结论：`reject`。包体明显增加，生命周期收益未被当前最小实验证明；保留直接 Three.js。

