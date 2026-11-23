import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { LogoutButton } from '@/components/LogoutButton';
import { getCurrentUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { getGroup } from '@/lib/groups';
import { formatSize } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export const metadata = { title: '我的项目' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');
  const db = readDb();
  const mine = db.projects
    .filter((p) => p.ownerId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <section className="section">
      <div className="shell-inner">
        <div className="section__head">
          <span className="eyebrow">我的项目</span>
          <h1 className="section__title">
            {user.displayName}
            {user.role === 'admin' && <span className="badge badge--admin ml-3 align-middle">管理员</span>}
          </h1>
          <p className="section__sub">
            用户名 {user.username} · 注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')} ·
            共 {mine.length} 个项目
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <Link className="btn btn--primary" href="/upload">
            <Icon name="upload" className="w-4 h-4" /> 上传新项目
          </Link>
          {user.role === 'admin' && (
            <Link className="btn btn--secondary" href="/admin">
              <Icon name="shield" className="w-4 h-4" /> 管理后台
            </Link>
          )}
          <LogoutButton />
        </div>

        {mine.length === 0 ? (
          <p className="empty-note mt-8">
            你还没有上传项目。点击「上传新项目」开始，或回到
            <Link href="/groups/project">项目组主页</Link>看看别人的项目。
          </p>
        ) : (
          <div className="repo-panel mt-8">
            <table className="file-table">
              <thead>
                <tr>
                  <th style={{ width: '34%' }}>项目</th>
                  <th>开发组</th>
                  <th>文件</th>
                  <th>大小</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((p) => {
                  const bytes = p.files.reduce((s, f) => s + f.size, 0);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link className="file-name" href={`/projects/${p.id}`}>
                          {p.title}
                        </Link>
                        {p.pinned && <span className="badge badge--kind-video ml-2">置顶</span>}
                      </td>
                      <td>{getGroup(p.group)?.name ?? p.group}</td>
                      <td className="file-meta">{p.files.length}</td>
                      <td className="file-meta">{formatSize(bytes)}</td>
                      <td className="file-meta">
                        {new Date(p.updatedAt).toLocaleString('zh-CN')}
                      </td>
                      <td>
                        <span className="flex gap-3">
                          <Link className="file-name" href={`/upload?project=${p.id}`}>
                            追加文件
                          </Link>
                          <Link className="file-name" href={`/projects/${p.id}`}>
                            查看
                          </Link>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
