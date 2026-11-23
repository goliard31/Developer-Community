# 技术栈 · 社区项目站（本地服务器版）

> 状态：已确定并落地实现（2026.11.23）。本文与 `docs/PRD.md` 第 02 / 06 / 08 章、`docs/TASKS.md` 同步更新。
> 用户 2026.11.23 要求：开源中文字体、沿用紫色系、完整应用、登录注册、项目上传、GitHub 风格仓库浏览、Markdown 图文与视频播放、**本机即服务器（本地运行）**。

## 1. 已选技术栈

| 层 | 选型 | 版本 | 说明 |
| --- | --- | --- | --- |
| 框架 | Next.js（App Router） | 15.5 | 页面 + Route Handler 一体，SSG / SSR 混合 |
| UI | React | 19.3 | Server Components 为主，交互处用 `'use client'` |
| 语言 | TypeScript | 5.7（严格模式） | `npm run typecheck` 全量校验 |
| 样式 | Tailwind CSS | 3.4 | `tailwind.config.ts` 定义设计令牌；组件类写在 `app/globals.css` 的 `@layer components` |
| Markdown | marked | 15 | `.md` 渲染为 HTML |
| HTML 消毒 | sanitize-html | 2.18 | Markdown 渲染结果过白名单，防 XSS |
| 代码高亮 | highlight.js | 11.12 | 代码文件按语言高亮（含 TS / JS / JSON 等） |
| 数据层 | JSON 文件库 | — | `data/db.json`，`node:fs` 写入 tmp 文件后 rename（原子写） |
| 口令 | node:crypto `scrypt` + `timingSafeEqual` | Node 22+ 内置 | 不引入 bcrypt 等原生依赖 |
| 会话 | 自建 token + httpOnly Cookie | — | Cookie 名 `cp_session`，有效期 7 天，`sameSite=lax`；本地 http 下 `secure=false` |
| 字体 | Noto Sans SC（Google Fonts，SIL OFL 1.1） | 本地 woff2 分片 | 见第 5 节 |

Node 版本要求：**22+**（脚本使用内置 `node:sqlite` 无关特性，但 `FormData` / `crypto` API 需 22 以上；当前环境 Node v24.19.0）。

## 2. 目录结构

```
web-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 全站框架：头部 / 页脚 / 字体 / metadata
│   ├── globals.css             # 设计令牌 + @layer components 组件类
│   ├── fonts/                  # noto-sans-sc.css + files/*.woff2（101 个分片）
│   ├── page.tsx                # 首页
│   ├── groups/[group]/page.tsx # 三个组项目主页
│   ├── projects/[id]/page.tsx  # 项目仓库页（GitHub 风格）
│   ├── projects/[id]/blob/[...path]/page.tsx  # 文件浏览页
│   ├── login / register / upload / dashboard / admin/page.tsx
│   └── api/
│       ├── auth/{register,login,logout}/route.ts
│       ├── projects/route.ts                # 列表 + 上传
│       ├── projects/[id]/route.ts           # 追加文件 / 修改 / 删除
│       ├── files/[...path]/route.ts         # 文件读取（支持 HTTP Range）
│       └── admin/users/[id]/route.ts        # 角色 / 删除用户
├── components/                 # SiteHeader / SiteFooter / Icon / AuthForm / UploadForm /
│                               # ProjectActions / VideoPlayer / LogoutButton
├── lib/
│   ├── db.ts                   # 数据模型 + readDb / updateDb（原子写）
│   ├── auth.ts                 # scrypt 口令、会话、requireUser / requireAdmin
│   ├── storage.ts              # 上传落盘、目录树、文件类型判断、防目录穿越
│   ├── groups.ts               # 三个组的纯数据定义
│   └── format.ts               # 纯函数（formatSize / extname），客户端安全
├── scripts/
│   ├── seed-admin.mjs          # 创建 / 重置管理员账号
│   ├── e2e-check.mjs           # 端到端自检（Node fetch）
│   └── fixtures/               # 上传测试素材
├── data/db.json                # 用户 / 项目 / 会话（不入库）
├── storage/projects/<id>/      # 上传文件本体（不入库）
├── demo/                       # 早期静态线框 Demo（历史保留，已备份）
├── docs/                       # PRD / TECH_STACK / TASKS / sitemap / design
├── screens/                    # Playwright 截图（app-*.png）
├── tailwind.config.ts / postcss.config.mjs / next.config.mjs / tsconfig.json
└── README.md
```

## 3. 数据模型（`lib/db.ts`）

- `User`：`id, username, displayName, passwordHash, salt, role('admin'|'user'), createdAt`
- `Session`：`token, userId, createdAt, expiresAt`（退出 / 过期即失效）
- `ProjectFile`：`path, name, size, mime, kind('code'|'markdown'|'image'|'video'|'text'|'other'), uploadedAt, note?`
- `Project`：`id, title, description, tags[], group('project'|'rd'|'design'), ownerId, ownerName, pinned, createdAt, updatedAt, files[]`

规则：**注册的第一个用户自动成为管理员**；`scripts/seed-admin.mjs` 可随时创建 / 重置 `admin`。

## 4. 上传与文件安全

- 落盘路径：`storage/projects/<projectId>/<相对路径>`；相对路径统一 POSIX 分隔符。
- `safeRelativePath()` 拒绝 `..`、绝对路径、盘符、空段与非法字符；`resolveProjectFile()` 解析后再校验前缀，防目录穿越。
- 表单支持**选择文件夹**（`webkitdirectory`，保留相对路径）与**追加文件**（`/upload?project=<id>`）。
- 限制：单文件 ≤ 2GB、单次 ≤ 500 个文件、标题 2–60 字、标签 ≤ 8 个（`next.config.mjs` 中 `serverActions.bodySizeLimit: '2gb'`）。
- 上传失败会回滚：已落盘目录 `removeProjectDir()` 删除，不留半成品项目。
- 视频播放走 `app/api/files/[...path]`，支持 `Range` 请求（`206` + `Content-Range` + `Accept-Ranges`），可边下边播。

## 5. 字体与授权

- 中文 / 英文 / 数字统一 **Noto Sans SC**（SIL OFL 1.1，可商用、可再分发），本地 woff2 分片共 101 个（约 4.3MB），`app/fonts/noto-sans-sc.css` 404 条 `@font-face`。
- 2026.11.23 用户要求"换成开源中文字体，沿用紫色系"：此前的展示字体 Kaio Black 为**商业字体**，仅静态 Demo 试用，正式应用已替换；授权问题随之消解。
- 主色沿用 discourse.org 紫色系：`primary #7b5fe2`、`hover #8b6df8`、`link #503281`、`purple-700 #4a3574`、`purple-800 #33254f`。

## 6. 设计令牌（`tailwind.config.ts` + `app/globals.css`）

| 类别 | 值 |
| --- | --- |
| 颜色 | 背景 `#f9f8fc`、正文 `#333638`、muted `#6b7280`、主色 `#7b5fe2`、hover `#8b6df8`、链接 `#503281`、深色区块 `#000000`、强调 blue `#28abe2` / red `#d5342a` / green `#4ba458` / orange `#f15c22` |
| 字号 | xs .75 / sm .875 / md 1 / lg 1.125 / xl 1.375 / 2xl 2 / 3xl 2.5 / 4xl 3 / 5xl 3.75（rem） |
| 间距刻度 | 2 / 4 / 8 / 16 / 24 / 32 / 48 / 64 / 80 / 96（px） |
| 圆角 | sm 4 / md 8 / lg 16 / 胶囊 100em |
| 阴影 | card `0 1px 4px rgba(25,33,61,.05)`、header `0 4px 10px rgba(100,0,255,.06)` |
| 容器 | shell 1290px / inner 1148px |
| 断点 | tablet 48em / desktop 62em（移动优先） |

## 7. 已知取舍与后续建议

| 取舍 | 原因 | 后续建议 |
| --- | --- | --- |
| JSON 文件库而非 SQLite / Postgres | 零原生依赖、本地演示够用、可读可改 | 上服务器前迁移到 SQLite / Postgres，`lib/db.ts` 是唯一数据出口 |
| 自建会话而非 NextAuth | 依赖少、流程可控 | 如需 OAuth / 多设备管理再评估 NextAuth |
| 会话 Cookie `secure=false` | 本地 http 运行 | 上 HTTPS 后改 `true` |
| 管理员初始口令 `abc123` | 用户指定，仅本地演示 | 对外使用前必须修改，并加登录限流 |
| 上传内容全站公开 | 本期无权限细分需求 | 如需"仅登录可见 / 仅自己可见"，在 `app/projects/[id]` 与文件接口加判断 |
| 无单元测试 / CI | 以 `scripts/e2e-check.mjs` 端到端自检 + 人工验收为主 | 后续版本补 Vitest / Playwright 测试与 CI |

## 8. 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm install` | 安装依赖（首次） |
| `npm run seed:admin` | 创建 / 重置管理员（默认 `admin` / `abc123`，可用 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 覆盖） |
| `npm run dev` | 启动开发服务器（默认 http://localhost:3000） |
| `npm run typecheck` | TypeScript 全量校验 |
| `npm run build && npm start` | 生产构建与启动 |
| `node scripts/e2e-check.mjs` | 端到端自检（需 dev server 已启动；会自动注册测试用户并清理） |

> 截图脚本 `shot-app.mjs` / `shot-repo.mjs` 放在 `C:\Users\atom2\.dsh\skills\copycat\scripts\` 下运行（playwright 装在该目录），输出到 `web-app/screens/`。
