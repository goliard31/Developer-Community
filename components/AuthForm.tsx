'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from './Icon';

/** 登录 / 注册共用表单 */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const isLogin = mode === 'login';
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { username, password } : { username, displayName, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `操作失败（HTTP ${res.status}）`);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="shell-inner" style={{ maxWidth: 460 }}>
        <div className="card p-7">
          <h1 className="font-display font-black text-3xl text-ink m-0">
            {isLogin ? '登录' : '注册账号'}
          </h1>
          <p className="form-note mt-2">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <Link href={isLogin ? '/register' : '/login'} className="text-link ml-1">
              {isLogin ? '去注册' : '去登录'}
            </Link>
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">用户名</span>
              <input
                className="input"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_\-]+"
                placeholder="3–20 位字母、数字、下划线或连字符"
              />
            </label>

            {!isLogin && (
              <label className="field">
                <span className="field__label">昵称</span>
                <input
                  className="input"
                  name="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                  placeholder="选填，默认使用用户名"
                />
              </label>
            )}

            <label className="field">
              <span className="field__label">密码</span>
              <input
                className="input"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={6}
                placeholder="至少 6 位"
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn--primary" disabled={busy}>
              <Icon name={isLogin ? 'user' : 'check'} className="w-4 h-4" />
              {busy ? '提交中…' : isLogin ? '登录' : '注册并登录'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
