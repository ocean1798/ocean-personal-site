# Windows 基线复跑

基线固定为独立仓库 `main@71a99c83918ef9f2a5730a2353ef9ec41ede723a`，当前分支 `codex/r7-visual-poc`。复跑前 tracked diff 为 0；PoC 仅为未跟踪的 `pocs/`。

## 原脚本兼容性

- `npm test`：Windows `cmd` 无法解析脚本开头的 `WRANGLER_LOG_PATH=...`，实际 Vinext 构建与测试未开始，因此不记 PASS / FAIL。
- `npm run test:pages`：Windows `cmd` 无法解析脚本开头的 `GITHUB_PAGES=...`，实际 Pages 构建与测试未开始，因此不记 PASS / FAIL。
- 未修改根 `package.json`；以下使用 PowerShell 临时环境变量等价复跑。

## Vinext / rendered HTML

```powershell
$env:WRANGLER_LOG_PATH='.wrangler/wrangler.log'
.\node_modules\.bin\vinext.cmd build
node --test tests/rendered-html.test.mjs
Remove-Item Env:WRANGLER_LOG_PATH
```

- 运行日期：2026-08-09
- Vinext build：exit 0
- 路由：`/`、`/about`、`/photography`、`/work`
- rendered HTML：11 tests，11 pass，0 fail，exit 0

## GitHub Pages 静态导出

```powershell
$env:GITHUB_PAGES='true'
$env:NEXT_PUBLIC_BASE_PATH='/ocean-personal-site'
.\node_modules\.bin\next.cmd build --webpack
node --test tests/github-pages-export.test.mjs
Remove-Item Env:GITHUB_PAGES,Env:NEXT_PUBLIC_BASE_PATH
```

- 运行日期：2026-08-09
- Next.js 16.2.11 webpack build：exit 0
- 四个公开路由均标记为静态预渲染
- Pages export：5 tests，5 pass，0 fail，exit 0

结论：正式站的 Vinext 渲染与 GitHub Pages 静态导出基线可在 Windows 通过等价 PowerShell env 方式复现。R7 PoC 不需要、也没有修改正式站脚本或托管配置。
