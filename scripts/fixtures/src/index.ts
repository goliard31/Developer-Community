// 测试数据：示例 TypeScript 源码，仅用于代码高亮与上传功能端到端测试。
// 内容纯属虚构，不包含任何真实业务逻辑，可随时删除。

/** 一条键值记录 */
interface Record {
  key: string;
  value: unknown;
  updatedAt: number;
}

/** 简易键值存储（测试用） */
export class MemoryStore {
  private readonly records = new Map<string, Record>();

  constructor(private readonly name: string, private readonly maxKeyLength = 128) {}

  set(key: string, value: unknown): void {
    if (key.length > this.maxKeyLength) throw new Error(`key 长度超过 ${this.maxKeyLength}`);
    this.records.set(key, { key, value, updatedAt: Date.now() });
  }

  get<T = unknown>(key: string): T | undefined {
    return this.records.get(key)?.value as T | undefined;
  }

  get size(): number { return this.records.size; }
}

/** 工厂函数：创建存储实例 */
export function createStore(name: string): MemoryStore {
  return new MemoryStore(name);
}

/** 辅助函数：格式化字节数 */
export function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(2)} ${units[i]}`;
}
