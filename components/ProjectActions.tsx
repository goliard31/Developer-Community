'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Icon';
import type { PublicUser } from '@/lib/db';

interface Props {
  projectId: string;
  title: string;
  pinned: boolean;
  user: PublicUser;
}

/** 项目操作：管理员可置顶/取消置顶；项目所有者或管理员可删除 */
export function ProjectActions({ projectId, title, pinned, user }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user.role === 'admin';

  async function call(url: string, init?: RequestInit) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `操作失败（HTTP ${res.status}）`);
        return false;
      }
      return true;
    } catch {
      setError('网络错误，请重试');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={busy}
          onClick={async () => {
            const ok = await call(`/api/projects/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pinned: !pinned }),
            });
            if (ok) router.refresh();
          }}
        >
          <Icon name="pin" className="w-4 h-4" /> {pinned ? '取消置顶' : '置顶项目'}
        </button>
      )}
      <a className="btn btn--ghost btn--sm" href={`/upload?project=${projectId}`}>
        <Icon name="plus" className="w-4 h-4" /> 追加文件
      </a>
      <button
        type="button"
        className="btn btn--danger btn--sm"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm(`确认删除项目「${title}」及其全部文件？该操作不可恢复。`)) return;
          const ok = await call(`/api/projects/${projectId}`, { method: 'DELETE' });
          if (ok) router.push('/');
        }}
      >
        <Icon name="trash" className="w-4 h-4" /> 删除项目
      </button>
      {error && (
        <span className="notice notice--danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
