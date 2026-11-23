import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { readDb, updateDb, findUserById, type PublicUser, type User } from './db';

const SCRYPT_KEYLEN = 64;
const SESSION_COOKIE = 'cp_session';
const SESSION_DAYS = 7;

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
}

export function createPasswordHash(password: string): { salt: string; passwordHash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, passwordHash: hashPassword(password, salt) };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  updateDb((db) => {
    db.sessions = db.sessions.filter((s) => s.expiresAt > new Date().toISOString());
    db.sessions.push({ token, userId, createdAt: new Date().toISOString(), expiresAt });
  });
  return { token, expiresAt };
}

export function destroySession(token: string | undefined): void {
  if (!token) return;
  updateDb((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // 本地 http 服务器；上线换 https 后改为 true
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/** 读取当前登录用户；未登录返回 null。服务端组件 / 路由处理器通用。 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (session.expiresAt <= new Date().toISOString()) return null;
  const user = findUserById(db, session.userId);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * 取当前登录用户；未登录返回 null。
 * 注意：不要在 Route Handler 里 throw Response——Next 会把它当意外错误返回 500，
 * 必须由调用方 return 一个 NextResponse。
 */
export async function requireUser(): Promise<PublicUser | null> {
  return getCurrentUser();
}

/** 取当前管理员；未登录或非管理员返回 null */
export async function requireAdmin(): Promise<PublicUser | null> {
  const user = await getCurrentUser();
  return user && user.role === 'admin' ? user : null;
}

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, username: u.username, displayName: u.displayName, role: u.role, createdAt: u.createdAt };
}
