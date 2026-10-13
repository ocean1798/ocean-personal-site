import Link from "next/link";

export const CONTACT_EMAIL = "1798@duck.com";

const homeAnchors = [
  ["#work", "嘉立创 EDA"],
  ["#plugins", "插件"],
  ["#more", "其它项目"],
  ["#tools", "在用"],
  ["#music", "音乐"],
] as const;

export function PcbNav({ onHome = false }: { onHome?: boolean }) {
  return (
    <nav className="pcb-nav" aria-label="主导航">
      <Link className="brand" href="/" aria-label="海洋湃 首页">
        <span className="led" aria-hidden="true"></span>海洋湃<span className="brand-latin">Ocean</span>
      </Link>
      <div className="nav-links">
        {onHome
          ? homeAnchors.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))
          : null}
        <Link href="/work/">工作</Link>
        <Link href="/about/">关于</Link>
        <Link href="/photography/">摄影</Link>
        {onHome ? <a href="#contact">联系</a> : <Link href="/#contact">联系</Link>}
      </div>
    </nav>
  );
}

export function PcbFooter() {
  return (
    <footer className="pcb-footer">
      <span>© 2026 海洋湃 Ocean · 深圳</span>
      <span id="board-credit">
        背景电路板：
        <a href="https://oshwhub.com/oshwhub/dian-nao-zhu-ban" target="_blank" rel="noopener">【全网首发】X86电脑主板</a>
        （LGA1700 · 4 层）· 作者 OSHWHub 官方 · GPL-3.0 · 由原始 PCB 文件渲染
      </span>
      <span>插件和项目均为个人作品，与公司无关</span>
    </footer>
  );
}
