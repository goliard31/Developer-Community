'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from './Icon';
import { GROUPS } from '@/lib/groups';
import { formatSize } from '@/lib/format';

interface Existing {
  id: string;
  title: string;
  files: string[];
}

/** 上传表单：新建项目 或 给已有项目追加文件 */
export function UploadForm({
  defaultGroup,
  existing,
}: {
  defaultGroup?: string;
  existing?: Existing | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState(defaultGroup ?? 'project');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const appending = !!existing;

  useEffect(() => {
    if (existing?.files) {
      setPaths((prev) => prev.filter((p) => !existing.files.includes(p)));
    }
  }, [existing]);

  function pick(selected: FileList | null, useRelative: boolean) {
    if (!selected || selected.length === 0) return;
    const list = Array.from(selected);
    setFiles((prev) => [...prev, ...list]);
    setPaths((prev) => [
      ...prev,
      ...list.map((f) => {
        const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath;
        return useRelative && rel ? rel : f.name;
      }),
    ]);
  }

  function removeAt(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPaths((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    setSkipped([]);
    try {
      const form = new FormData();
      if (!appending) {
        form.set('title', title.trim());
        form.set('group', group);
        form.set('description', description.trim());
        form.set('tags', tags);
      }
      files.forEach((f) => form.append('files', f));
      form.set('paths', JSON.stringify(paths));

      const url = appending ? `/api/projects/${existing!.id}/files` : '/api/projects';
      const res = await fetch(url, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `上传失败（HTTP ${res.status}）`);
        if (Array.isArray(data.details)) setSkipped(data.details);
        return;
      }
      if (Array.isArray(data.skipped)) setSkipped(data.skipped);
      setOk(
        appending
          ? `已追加 ${data.added ?? 0} 个文件到「${existing!.title}」`
          : `项目「${data.project?.title ?? title}」已创建，共 ${data.project?.files ?? 0} 个文件`,
      );
      const target = appending ? `/projects/${existing!.id}` : `/projects/${data.project?.id ?? ''}`;
      router.push(target);
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="shell-inner" style={{ maxWidth: 760 }}>
        <div className="section__head">
          <span className="eyebrow">{appending ? '追加文件' : '上传项目'}</span>
          <h1 className="section__title">{appending ? `追加文件到「${existing!.title}」` : '上传项目'}</h1>
          <p className="section__sub">
            支持代码、Markdown 图文、图片与视频。文件保存在本机 storage/projects/ 目录，
            不会上传到外部服务器。
          </p>
        </div>

        <form className="card p-7 mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
          {!appending && (
            <>
              <label className="field">
                <span className="field__label">项目标题</span>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="2–60 个字符"
                />
              </label>

              <label className="field">
                <span className="field__label">所属开发组</span>
                <select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
                  {GROUPS.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">项目简介</span>
                <textarea
                  className="input"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  placeholder="这个项目做什么、用到哪些技术（选填）"
                />
              </label>

              <label className="field">
                <span className="field__label">标签</span>
                <input
                  className="input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="用逗号分隔，最多 8 个，如：Next.js, 数据可视化"
                />
              </label>
            </>
          )}

          <div className="field">
            <span className="field__label">项目文件</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="file" className="w-4 h-4" /> 选择文件
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => folderRef.current?.click()}
              >
                <Icon name="folder" className="w-4 h-4" /> 选择文件夹
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => pick(e.target.files, false)}
            />
            <input
              ref={folderRef}
              type="file"
              multiple
              className="hidden"
              // @ts-expect-error 非标准属性，浏览器用于文件夹上传
              webkitdirectory=""
              directory=""
              onChange={(e) => pick(e.target.files, true)}
            />
            <p className="field__hint">
              单次最多 500 个文件，单个文件最大 2GB；非法路径与重复路径会被自动跳过。
            </p>
          </div>

          {files.length > 0 && (
            <div className="card overflow-hidden">
              <table className="file-table">
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>路径</th>
                    <th>大小</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {files.map((f, i) => (
                    <tr key={`${paths[i]}-${i}`}>
                      <td className="file-name">{paths[i] || f.name}</td>
                      <td className="file-meta">{formatSize(f.size)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--danger btn--xs"
                          onClick={() => removeAt(i)}
                        >
                          移除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 text-xs text-muted border-t border-line/40">
                共 {files.length} 个文件 · {formatSize(total)}
              </div>
            </div>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {skipped.length > 0 && (
            <ul className="notice notice--warn">
              {skipped.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {ok && <p className="form-ok">{ok}</p>}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn--primary" disabled={busy || files.length === 0}>
              <Icon name="upload" className="w-4 h-4" />
              {busy ? '上传中…' : appending ? '追加文件' : '创建项目'}
            </button>
            <Link className="btn btn--ghost" href={existing ? `/projects/${existing.id}` : '/upload'}>
              取消
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
