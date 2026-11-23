import { NextResponse } from 'next/server';
import { requireAdmin, toPublicUser } from '@/lib/auth';
import { readDb, updateDb, type Role } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '仅管理员可执行该操作' }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { role?: string };

  let role: Role | undefined;
  if (body.role !== undefined) {
    if (body.role !== 'admin' && body.role !== 'user') {
      return NextResponse.json({ error: '角色只能是 admin 或 user' }, { status: 400 });
    }
    role = body.role;
  }

  const db = readDb();
  const target = db.users.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  if (target.id === admin.id && body.role === 'user') {
    return NextResponse.json({ error: '不能取消自己的管理员权限' }, { status: 400 });
  }

  updateDb((d) => {
    const u = d.users.find((x) => x.id === id);
    if (u && role !== undefined) u.role = role;
  });
  const after = readDb().users.find((u) => u.id === id);
  return NextResponse.json({ ok: true, user: after ? toPublicUser(after) : null });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '仅管理员可执行该操作' }, { status: 403 });
  }
  const { id } = await ctx.params;

  const db = readDb();
  const target = db.users.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  if (target.id === admin.id) {
    return NextResponse.json({ error: '不能删除当前登录的管理员' }, { status: 400 });
  }
  if (target.role === 'admin' && db.users.filter((u) => u.role === 'admin').length <= 1) {
    return NextResponse.json({ error: '至少保留一个管理员' }, { status: 400 });
  }

  updateDb((d) => {
    d.users = d.users.filter((u) => u.id !== id);
    d.sessions = d.sessions.filter((s) => s.userId !== id);
    d.projects = d.projects.filter((p) => p.ownerId !== id);
  });
  return NextResponse.json({ ok: true });
}
