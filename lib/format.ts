/** 与浏览器/Node 都兼容的纯函数（不引入 node 模块，可安全用于客户端组件） */

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function extname(p: string): string {
  const idx = p.lastIndexOf('.');
  return idx === -1 ? '' : p.slice(idx).toLowerCase();
}
