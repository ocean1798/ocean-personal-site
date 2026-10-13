# pcb-data — X86 主板几何数据

- 来源：【全网首发】X86电脑主板 — https://oshwhub.com/oshwhub/dian-nao-zhu-ban
- 作者：OSHWHub 官方
- 许可证：GPL-3.0（见 LICENSE）。本目录数据为该项目的衍生作品，同样以 GPL-3.0 发布。
- 用途：本站（ocean1798/ocean-personal-site）首页背景。
- 说明：由原始 PCB 文件（Altium ASCII PcbDoc 导出）的几何数据转换而来，只保留走线、过孔、焊盘、丝印、板框与网络名，未包含铜皮。仅用于网页背景渲染。

## 文件
- `board-x86.json.gz` — 网页实际加载（fetch + DecompressionStream('gzip')）
- `board-x86.json` — 未压缩版，用于不支持 DecompressionStream 的浏览器

## 格式
坐标单位为 0.01 mm 的整数（`q`=100），原点在板框左上角，Y 轴向下。
- `o` 板框：扁平 [x1,y1,x2,y2]…
- `k` 丝印：同上，按列差分编码
- `p` 焊盘：[x,y,w,h,round,net,back,rot]，按列差分编码
- `nn`/`ni` 网络名 / 原始网络 ID
- `s[i]` 第 i 个网络的走线：[dx1,dy1,dx2,dy2,width,layer]…，起点相对上一段终点，终点相对起点；layer 0=顶 1=底 2=内1 3=内2
- `v[i]` 过孔：[x,y,直径]，按列差分编码
