import { NextResponse } from 'next/server';
import {
  createPasswordHash,
  createSession,
  setSessionCookie,
} from '@/lib/auth';
import { findUserByUsername, newId, updateDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

export async function POST(req: Request) {
  let body: { username?: string; displayName?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const displayName = (body.displayName ?? '').trim() || username;
  const password = body.password ?? '';

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: '用户名需为 3–20 位字母、数字、下划线或连字符' },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });
  }
  if (displayName.length > 30) {
    return NextResponse.json({ error: '昵称最长 30 个字符' }, { status: 400 });
  }

  const existing = updateDb((db) => {
    if (findUserByUsername(db, username)) {
      return { ok: false as const };
    }
    const { salt, passwordHash } = createPasswordHash(password);
    // 第一个注册的用户自动成为管理员，保证初始可用
    const role = db.users.length === 0 ? ('admin' as const) : ('user' as const);
    const user = {
      id: newId('u'),
      username,
      displayName,
      passwordHash,
      salt,
      role,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return { ok: true as const, user };
  });

  if (!existing.ok) {
    return NextResponse.json({ error: '用户名已被注册' }, { status: 409 });
  }

  const { token } = createSession(existing.user.id);
  const res = NextResponse.json({
    ok: true,
    user: {
      id: existing.user.id,
      username: existing.user.username,
      displayName: existing.user.displayName,
      role: existing.user.role,
    },
  });
  await setSessionCookie(token);
  return res;
}
