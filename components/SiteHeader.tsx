'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import type { PublicUser } from '@/lib/db';

export function SiteHeader({ user }: { user: PublicUser | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const pathname = usePathname();

  // 首页顶部为深色 hero，导航用透明 + 白字；滚动后统一为白底
  const onHero = pathname === '/';
  const transparent = onHero && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setNavOpen(false);
    setAboutOpen(false);
  }, [pathname]);

  return (
    <div className={`site-top${navOpen ? ' nav-open' : ''}`}>
      <header
        className={`site-header${transparent ? ' site-header--transparent' : ''}`}
        data-testid="site-header"
      >
        <div className="site-header__inner">
          <Link href="/" className="site-logo" aria-label="社区项目站 · 首页">
            <svg className="site-logo__mark" viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#7b5fe2" />
                  <stop offset="1" stopColor="#503281" />
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#logoGradient)" />
              <path
                d="M12 12h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H20l-5 4v-4h-3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"
                fill="#fff"
              />
            </svg>
            <span>社区项目站</span>
          </Link>

          <nav className="site-nav" aria-label="主导航">
            <ul className="nav-list">
              <li>
                <Link href="/">首页</Link>
              </li>
              <li className={`nav-item--has-child${aboutOpen ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="nav-link"
                  aria-expanded={aboutOpen}
                  onClick={() => setAboutOpen((v) => !v)}
                >
                  关于 <Icon name="chevron" className="w-4 h-4" />
                </button>
                <ul className="nav-sub">
                  <li>
                    <Link href="/#about">认识社区</Link>
                  </li>
                  <li>
                    <Link href="/#groups">三个开发组</Link>
                  </li>
                  <li>
                    <Link href="/#latest">最新项目</Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="/#groups">开发组</Link>
              </li>
              <li>
                <Link href="/#latest">项目</Link>
              </li>
            </ul>
          </nav>

          <div className="site-header__actions">
            {user ? (
              <>
                <Link href="/upload" className="btn btn--primary btn--sm">
                  <Icon name="upload" className="w-4 h-4" /> 上传项目
                </Link>
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn--ghost btn--sm">
                  <Icon name="user" className="w-4 h-4" /> {user.displayName}
                  {user.role === 'admin' && <span className="badge badge--admin ml-1">管理员</span>}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn--ghost btn--sm">
                  登录
                </Link>
                <Link href="/register" className="btn btn--primary btn--sm">
                  注册
                </Link>
              </>
            )}
            <button
              type="button"
              className="nav-toggle"
              aria-label="打开菜单"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <span className="nav-toggle__bars" />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
