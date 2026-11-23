/**
 * 创建/重置本地演示管理员账号：admin / <ADMIN_PASSWORD，默认 abc123>
 * 用法：node scripts/seed-admin.mjs   （在 web-app/ 目录下执行）
 * 说明：仅用于本地演示，口令通过环境变量 ADMIN_PASSWORD 覆盖。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const dbPath = path.join(dataDir, 'db.json');

const username = process.env.ADMIN_USERNAME ?? 'admin';
const password = process.env.ADMIN_PASSWORD ?? 'abc123';
const displayName = process.env.ADMIN_DISPLAY_NAME ?? '管理员';

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db = { users: [], sessions: [], projects: [] };
if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.users ??= [];
    db.sessions ??= [];
    db.projects ??= [];
  } catch {
    console.error('db.json 解析失败，请先备份/删除后重试');
    process.exit(1);
  }
}

function hash(pw, salt) {
  return crypto.scryptSync(pw, salt, 64).toString('hex');
}

const idx = db.users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
const salt = crypto.randomBytes(16).toString('hex');
const record = {
  id: idx >= 0 ? db.users[idx].id : 'u_' + crypto.randomBytes(8).toString('hex'),
  username,
  displayName,
  passwordHash: hash(password, salt),
  salt,
  role: 'admin',
  createdAt: idx >= 0 ? db.users[idx].createdAt : new Date().toISOString(),
};

if (idx >= 0) db.users[idx] = record;
else db.users.push(record);

const tmp = dbPath + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
fs.renameSync(tmp, dbPath);

console.log(`管理员账号已就绪：${username} / ${password}（role=admin）`);
console.log('提示：这是本地演示口令，请勿用于任何真实环境。');
