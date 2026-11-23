import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { newId, updateDb, type Project, type ProjectFile } from '@/lib/db';
import {
  classifyFile,
  ensureDir,
  guessMime,
  projectDir,
  removeProjectDir,
  resolveProjectFile,
  safeRelativePath,
} from '@/lib/storage';
import { isGroupKey } from '@/lib/groups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILES = 500;
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 单文件 2GB

interface SavedFile {
  path: string;
  size: number;
  mime: string;
}

/** 把 FormData 中的文件按相对路径落盘，返回文件元数据与被跳过的原因 */
async function saveUploadedFiles(
  projectId: string,
  files: File[],
  paths: string[],
): Promise<{ saved: SavedFile[]; errors: string[] }> {
  const saved: SavedFile[] = [];
  const errors: string[] = [];
  ensureDir(projectDir(projectId));
  const seen = new Set<string>();
  const fs = await import('node:fs');

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const rawPath =
      paths[i] ?? (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name;
    const rel = safeRelativePath(rawPath);
    if (!rel) {
      errors.push(`跳过非法路径：${rawPath}`);
      continue;
    }
    if (seen.has(rel)) {
      errors.push(`跳过重复路径：${rel}`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`文件超过 2GB，已跳过：${rel}`);
      continue;
    }
    const abs = resolveProjectFile(projectId, rel);
    if (!abs) {
      errors.push(`跳过非法路径：${rel}`);
      continue;
    }
    const dirEnd = Math.max(abs.lastIndexOf('/'), abs.lastIndexOf('\\'));
    if (dirEnd > 0) ensureDir(abs.slice(0, dirEnd));

    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(abs, buf);
    seen.add(rel);
    saved.push({ path: rel, size: buf.length, mime: guessMime(rel) });
  }
  return { saved, errors };
}

function toProjectFiles(saved: SavedFile[]): ProjectFile[] {
  return saved.map((f) => ({
    path: f.path,
    name: f.path.split('/').pop() ?? f.path,
    size: f.size,
    mime: f.mime,
    kind: classifyFile(f.path, f.mime),
    uploadedAt: new Date().toISOString(),
  }));
}

export async function GET() {
  const db = (await import('@/lib/db')).readDb();
  const projects = db.projects
    .slice()
    .sort((a, b) =>
      a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : a.pinned ? -1 : 1,
    )
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      tags: p.tags,
      group: p.group,
      ownerName: p.ownerName,
      pinned: p.pinned,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      fileCount: p.files.length,
    }));
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: '需要 multipart/form-data 请求' }, { status: 400 });
  }

  const title = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const group = String(form.get('group') ?? 'project');
  const tags = String(form.get('tags') ?? '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  let paths: string[] = [];
  try {
    const parsed = JSON.parse(String(form.get('paths') ?? '[]'));
    if (Array.isArray(parsed)) paths = parsed.map((p) => String(p));
  } catch {
    paths = [];
  }

  if (title.length < 2 || title.length > 60) {
    return NextResponse.json({ error: '项目标题需 2–60 个字符' }, { status: 400 });
  }
  if (!isGroupKey(group)) {
    return NextResponse.json({ error: '开发组参数不合法' }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json({ error: '请至少选择一个文件' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `单次最多上传 ${MAX_FILES} 个文件` }, { status: 400 });
  }

  const projectId = newId('p');
  const { saved, errors } = await saveUploadedFiles(projectId, files, paths);
  if (saved.length === 0) {
    removeProjectDir(projectId);
    return NextResponse.json({ error: '没有可保存的文件', details: errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: projectId,
    title,
    description: description.slice(0, 2000),
    tags,
    group,
    ownerId: user.id,
    ownerName: user.displayName,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    files: toProjectFiles(saved),
  };

  updateDb((db) => {
    db.projects.push(project);
  });

  return NextResponse.json({
    ok: true,
    project: { id: project.id, title: project.title, files: project.files.length },
    skipped: errors,
  });
}
