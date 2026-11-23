# 社区项目站 · 本地完整应用

> 状态：**可运行**（2026.11.23）。Next.js 15 + React 19 + TypeScript + Tailwind 3.4，数据与文件都存在本机（本机即服务器）。
> 静态线框 / discourse.org 风格 Demo 保留在 [`demo/`](demo/README.md)，并已备份为 `D:\Blog\backups\web-app-demo-20261123.zip`。

## 这是什么

集中展示各开发组（项目组 / 研发组 / 设计组）项目的社区站点：注册登录后上传自己的项目，网页按上传内容渲染出 **GitHub 风格的仓库浏览**，代码可看、Markdown 图文可读、视频可播。

- 视觉：discourse.org 设计语言 + 紫色系（用户确认采用），展示字体用开源 **Noto Sans SC**（SIL OFL 1.1）
- 账号：注册 / 登录 / 退出；第一个注册用户为管理员；种子管理员 `admin` / `abc123`
- 上传：选择文件或**整个文件夹**（保留相对路径）、可追加文件、单文件 ≤ 2GB
- 浏览：目录树 + 文件表、代码高亮、Markdown 渲染、图片、视频（HTTP Range 边下边播）、下载
- 管理后台：统计、用户角色 / 删除、项目置顶 / 删除

## 快速开始

```bash
cd D:\Blog\web-app
npm install                  # 首次安装依赖
npm run seed:admin           # 创建 / 重置管理员（默认 admin / abc123）
npm run dev                  # 开发服务器：http://localhost:3000
```

生产模式：`npm run build && npm start`。

自检：

```bash
npm run typecheck            # TypeScript 校验
node scripts/e2e-check.mjs   # 端到端自检（需 dev server 已启动；自动注册测试用户并清理）
```

> 端口占用时用 `npm run dev -- -p 3001`。
> 环境变量：`ADMIN_USERNAME` / `ADMIN_PASSWORD`（仅 `npm run seed:admin` 读取）；会话 Cookie 为 `cp_session`（7 天）。

## 账号

| 账号 | 口令 | 角色 | 说明 |
| --- | --- | --- | --- |
| `admin` | `abc123` | 管理员 | `npm run seed:admin` 创建；**仅本地演示，对外使用前必须修改** |
| 自己注册 | 自设（≥6 位） | 普通用户 | 注册的第一个用户自动成为管理员 |

## 数据与文件位置

| 内容 | 位置 | 是否入库 |
| --- | --- | --- |
| 用户 / 项目 / 会话 | `data/db.json` | 否（`.gitignore` 忽略） |
| 上传文件本体 | `storage/projects/<项目 id>/<相对路径>` | 否 |
| 字体 | `app/fonts/files/*.woff2` | 是 |
| 测试素材 | `scripts/fixtures/` | 是 |
| 截图 | `screens/app-*.png` | 是 |

> 备份 = 复制 `data/` 与 `storage/` 两个目录。

## 目录结构

```
app/            页面与 API（App Router）
components/     客户端组件（头部 / 页脚 / 表单 / 播放器等）
lib/            数据、认证、存储、纯函数
scripts/        seed-admin.mjs、e2e-check.mjs、fixtures/
data/ storage/  运行期生成（不入库）
demo/           早期静态 Demo（历史保留）
docs/           PRD / TECH_STACK / TASKS / sitemap / design
screens/        Playwright 截图
```

详见 [docs/TECH_STACK.md](docs/TECH_STACK.md)。

## 页面与接口

| 路径 | 说明 |
| --- | --- |
| `/` | 首页：社区介绍、三组入口卡片、最新项目、CTA |
| `/groups/project`、`/groups/rd`、`/groups/design` | 组项目主页（置顶区 + 项目列表 + 空状态） |
| `/projects/[id]` | 项目仓库页（GitHub 风格目录树 + 文件表） |
| `/projects/[id]/blob/[...path]` | 文件浏览页（代码 / Markdown / 图片 / 视频 / 下载） |
| `/login`、`/register` | 登录 / 注册 |
| `/upload` | 上传项目（`?group=project` 预选组，`?project=[id]` 追加文件） |
| `/dashboard` | 我的项目 |
| `/admin` | 管理后台（仅管理员） |
| `/api/*` | auth / projects / files / admin 接口 |

## 上传与安全

- 相对路径经 `safeRelativePath()` 过滤（拒绝 `..`、绝对路径、非法字符），落盘后再校验前缀，防目录穿越。
- 上传失败自动回滚（删除已落盘目录），不留半成品项目。
- Markdown 渲染结果经 `sanitize-html` 白名单消毒。
- 口令用 `scrypt` 加盐散列存储；接口不返回 `passwordHash` / `salt`。

## 验收自查（2026.11.23）

- `npm run typecheck`、`npm run build` 通过（15 条路由）
- `node scripts/e2e-check.mjs` → **ALL_E2E_OK**（注册 / 登录 / 未登录 401 / 上传 6 文件 / 仓库页 / 代码 / Markdown / 图片 / 视频 206 / 置顶 / 删除 / 用户管理）
- Playwright 截图 14 张（桌面 + 移动）全部 200、无 console / page 错误：`screens/app-*.png`
- 人工验收请对照 `docs/PRD.md` 第 09 章 T-01~T-14

## 待确认

1. 项目名称"社区项目站"是否最终；机构 Logo / 封面 / 文案待提供。
2. 正式色值是否用机构品牌色替换主色紫 `#7b5fe2`。
3. 是否部署到服务器（域名 / HTTPS / 预算）；部署前需迁移数据库、改 `secure` Cookie、更换管理员口令。
4. 上传内容是否要"仅登录可见 / 仅自己可见"（当前全站公开）。
5. `docs/prd`、`docs/prototypes`、`docs/design` 空子目录是否清理。
