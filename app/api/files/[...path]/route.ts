import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { resolveProjectFile, classifyFile } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fs = await import('node:fs');
const path = await import('node:path');

/**
 * GET /api/files/<projectId>/<相对路径>
 * - 普通文件：直接返回（下载）
 * - 文本/代码/图片/markdown：inline 展示
 * - 视频：支持 Range 请求，实现边下边播
 */
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segs } = await ctx.params;
  if (segs.length < 2) {
    return NextResponse.json({ error: '缺少项目或文件路径' }, { status: 400 });
  }
  const projectId = segs[0];
  const relative = segs.slice(1).join('/');

  const db = readDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

  const abs = resolveProjectFile(projectId, relative);
  if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  const ext = path.extname(abs).toLowerCase();
  const kind = classifyFile(abs);
  const disposition = kind === 'image' || kind === 'video' || kind === 'markdown' || kind === 'code' ? 'inline' : 'attachment';
  const baseHeaders: Record<string, string> = {
    'Content-Type': contentTypeFor(ext, kind),
    'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(path.basename(abs))}`,
    'Cache-Control': 'no-cache',
  };

  const stat = fs.statSync(abs);
  const range = req.headers.get('range');

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2]
        ? parseInt(match[2], 10)
        : Math.min(start + 4 * 1024 * 1024 - 1, stat.size - 1);
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${stat.size}`, ...baseHeaders },
        });
      }
      const chunk = fs.readFileSync(abs).subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.length),
        },
      });
    }
  }

  const buf = fs.readFileSync(abs);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      ...baseHeaders,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(stat.size),
    },
  });
}

function contentTypeFor(ext: string, kind: string): string {
  if (kind === 'code' || kind === 'markdown') return 'text/plain; charset=utf-8';
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
  };
  return map[ext] ?? 'application/octet-stream';
}
