import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { GROUPS } from '@/lib/groups';
import { readDb } from '@/lib/db';
import { formatSize } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: '首页' };

function countFiles(files: { size: number }[]): { count: number; bytes: number } {
  return files.reduce(
    (acc, f) => ({ count: acc.count + 1, bytes: acc.bytes + f.size }),
    { count: 0, bytes: 0 },
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const db = readDb();
  const projects = db.projects
    .slice()
    .sort((a, b) => (a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : a.pinned ? -1 : 1));
  const latest = projects.slice(0, 3);
  const total = countFiles(db.projects.flatMap((p) => p.files));

  return (
    <>
      {/* Hero */}
      <section className="hero" id="top">
        <div className="hero__icons" aria-hidden="true">
          <span className="hero__blob hero__blob--1" />
          <span className="hero__blob hero__blob--2" />
          <span className="hero__blob hero__blob--3" />
          <span className="hero__icon hero__icon--1">
            <Icon name="layers" />
          </span>
          <span className="hero__icon hero__icon--2">
            <Icon name="code" />
          </span>
          <span className="hero__icon hero__icon--3">
            <Icon name="palette" />
          </span>
          <span className="hero__icon hero__icon--4">
            <Icon name="markdown" />
          </span>
          <span className="hero__icon hero__icon--5">
            <Icon name="video" />
          </span>
          <span className="hero__icon hero__icon--6">
            <Icon name="upload" />
          </span>
        </div>
        <div className="hero__inner">
          <h1 className="hero__title">一个社区，任何可能。</h1>
          <p className="hero__desc">
            社区项目站集中展示项目组、研发组、设计组的项目。注册登录后即可上传自己的项目，
            在网页里直接查看代码、Markdown 图文与视频。
          </p>
          <div className="hero__buttons">
            <a href="#groups" className="btn btn--primary">
              浏览开发组 <span className="btn__arrow">→</span>
            </a>
            {user ? (
              <Link href="/upload" className="btn btn--light">
                <Icon name="upload" className="w-4 h-4" /> 上传项目
              </Link>
            ) : (
              <Link href="/register" className="btn btn--light">
                注册账号
              </Link>
            )}
          </div>
          <div className="hero__logos">
            <span className="hero__logo-item">合作机构 Logo（占位）</span>
            <span className="hero__logo-item">合作机构 Logo（占位）</span>
            <span className="hero__logo-item">合作机构 Logo（占位）</span>
            <span className="hero__logo-item">合作机构 Logo（占位）</span>
            <span className="hero__logos-note">Logo 图片待提供，此处为占位</span>
          </div>
        </div>
      </section>

      {/* 认识社区 */}
      <section className="section" id="about">
        <div className="shell-inner">
          <div className="section__head">
            <span className="eyebrow">关于本站</span>
            <h2 className="section__title">把项目放上来，让社区直接看到</h2>
            <p className="section__sub">
              本站运行在你自己的电脑上：数据保存在本地 data/db.json，上传的文件保存在本地
              storage/projects/ 目录，不需要外部服务器。
            </p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card__num">{db.projects.length}</div>
              <div className="stat-card__label">已上传项目</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{total.count}</div>
              <div className="stat-card__label">项目文件数（{formatSize(total.bytes)}）</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{db.users.length}</div>
              <div className="stat-card__label">注册用户</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__num">{GROUPS.length}</div>
              <div className="stat-card__label">开发组</div>
            </div>
          </div>
        </div>
      </section>

      {/* 三个开发组 */}
      <section className="section" id="groups" style={{ background: '#f4f0fd' }}>
        <div className="shell-inner">
          <div className="section__head section__head--center">
            <span className="eyebrow">开发组</span>
            <h2 className="section__title">三个开发组</h2>
            <p className="section__sub">每个开发组有独立的项目主页，布局一致、数据不同。</p>
          </div>
          <div className="group-grid">
            {GROUPS.map((g) => {
              const count = db.projects.filter((p) => p.group === g.key).length;
              return (
                <Link
                  key={g.key}
                  href={`/groups/${g.key}`}
                  className="group-card"
                  style={{ ['--ic' as string]: g.color, ['--lic' as string]: g.color }}
                >
                  <span className="group-card__icon">
                    <Icon name={g.icon} />
                  </span>
                  <span className="group-card__title">{g.name}</span>
                  <span className="group-card__desc">{g.desc}</span>
                  <ul className="group-card__list">
                    <li>
                      <Icon name="check" /> 当前 {count} 个项目
                    </li>
                    <li>
                      <Icon name="check" /> 置顶 + 项目列表
                    </li>
                    <li>
                      <Icon name="check" /> 进入可看文件与教程
                    </li>
                  </ul>
                  <span className="group-card__go">进入{g.name} →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 最新项目 */}
      <section className="section" id="latest">
        <div className="shell-inner">
          <div className="section__head">
            <span className="eyebrow">最新项目</span>
            <h2 className="section__title">最近上传的项目</h2>
            <p className="section__sub">置顶项目在前，其余按更新时间排序。</p>
          </div>

          {latest.length === 0 ? (
            <p className="empty-note">
              还没有任何项目。登录后进入
              <Link href="/upload">「上传项目」</Link>
              即可添加第一个项目。
            </p>
          ) : (
            <div className="project-grid">
              {latest.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="project-card">
                  <span className="project-card__cover">
                    {p.pinned && <span className="pin-badge">置顶</span>}
                    <span className="cover-empty">项目封面（占位）</span>
                  </span>
                  <span className="project-card__body">
                    <span className="project-card__title">{p.title}</span>
                    <span className="project-card__desc">
                      {p.description || '项目简介待补充。'}
                    </span>
                    <span className="tags">
                      {p.tags.length > 0 ? (
                        p.tags.map((t) => (
                          <span key={t} className="tag">
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="tag">未标签</span>
                      )}
                    </span>
                    <span className="project-card__meta">
                      <span>{GROUPS.find((g) => g.key === p.group)?.name ?? p.group}</span>
                      <span>{p.files.length} 个文件</span>
                      <span>{p.ownerName}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 深色 CTA */}
      <section className="section section--dark">
        <div className="shell-inner">
          <div className="section__head section__head--center">
            <span className="eyebrow" style={{ color: '#fff470' }}>
              现在开始
            </span>
            <h2 className="section__title">上传你的第一个项目</h2>
            <p className="section__sub">
              支持代码文件、Markdown 图文与视频；上传后立即可在网页中查看，类似 GitHub 仓库的浏览体验。
            </p>
            <div className="hero__buttons">
              {user ? (
                <Link href="/upload" className="btn btn--primary">
                  <Icon name="upload" className="w-4 h-4" /> 上传项目
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn--primary">
                    注册账号
                  </Link>
                  <Link href="/login" className="btn btn--light">
                    已有账号，登录
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
