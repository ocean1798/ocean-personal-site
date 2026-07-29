import Link from "next/link";
import type { ReactNode } from "react";

type SiteChromeProps = {
  children: ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Ocean 首页">
            <span className="site-brand-mark" aria-hidden="true">
              O.
            </span>
            <span>Ocean</span>
          </Link>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-intro">
            <Link className="site-footer-brand" href="/">
              Ocean
            </Link>
            <p>
              Ocean｜负责
              <span className="keep-together">嘉立创 EDA 专业版</span>
              部分 PCB 功能的产品设计
            </p>
          </div>

          <div className="site-footer-links" aria-label="页脚链接">
            <a href="mailto:2711180012@qq.com">邮箱</a>
            <a
              href="https://github.com/ocean1798"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ExternalArrow />
            </a>
          </div>

          <p className="site-footer-meta">© 2026 Ocean · 最近更新 2026.07</p>
        </div>
      </footer>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
}) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </header>
  );
}

export function ExternalArrow() {
  return (
    <>
      <span aria-hidden="true">↗</span>
      <span className="sr-only">（新标签页打开）</span>
    </>
  );
}
