/**
 * 端到端自检脚本（本地演示用）：
 * 注册 → 登录 → 上传 fixtures 文件夹 → 校验仓库页/代码/图文/视频/Range → 管理操作 → 清理
 * 运行：node scripts/e2e-check.mjs [baseUrl]
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000';
const FIX = path.resolve(process.cwd(), 'scripts/fixtures');

let cookie = '';
let failed = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const bad = (m) => {
  failed++;
  console.log(`  FAIL ${m}`);
};

async function req(url, init = {}) {
  const headers = { ...(init.headers ?? {}) };
  if (cookie) headers.cookie = cookie;
  const res = await fetch(BASE + url, { ...init, headers, redirect: 'manual' });
  const set = res.headers.getSetCookie?.() ?? [];
  for (const c of set) cookie = c.split(';')[0];
  return res;
}

async function json(url, init) {
  const res = await req(url, init);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* 页面不是 JSON */
  }
  return { res, data, text };
}

function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
    else out.push({ abs: path.join(dir, entry.name), rel });
  }
  return out;
}

console.log(`\n[1/8] 注册测试用户 tester`);
{
  const { res, data } = await json('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'tester', password: 'tester123', displayName: '测试用户' }),
  });
  if (res.status === 200 && data?.user?.username === 'tester') ok(`注册成功 role=${data.user.role}`);
  else if (res.status === 409) ok('用户名 tester 已存在（沿用既有账号）');
  else bad(`注册失败 status=${res.status} body=${JSON.stringify(data)}`);
}

console.log(`\n[2/8] 退出并以 admin / abc123 登录，清理历史测试数据`);
{
  await req('/api/auth/logout', { method: 'POST' });
  const { res, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'abc123' }),
  });
  if (res.status === 200 && data?.user?.role === 'admin') ok(`管理员登录成功`);
  else bad(`管理员登录失败 status=${res.status} body=${JSON.stringify(data)}`);
  const wrong = await json('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'nope' }),
  });
  if (wrong.res.status === 401) ok('错误密码返回 401');
  else bad(`错误密码应返回 401，实际 ${wrong.res.status}`);

  const clean = await json('/api/projects');
  const stale = clean.data?.projects ?? [];
  for (const p of stale) {
    const del = await json(`/api/projects/${p.id}`, { method: 'DELETE' });
    if (del.res.status !== 200) bad(`删除历史项目 ${p.id} 失败 status=${del.res.status}`);
  }
  if (stale.length) ok(`已清理 ${stale.length} 个历史项目`);
  const savedCookie = cookie;
  cookie = '';
  const anon = await json('/api/projects', { method: 'POST', body: new FormData() });
  if (anon.res.status === 401) ok('未登录上传被 401 拦截');
  else bad(`未登录上传应返回 401，实际 ${anon.res.status}`);
  cookie = savedCookie;
}

console.log(`\n[3/8] 上传 fixtures 文件夹为项目`);
let projectId = '';
{
  const files = walk(FIX);
  const fd = new FormData();
  fd.set('title', '端到端自检项目');
  fd.set('description', '由 e2e-check.mjs 上传的测试项目，可删除。');
  fd.set('group', 'project');
  fd.set('tags', JSON.stringify(['自检', 'fixtures']));
  fd.set('paths', JSON.stringify(files.map((f) => f.rel)));
  for (const f of files) {
    const buf = fs.readFileSync(f.abs);
    fd.append('files', new File([buf], path.basename(f.rel)), path.basename(f.rel));
  }
  const { res, data } = await json('/api/projects', { method: 'POST', body: fd });
  if (res.status === 200 && data?.project?.id) {
    projectId = data.project.id;
    ok(`上传成功 id=${projectId} files=${data.project.files.length} skipped=${JSON.stringify(data.skipped ?? [])}`);
  } else bad(`上传失败 status=${res.status} body=${JSON.stringify(data)}`);
}

console.log(`\n[4/8] 项目列表与仓库页`);
let project = null;
{
  const { data } = await json('/api/projects');
  project = (data?.projects ?? []).find((p) => p.id === projectId) ?? null;
  if (project) ok(`项目出现在列表中（title=${project.title} fileCount=${project.fileCount}）`);
  else bad('项目未出现在 /api/projects');
  const page = await req(`/projects/${projectId}`);
  const html = await page.text();
  if (page.status === 200 && html.includes('src/index.ts') && html.includes('media/demo.mp4')) ok('仓库页渲染出文件表格');
  else bad(`仓库页异常 status=${page.status}`);
}

console.log(`\n[5/8] 代码 / Markdown / 图片 / 视频 浏览`);
for (const [rel, needle] of [
  ['src/index.ts', 'hljs'],
  ['README.md', 'markdown-body'],
  ['docs/guide.md', 'markdown-body'],
  ['images/diagram.png', '<img'],
]) {
  const res = await req(`/projects/${projectId}/blob/${rel}`);
  const html = await res.text();
  if (res.status === 200 && html.includes(needle)) ok(`${rel} 页面包含 ${needle}`);
  else bad(`${rel} 页面异常 status=${res.status} needle=${needle}`);
}
{
  const res = await req(`/projects/${projectId}/blob/media/demo.mp4`);
  const html = await res.text();
  if (res.status === 200 && html.includes('<video')) ok('视频页渲染 <video>');
  else bad(`视频页异常 status=${res.status}`);
  const range = await req('/api/files/' + projectId + '/media/demo.mp4', { headers: { range: 'bytes=0-1023' } });
  if (range.status === 206 && range.headers.get('accept-ranges') === 'bytes') {
    const buf = Buffer.from(await range.arrayBuffer());
    ok(`Range 请求 206，返回 ${buf.length} 字节，Content-Range=${range.headers.get('content-range')}`);
  } else bad(`Range 请求异常 status=${range.status}`);
  const img = await req('/api/files/' + projectId + '/images/diagram.png');
  if (img.status === 200 && (img.headers.get('content-type') ?? '').startsWith('image/')) ok('图片可下载且 content-type=image/*');
  else bad(`图片请求异常 status=${img.status}`);
}

console.log(`\n[6/8] 首页 / 组页 / 未登录拦截`);
{
  const home = await req('/');
  const homeHtml = await home.text();
  if (home.status === 200 && homeHtml.includes('端到端自检项目')) ok('首页「最新上传」出现新项目');
  else bad(`首页异常 status=${home.status}`);
  const group = await req('/groups/project');
  if (group.status === 200) ok('组页可访问');
  else bad(`组页异常 status=${group.status}`);
  const upload = await req('/upload');
  if (upload.status === 200) ok('登录后上传页可访问');
  else bad(`上传页异常 status=${upload.status}`);
}

console.log(`\n[7/8] 管理员操作（置顶 / 角色 / 删除）`);
{
  const pin = await json(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pinned: true }),
  });
  const after = await json('/api/projects');
  const pinnedNow = (after.data?.projects ?? []).find((p) => p.id === projectId)?.pinned;
  if (pin.res.status === 200 && pinnedNow === true) ok('管理员置顶成功（列表已生效）');
  else bad(`置顶失败 status=${pin.res.status} pinned=${pinnedNow}`);

  // 用户管理接口只有按 id 操作，这里直接用 data/db.json 取测试账号 id（本地演示）
  const db = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/db.json'), 'utf-8'));
  const me = (db.users ?? []).find((u) => u.username === 'tester');
  if (me) ok(`数据库中可读到 tester role=${me.role}`);
  else bad('数据库中找不到 tester');

  const role = await json(`/api/admin/users/${me.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role: 'admin' }),
  });
  if (role.res.status === 200 && role.data?.user?.role === 'admin') ok('角色修改成功');
  else bad(`角色修改失败 status=${role.res.status}`);

  const adminPage = await req('/admin');
  const adminHtml = await adminPage.text();
  if (adminPage.status === 200 && adminHtml.includes('tester')) ok('管理页可访问且列出用户');
  else bad(`管理页异常 status=${adminPage.status}`);
}

console.log(`\n[8/8] 清理测试数据`);
{
  const del = await json(`/api/projects/${projectId}`, { method: 'DELETE' });
  if (del.res.status === 200) ok('测试项目已删除');
  else bad(`删除项目失败 status=${del.res.status}`);
  const db = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/db.json'), 'utf-8'));
  const tester = (db.users ?? []).find((u) => u.username === 'tester');
  if (tester) {
    const delUser = await json(`/api/admin/users/${tester.id}`, { method: 'DELETE' });
    if (delUser.res.status === 200) ok('测试用户已删除');
    else bad(`删除用户失败 status=${delUser.res.status}`);
  }
  const left = await json('/api/projects');
  if ((left.data?.projects ?? []).length === 0) ok('项目列表已清空');
  else bad('仍有残留项目');
}

console.log(failed === 0 ? '\nALL_E2E_OK' : `\nE2E_FAILED (${failed})`);
process.exit(failed === 0 ? 0 : 1);
