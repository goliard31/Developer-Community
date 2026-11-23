import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { AdminActions } from '@/components/AdminActions';
import { getCurrentUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { getGroup } from '@/lib/groups';
import { formatSize } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export const metadata = { title: '管理后台' };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'admin') redirect('/dashboard');

  const db = readDb();
  const users = db.users
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt,
      projectCount: db.projects.filter((p) => p.ownerId === u.id).length,
    }));

  const projects = db.projects
    .slice()
    .sort((a, b) => (a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : a.pinned ? -1 : 1));

  return (
    <section className="section">
      <div className="shell-inner">
        <div className="section__head">
          <span className="eyebrow">管理后台</span>
          <h1 className="section__title">站点管理</h1>
          <p className="section__sub">
            管理用户与项目。项目置顶、删除等操作会立即写入本地数据文件 data/db.json。
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__num">{db.users.length}</div>
            <div className="stat-card__label">用户</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">{db.projects.length}</div>
            <div className="stat-card__label">项目</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">{db.sessions.length}</div>
            <div className="stat-card__label">有效会话</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__num">
              {formatSize(db.projects.reduce((s, p) => s + p.files.reduce((t, f) => t + f.size, 0), 0))}
            </div>
            <div className="stat-card__label">文件总大小</div>
          </div>
        </div>

        <AdminActions users={users} selfId={user.id} />

        <div className="repo-panel mt-8">
          <div className="repo-panel__head">
            <h2 className="repo-panel__title">项目管理</h2>
            <span className="file-meta">置顶项目显示在最前</span>
          </div>
          <table className="file-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>项目</th>
                <th>开发组</th>
                <th>所有者</th>
                <th>文件</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link className="file-name" href={`/projects/${p.id}`}>
                      {p.title}
                    </Link>
                    {p.pinned && (
                      <span className="badge badge--kind-video ml-2">
                        <Icon name="pin" className="w-3 h-3" /> 置顶
                      </span>
                    )}
                  </td>
                  <td>{getGroup(p.group)?.name ?? p.group}</td>
                  <td className="file-meta">{p.ownerName}</td>
                  <td className="file-meta">{p.files.length}</td>
                  <td className="file-meta">{new Date(p.updatedAt).toLocaleString('zh-CN')}</td>
                  <td>
                    <span className="flex gap-3">
                      <Link className="file-name" href={`/projects/${p.id}`}>
                        查看
                      </Link>
                      <Link className="file-name" href={`/upload?project=${p.id}`}>
                        追加文件
                      </Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && <p className="empty-note m-5">还没有任何项目。</p>}
        </div>
      </div>
    </section>
  );
}
