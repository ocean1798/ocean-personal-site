# 后处理决策证据

- 假设：只有 EffectComposer 的半分辨率后处理能在同一代表场景中带来材质内 Shader 无法达到的清晰收益，并满足帧率与 400 KiB 预算时才采用。
- 命令：`npm run build:postprocessing`；`npm run build:three`；`npm run measure`。
- 本轮结果：三条命令均 exit 1，原因是无权覆盖原实例留下的输出。既有 gzip 报告记录 postprocessing 最小构建为 130,173 B（127.12 KiB），Three 最小构建为 133,250 B（130.13 KiB）；由于两个实验的 tree-shaking 内容不同，这个大小差不能证明 Composer 比材质内 Shader 更省。
- 收益检查：主样机已用对象材质内 Shader 完成局部揭层，文字和控件不进后处理链。当前没有浏览器帧率、半分辨率清晰度或视觉收益证据支持增加 Composer 生命周期与 render target。
- 结论：`reject`。保留材质内 Shader；没有证据时不引入 EffectComposer。

