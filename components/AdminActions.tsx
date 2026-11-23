'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Icon';

interface Row {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: string;
  projectCount: number;
}

export function AdminActions({ users, selfId }: { users: Row[]; selfId: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function call(id: string, init?: RequestInit) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, init);
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
      setBusyId('');
    }
  }

  return (
    <div className="repo-panel mt-6">
      <div className="repo-panel__head">
        <h2 className="repo-panel__title">用户管理</h2>
        <span className="file-meta">共 {users.length} 个账号</span>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>昵称</th>
            <th>角色</th>
            <th>项目数</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="font-medium">{u.username}</td>
              <td>{u.displayName}</td>
              <td>
                <span className={`badge ${u.role === 'admin' ? 'badge--admin' : 'badge--user'}`}>
                  {u.role === 'admin' ? '管理员' : '用户'}
                </span>
                {u.id === selfId && <span className="text-xs text-muted ml-2">（当前）</span>}
              </td>
              <td className="file-meta">{u.projectCount}</td>
              <td className="file-meta">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
              <td>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn--ghost btn--xs"
                    disabled={busyId === u.id}
                    onClick={async () => {
                      const ok = await call(u.id, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: u.role === 'admin' ? 'user' : 'admin' }),
                      });
                      if (ok) router.refresh();
                    }}
                  >
                    {u.role === 'admin' ? '取消管理员' : '设为管理员'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--xs"
                    disabled={busyId === u.id || u.id === selfId}
                    onClick={async () => {
                      if (!window.confirm(`确认删除用户「${u.username}」？其项目也会被删除。`)) return;
                      const ok = await call(u.id, { method: 'DELETE' });
                      if (ok) router.refresh();
                    }}
                  >
                    <Icon name="trash" className="w-3.5 h-3.5" /> 删除
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && (
        <p className="notice notice--danger m-4" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
