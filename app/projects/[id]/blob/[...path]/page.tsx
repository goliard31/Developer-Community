import Link from 'next/link';
import { notFound } from 'next/navigation';
import fs from 'node:fs';
import { Icon, fileIconName } from '@/components/Icon';
import { VideoPlayer } from '@/components/VideoPlayer';
import { readDb } from '@/lib/db';
import { getGroup, isGroupKey } from '@/lib/groups';
import { extname, formatSize, resolveProjectFile } from '@/lib/storage';
import { highlightCode, renderMarkdown } from '@/lib/render';

export const dynamic = 'force-dynamic';

const MAX_TEXT_BYTES = 2 * 1024 * 1024; // 超过 2MB 的文本不内联，直接给下载

export default async function BlobPage({
  params,
}: {
  params: Promise<{ id: string; path: string[] }>;
}) {
  const resolved = await params;
  const db = readDb();
  const project = db.projects.find((p) => p.id === resolved.id);
  if (!project) notFound();
  const relative = resolved.path.join('/');
  const meta = project.files.find((f) => f.path === relative);
  const group = getGroup(project.group);

  const abs = resolveProjectFile(project.id, relative);
  if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) notFound();
  const size = fs.statSync(abs).size;

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
            <Link href={`/projects/${project.id}`}>{project.title}</Link>
            <span className="breadcrumb__sep">›</span>
            <span className="breadcrumb__current">{relative}</span>
          </nav>
          <h1 className="page-hero__title" style={{ fontSize: '1.75rem' }}>
            {relative.split('/').pop()}
          </h1>
          <p className="page-hero__desc" style={{ fontSize: '1rem' }}>
            {meta ? `${formatSize(meta.size)} · ${relative}` : relative}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell-inner">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Link className="btn btn--ghost btn--sm" href={`/projects/${project.id}`}>
              <Icon name="chevron" className="w-4 h-4 rotate-90" /> 返回项目文件列表
            </Link>
            <a className="btn btn--secondary btn--sm" href={`/api/files/${project.id}/${relative}`} download>
              <Icon name="download" className="w-4 h-4" /> 下载文件（{formatSize(size)}）
            </a>
          </div>

          {meta?.kind === 'markdown' && (
            <MarkdownBody projectId={project.id} abs={abs} />
          )}
          {meta?.kind === 'image' && (
            <div className="card media-view">
              <img src={`/api/files/${project.id}/${relative}`} alt={relative} />
            </div>
          )}
          {meta?.kind === 'video' && (
            <VideoPlayer src={`/api/files/${project.id}/${relative}`} title={relative} />
          )}
          {(meta?.kind === 'code' || meta?.kind === 'text' || !meta) && size <= MAX_TEXT_BYTES && (
            <CodeBody projectId={project.id} relative={relative} abs={abs} />
          )}
          {(!meta || meta.kind === 'other') && size > MAX_TEXT_BYTES && (
            <p className="notice notice--warn">
              文件较大（{formatSize(size)}），不在网页中内联，请
              <a href={`/api/files/${project.id}/${relative}`} download>下载</a>
              后查看。
            </p>
          )}
          {meta?.kind === 'other' && size <= MAX_TEXT_BYTES && (
            <p className="notice notice--info">
              该文件类型暂不支持在线预览，可
              <a href={`/api/files/${project.id}/${relative}`} download>下载</a>
              后查看。
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function MarkdownBody({ projectId, abs }: { projectId: string; abs: string }) {
  const md = fs.readFileSync(abs, 'utf8');
  const html = renderMarkdown(md);
  return (
    <article className="card">
      <div className="repo-panel__head">
        <h2 className="repo-panel__title">Markdown 渲染</h2>
        <span className="file-meta">GitHub 风格渲染，脚本与样式已过滤</span>
      </div>
      <div
        className="markdown-body"
        // sanitize-html 已过滤脚本与事件属性，仅保留白名单标签
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="px-6 pb-6 text-xs text-muted">
        图片等相对资源若指向项目内文件，请确认路径与项目目录结构一致。
        <span className="ml-1">（项目 ID：{projectId}）</span>
      </div>
    </article>
  );
}

function CodeBody({ relative, abs }: { projectId: string; relative: string; abs: string }) {
  const source = fs.readFileSync(abs, 'utf8');
  const { html, languageLabel, highlighted } = highlightCode(source, relative);
  return (
    <div className="blob">
      <div className="blob__head">
        <span className="file-name">
          <Icon name={fileIconName(highlighted ? 'code' : 'other')} /> {relative}
        </span>
        <span className="badge badge--kind-code">{languageLabel}</span>
        <span className="file-meta ml-auto">{extname(relative) || '无扩展名'}</span>
      </div>
      <div className="blob__body">
        <pre className={`code-view${highlighted ? '' : ' code-view--plain'}`}>
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  );
}
