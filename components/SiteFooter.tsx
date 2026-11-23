import Link from 'next/link';
import { Icon } from './Icon';
import { GROUPS } from '@/lib/groups';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link href="/" className="site-footer__logo" aria-label="社区项目站 · 首页">
              <svg className="site-logo__mark" viewBox="0 0 40 40" aria-hidden="true">
                <defs>
                  <linearGradient id="footerLogoGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#7b5fe2" />
                    <stop offset="1" stopColor="#503281" />
                  </linearGradient>
                </defs>
                <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#footerLogoGradient)" />
                <path
                  d="M12 12h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H20l-5 4v-4h-3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"
                  fill="#fff"
                />
              </svg>
              <span>社区项目站</span>
            </Link>
            <p className="site-footer__tagline">
              集中展示各开发组项目的社区站点：注册登录后上传自己的项目，在网页里查看代码、图文与视频。
            </p>
            <div className="social-row">
              <a href="#" title="社交账号占位" aria-label="社交账号占位 1">
                <Icon name="github" className="w-4 h-4" />
              </a>
              <a href="#" title="社交账号占位" aria-label="社交账号占位 2">
                <Icon name="chat" className="w-4 h-4" />
              </a>
              <a href="#" title="社交账号占位" aria-label="社交账号占位 3">
                <Icon name="mail" className="w-4 h-4" />
              </a>
              <a href="#" title="社交账号占位" aria-label="社交账号占位 4">
                <Icon name="rss" className="w-4 h-4" />
              </a>
              <a href="#" title="社交账号占位" aria-label="社交账号占位 5">
                <Icon name="star" className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h6>社区</h6>
            <ul className="site-footer__list">
              <li>
                <Link href="/#about">认识社区</Link>
              </li>
              <li>
                <Link href="/#groups">三个开发组</Link>
              </li>
              <li>
                <Link href="/#latest">最新项目</Link>
              </li>
              <li>
                <Link href="/register">注册账号</Link>
              </li>
            </ul>
          </div>

          <div>
            <h6>开发组</h6>
            <ul className="site-footer__list">
              {GROUPS.map((g) => (
                <li key={g.key}>
                  <Link href={`/groups/${g.key}`}>{g.name}</Link>
                </li>
              ))}
              <li>
                <Link href="/upload">上传项目</Link>
              </li>
            </ul>
          </div>

          <div>
            <h6>使用</h6>
            <ul className="site-footer__list">
              <li>
                <Link href="/login">登录</Link>
              </li>
              <li>
                <Link href="/dashboard">我的项目</Link>
              </li>
              <li>
                <Link href="/admin">管理后台</Link>
              </li>
            </ul>
          </div>

          <div>
            <h6>说明</h6>
            <ul className="site-footer__list">
              <li>
                <Link href="/#about">本地服务器版</Link>
              </li>
              <li>数据与文件保存在本机</li>
              <li>版权信息（占位）</li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© 2026 社区项目站 · 本地演示应用，文件保存在本机 storage/ 目录</span>
          <a href="#top">返回顶部 ↑</a>
        </div>
      </div>
    </footer>
  );
}
