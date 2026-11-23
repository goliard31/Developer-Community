import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import {
  classifyFile,
  ensureDir,
  guessMime,
  removeProjectDir,
  resolveProjectFile,
  safeRelativePath,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: '请先登录' }, { status: 401 });

/** POST /api/projects/[id]/files —— 给已存在项目追加文件（owner 或 admin） */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  if (project.ownerId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '无权修改该项目' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: '需要 multipart/form-data 请求' }, { status: 400 });
  }
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  let paths: string[] = [];
  try {
    const parsed = JSON.parse(String(form.get('paths') ?? '[]'));
    if (Array.isArray(parsed)) paths = parsed.map((p) => String(p));
  } catch {
    paths = [];
  }
  if (files.length === 0) return NextResponse.json({ error: '请至少选择一个文件' }, { status: 400 });

  const saved: { path: string; size: number }[] = [];
  const errors: string[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const rawPath =
      paths[i] ?? (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name;
    const rel = safeRelativePath(rawPath);
    if (!rel) {
      errors.push(`跳过非法路径：${rawPath}`);
      continue;
    }
    if (project.files.some((f) => f.path === rel)) {
      errors.push(`路径已存在，已跳过：${rel}`);
      continue;
    }
    const abs = resolveProjectFile(id, rel);
    if (!abs) {
      errors.push(`跳过非法路径：${rel}`);
      continue;
    }
    const dirEnd = Math.max(abs.lastIndexOf('/'), abs.lastIndexOf('\\'));
    if (dirEnd > 0) ensureDir(abs.slice(0, dirEnd));
    const fs = await import('node:fs');
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(abs, buf);
    saved.push({ path: rel, size: buf.length });
  }

  if (saved.length === 0) {
    return NextResponse.json({ error: '没有新文件被保存', details: errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  updateDb((d) => {
    const p = d.projects.find((x) => x.id === id);
    if (!p) return;
    for (const s of saved) {
      p.files.push({
        path: s.path,
        name: s.path.split('/').pop() ?? s.path,
        size: s.size,
        mime: guessMime(s.path),
        kind: classifyFile(s.path, guessMime(s.path)),
        uploadedAt: now,
      });
    }
    p.updatedAt = now;
  });

  return NextResponse.json({ ok: true, added: saved.length, skipped: errors });
}

/** PATCH /api/projects/[id] —— 置顶/取消置顶（admin）或更新标题简介（owner/admin） */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    pinned?: boolean;
    title?: string;
    description?: string;
    tags?: string[];
  };

  const isOwner = project.ownerId === user.id;
  if (body.pinned !== undefined && user.role !== 'admin') {
    return NextResponse.json({ error: '仅管理员可置顶项目' }, { status: 403 });
  }
  if (!isOwner && user.role !== 'admin') {
    return NextResponse.json({ error: '无权修改该项目' }, { status: 403 });
  }

  const title = body.title?.trim();
  if (title !== undefined && (title.length < 2 || title.length > 60)) {
    return NextResponse.json({ error: '项目标题需 2–60 个字符' }, { status: 400 });
  }

  updateDb((d) => {
    const p = d.projects.find((x) => x.id === id);
    if (!p) return;
    if (user.role === 'admin' && body.pinned !== undefined) p.pinned = body.pinned;
    if (title !== undefined) p.title = title;
    if (body.description !== undefined) p.description = body.description.slice(0, 2000);
    if (Array.isArray(body.tags)) p.tags = body.tags.slice(0, 8);
    p.updatedAt = new Date().toISOString();
  });

  return NextResponse.json({ ok: true });
}

/** DELETE /api/projects/[id] —— 删除项目与磁盘文件（owner 或 admin） */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const db = readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  if (project.ownerId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '无权删除该项目' }, { status: 403 });
  }

  removeProjectDir(id);
  updateDb((d) => {
    d.projects = d.projects.filter((p) => p.id !== id);
  });
  return NextResponse.json({ ok: true });
}
