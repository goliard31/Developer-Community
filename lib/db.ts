import fs from 'node:fs';
import path from 'node:path';

export type Role = 'admin' | 'user';

export type GroupKey = 'project' | 'rd' | 'design';

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  role: Role;
  createdAt: string;
}

export interface ProjectFile {
  /** 项目内的相对路径，统一用 POSIX 分隔符，如 "docs/readme.md" */
  path: string;
  name: string;
  size: number;
  mime: string;
  kind: 'code' | 'markdown' | 'image' | 'video' | 'text' | 'other';
  uploadedAt: string;
  note?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  group: GroupKey;
  ownerId: string;
  ownerName: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  files: ProjectFile[];
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DbShape {
  users: User[];
  projects: Project[];
  sessions: Session[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY: DbShape = { users: [], projects: [], sessions: [] };

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readDb(): DbShape {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) return { ...EMPTY };
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    return {
      users: parsed.users ?? [],
      projects: parsed.projects ?? [],
      sessions: parsed.sessions ?? [],
    };
  } catch (err) {
    console.error('[db] 读取 db.json 失败，使用空数据库：', err);
    return { ...EMPTY };
  }
}

export function writeDb(db: DbShape): void {
  ensureDir();
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

export function updateDb<T>(mutator: (db: DbShape) => T): T {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function findUserByUsername(db: DbShape, username: string): User | undefined {
  const key = username.trim().toLowerCase();
  return db.users.find((u) => u.username.toLowerCase() === key);
}

export function findUserById(db: DbShape, id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function publicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt,
  };
}

export type PublicUser = ReturnType<typeof publicUser>;
