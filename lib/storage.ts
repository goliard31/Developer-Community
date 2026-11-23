import fs from 'node:fs';
import path from 'node:path';
import type { ProjectFile } from './db';
import { extname as extOf, formatSize as fmtSize } from './format';

export { extOf as extname, fmtSize as formatSize };

export const STORAGE_ROOT = path.join(process.cwd(), 'storage');

export function projectDir(projectId: string): string {
  return path.join(STORAGE_ROOT, 'projects', projectId);
}

/** 把用户提供的相对路径规范化为安全的 POSIX 相对路径，非法则返回 null */
export function safeRelativePath(input: string): string | null {
  if (!input) return null;
  let p = input.replace(/\\/g, '/').trim();
  if (!p) return null;
  if (p.includes('\0')) return null;
  const parts: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') return null;
    parts.push(seg);
  }
  if (parts.length === 0) return null;
  // Windows 非法字符
  if (/[<>:"|?*]/.test(parts.join('/'))) return null;
  if (parts.some((seg) => seg.length > 120)) return null;
  return parts.join('/');
}

/** 解析项目内文件绝对路径，并确认仍在项目目录内（防目录穿越） */
export function resolveProjectFile(projectId: string, relativePath: string): string | null {
  const safe = safeRelativePath(relativePath);
  if (!safe) return null;
  const abs = path.join(projectDir(projectId), safe);
  const root = path.resolve(projectDir(projectId));
  const resolved = path.resolve(abs);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

const MIME_BY_EXT: Record<string, string> = {
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.cjs': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.json': 'application/json',
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.xml': 'text/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.py': 'text/x-python',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.java': 'text/x-java',
  '.c': 'text/x-c',
  '.h': 'text/x-c',
  '.cpp': 'text/x-c++',
  '.sh': 'text/x-sh',
  '.sql': 'text/x-sql',
};

export function guessMime(p: string): string {
  return MIME_BY_EXT[extOf(p)] ?? 'application/octet-stream';
}

export function classifyFile(p: string, mime?: string): ProjectFile['kind'] {
  const ext = extOf(p);
  const type = mime ?? guessMime(p);
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (
    type.startsWith('text/') ||
    [
      '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json', '.py', '.go', '.rs',
      '.java', '.c', '.h', '.cpp', '.sh', '.sql', '.yml', '.yaml', '.xml',
    ].includes(ext)
  ) {
    return 'code';
  }
  return 'other';
}

/** 递归列出项目目录下所有文件（相对路径） */
export function listProjectFiles(projectId: string): { path: string; size: number; abs: string }[] {
  const root = projectDir(projectId);
  const out: { path: string; size: number; abs: string }[] = [];
  if (!fs.existsSync(root)) return out;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        const rel = path.relative(root, abs).replace(/\\/g, '/');
        out.push({ path: rel, size: fs.statSync(abs).size, abs });
      }
    }
  };
  walk(root);
  return out;
}

export function removeProjectDir(projectId: string): void {
  const dir = projectDir(projectId);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
