import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon, fileIconName } from '@/components/Icon';
import { ProjectActions } from '@/components/ProjectActions';
import { readDb, type ProjectFile } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getGroup, isGroupKey } from '@/lib/groups';
import { formatSize } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface TreeNode {
  name: string;
  path: string; // 目录用 '' 结尾区分；文件为完整相对路径
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', isDir: true, children: [] };
  for (const f of files) {
    const parts = f.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      let child = node.children.find((c) => c.name === part && c.isDir === !isLast);
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDir: !isLast,
          children: [],
        };
        node.children.push(child);
      }
      node = child;
    }
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
    nodes.forEach((n) => sort(n.children));
  };
  sort(root.children);
  return root.children;
}

const KIND_LABEL: Record<string, string> = {
  code: '代码',
  markdown: '图文',
  image: '图片',
  video: '视频',
  text: '文本',
  other: '其他',
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const db = readDb();
  const { id: projectId } = await params;
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) notFound();
  const user = await getCurrentUser();
  const group = getGroup(project.group);
  const tree = buildTree(project.files);
  const bytes = project.files.reduce((s, f) => s + f.size, 0);

  const canManage =
    !!user && (user.role === 'admin' || user.id === project.ownerId);

  return (
    <>
      <section className="page-hero">
        <div className="shell-inner">
          <nav className="breadcrumb" aria-label="面包屑">
            <Link href="/">首页</Link>
            <span className="breadcrumb__sep">›</span>
            {isGroupKey(project.group) ? (
              <Link href={`/groups/${project.group}`}>{group?.name}</Link>
            ) : (
              <span>{project.group}</span>
            )}
            <span className="breadcrumb__sep">›</span>
            <span className="breadcrumb__current">{project.title}</span>
          </nav>
          <h1 className="page-hero__title">{project.title}</h1>
          <p className="page-hero__desc">{project.description || '项目简介待补充。'}</p>
          <div className="tags mt-4">
            {project.tags.length > 0 ? (
              project.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))
            ) : (
              <span className="tag">未标签</span>
            )}
          </div>
          <p className="mt-3 text-sm text-white/70">
            上传者 {project.ownerName} · {project.files.length} 个文件 · {formatSize(bytes)} ·
            更新于 {new Date(project.updatedAt).toLocaleString('zh-CN')}
          </p>
          {canManage && user && (
            <div className="mt-4">
              <ProjectActions
                projectId={project.id}
                title={project.title}
                pinned={project.pinned}
                user={user}
              />
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="shell-inner">
          {project.files.length === 0 ? (
            <p className="empty-note">该项目还没有文件。</p>
          ) : (
            <div className="repo-layout">
              {/* 左侧目录树 */}
              <aside className="repo-tree" aria-label="文件目录">
                <div className="repo-tree__title">文件目录</div>
                <ul className="tree-list">
                  {tree.map((node) => (
                    <TreeRow key={node.path} node={node} projectId={project.id} depth={0} />
                  ))}
                </ul>
              </aside>

              {/* 右侧文件列表 */}
              <div className="repo-panel">
                <div className="repo-panel__head">
                  <h2 className="repo-panel__title">项目文件</h2>
                  <span className="file-meta">{project.files.length} 个文件 · {formatSize(bytes)}</span>
                  <span className="file-meta ml-auto">
                    单个文件可下载，整包下载功能待后续版本
                  </span>
                </div>
                <table className="file-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>名称</th>
                      <th>类型</th>
                      <th>大小</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.files.map((f) => (
                      <tr key={f.path}>
                        <td>
                          <Link className="file-name" href={`/projects/${project.id}/blob/${f.path}`}>
                            <Icon name={fileIconName(f.kind)} />
                            {f.path}
                          </Link>
                        </td>
                        <td>
                          <span className={`badge badge--kind-${f.kind}`}>
                            {KIND_LABEL[f.kind] ?? f.kind}
                          </span>
                        </td>
                        <td className="file-meta">{formatSize(f.size)}</td>
                        <td>
                          <span className="flex gap-3">
                            <Link className="file-name" href={`/projects/${project.id}/blob/${f.path}`}>
                              查看
                            </Link>
                            <a className="file-name" href={`/api/files/${project.id}/${f.path}`} download>
                              下载
                            </a>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function TreeRow({ node, projectId, depth }: { node: TreeNode; projectId: string; depth: number }) {
  if (node.isDir) {
    return (
      <>
        <li className="tree-row" style={{ paddingLeft: 8 + depth * 12 }}>
          <Icon name="folder" />
          {node.name}
        </li>
        {node.children.map((c) => (
          <TreeRow key={c.path} node={c} projectId={projectId} depth={depth + 1} />
        ))}
      </>
    );
  }
  return (
    <li>
      <Link
        className="tree-row"
        style={{ paddingLeft: 8 + depth * 12 }}
        href={`/projects/${projectId}/blob/${node.path}`}
      >
        <Icon name="file" />
        {node.name}
      </Link>
    </li>
  );
}
