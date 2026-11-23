import { NextResponse } from 'next/server';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { readDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';

  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  // 不区分"用户不存在"和"密码错误"，避免暴露账号信息
  const fail = () => NextResponse.json({ error: '用户名或密码不正确' }, { status: 401 });
  if (!user) return fail();
  if (!verifyPassword(password, user.salt, user.passwordHash)) return fail();

  const { token } = createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
  });
  await setSessionCookie(token);
  return res;
}
