import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { GROUPS, getGroup } from '@/lib/groups';
import { readDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { formatSize } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return GROUPS.map((g) => ({ group: g.key }));
}

export default async function GroupPage({ params }: { params: Promise<{ group: string }> }) {
  const group = getGroup((await params).group);
  if (!group) notFound();

  const user = await getCurrentUser();
  const db = readDb();
  const all = db.projects
    .filter((p) => p.group === group.key)
    .sort((a, b) => (a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : a.pinned ? -1 : 1));
  const pinned = all.filter((p) => p.pinned);
  const rest = all.filter((p) => !p.pinned);

  return (
    <>
      <section className="page-hero">
        <div className="shell-inner">
          <nav className="breadcrumb" aria-label="面包屑">
            <Link href="/">首页</Link>
            <span className="breadcrumb__sep">›</span>
            <span className="breadcrumb__current">{group.name}</span>
          </nav>
          <h1 className="page-hero__title">{group.name}</h1>
          <p className="page-hero__desc">{group.desc}</p>
          <div className="hero__buttons" style={{ justifyContent: 'flex-start' }}>
            {user ? (
              <Link href={`/upload?group=${group.key}`} className="btn btn--primary">
                <Icon name="upload" className="w-4 h-4" /> 上传到{group.name}
              </Link>
            ) : (
              <Link href="/login" className="btn btn--light">
                登录后上传项目
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-inner">
          {/* 置顶项目区：置顶卡片与普通项目卡片同样式，可多个 */}
          <div className="section__head">
            <span className="eyebrow">置顶项目</span>
            <h2 className="section__title">置顶项目区</h2>
            <p className="section__sub">由管理员置顶，样式与普通项目卡片一致。</p>
          </div>
          {pinned.length === 0 ? (
            <p className="empty-note">暂无置顶项目。</p>
          ) : (
            <div className="project-grid">{pinned.map((p) => renderCard(p, true))}</div>
          )}

          {/* 项目列表区 */}
          <div className="section__head" style={{ marginTop: '3rem' }}>
            <span className="eyebrow">项目列表</span>
            <h2 className="section__title">项目列表区</h2>
          </div>
          {rest.length === 0 ? (
            <p className="empty-note">
              {group.name}还没有项目。登录后进入
              <Link href="/upload">「上传项目」</Link>即可添加。
            </p>
          ) : (
            <div className="project-grid">{rest.map((p) => renderCard(p, false))}</div>
          )}
        </div>
      </section>
    </>
  );
}

function renderCard(
  p: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    pinned: boolean;
    ownerName: string;
    files: { size: number }[];
  },
  pinned: boolean,
) {
  const bytes = p.files.reduce((s, f) => s + f.size, 0);
  return (
    <Link key={p.id} href={`/projects/${p.id}`} className="project-card">
      <span className="project-card__cover">
        {pinned && <span className="pin-badge">置顶</span>}
        <span className="cover-empty">项目封面（占位）</span>
      </span>
      <span className="project-card__body">
        <span className="project-card__title">{p.title}</span>
        <span className="project-card__desc">{p.description || '项目简介待补充。'}</span>
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
          <span>
            <Icon name="file" className="w-3.5 h-3.5 inline" /> {p.files.length} 个文件
          </span>
          <span>{formatSize(bytes)}</span>
          <span>{p.ownerName}</span>
        </span>
      </span>
    </Link>
  );
}
