# 任务清单 · 社区项目站（本地服务器版）

> 与 `docs/PRD.md` 第 09 章验收标准、`docs/TECH_STACK.md` 对应。更新规则：每完成一项就改状态，不重写无关内容。
> 最近更新：2026.11.23。

## 阶段 0：静态 Demo（已完成，历史保留）

| # | 任务 | 状态 | 说明 |
| --- | --- | --- | --- |
| 0.1 | 搭建 web-app 工作区与文档目录 | 已完成 | 见 `README.md`、`docs/` |
| 0.2 | PRD 初版（01–10 章） | 已完成 | `docs/PRD.md` |
| 0.3 | 网站地图 | 已完成 | `docs/sitemap/sitemap.md` |
| 0.4 | 黑白线框 Demo（6 页） | 已完成 | `demo/`；2026.11.23 已备份为 `D:\Blog\backups\web-app-demo-20261123.zip` |
| 0.5 | 视觉改为 discourse.org 设计语言 | 已完成 | `demo/style.css`、`main.js`、6 个页面；采集数据 `D:\Blog\copycat\www.discourse.org` |

## 阶段 1：完整应用基础（已完成）

| # | 任务 | 状态 | 验证证据 |
| --- | --- | --- | --- |
| 1.1 | 初始化 Next.js 15 + React 19 + TS + Tailwind 3.4 | 已完成 | `npm run build` 通过（15 条路由） |
| 1.2 | 设计令牌与全站样式（紫色系、卡片、页脚、响应式） | 已完成 | `app/globals.css`、`tailwind.config.ts` |
| 1.3 | 开源中文字体（Noto Sans SC，替换 Kaio） | 已完成 | `app/fonts/`（404 条 @font-face，101 个 woff2） |
| 1.4 | 全站头部 / 页脚 / 图标组件 | 已完成 | `components/SiteHeader.tsx`、`SiteFooter.tsx`、`Icon.tsx` |
| 1.5 | 数据层 `lib/db.ts`（原子写） | 已完成 | `data/db.json` |
| 1.6 | 认证 `lib/auth.ts`（scrypt + 会话 cookie） | 已完成 | e2e 登录 / 退出 / 401 用例 |

## 阶段 2：账号系统（已完成）

| # | 任务 | 状态 | 验证证据 |
| --- | --- | --- | --- |
| 2.1 | 注册 / 登录 / 退出接口与页面 | 已完成 | `app/api/auth/*`、`app/login`、`app/register`；e2e 全绿 |
| 2.2 | 首个注册用户为管理员 | 已完成 | `lib/db.ts` 注册逻辑 |
| 2.3 | 管理员种子脚本（admin / abc123） | 已完成 | `scripts/seed-admin.mjs` |
| 2.4 | 登录态注入全站（头部入口、未登录拦截上传页） | 已完成 | `app/layout.tsx`、`app/upload/page.tsx` |
| 2.5 | 头部「退出登录」入口（桌面按钮 + 移动端菜单内全宽按钮，2026.11.23 追加） | 已完成 | `components/SiteHeader.tsx`、`components/LogoutButton.tsx`；点击后清 cookie 跳首页，`/dashboard` 需重新登录 |
| 2.6 | 修复移动端菜单白底白字（深色 hero 上面板链接不可见） | 已完成 | `app/globals.css` `.nav-open` 规则 |

## 阶段 3：上传与文件系统（已完成）

| # | 任务 | 状态 | 验证证据 |
| --- | --- | --- | --- |
| 3.1 | multipart 上传接口（校验 + 落盘 + 回滚） | 已完成 | `app/api/projects/route.ts` |
| 3.2 | 防目录穿越与路径规范化 | 已完成 | `lib/storage.ts` `safeRelativePath` / `resolveProjectFile` |
| 3.3 | 上传页（选择文件 / 选择文件夹 / 追加文件） | 已完成 | `app/upload/page.tsx`、`components/UploadForm.tsx` |
| 3.4 | 追加文件 / 跳过已存在路径 | 已完成 | `app/api/projects/[id]/route.ts` POST |
| 3.5 | 测试素材 `scripts/fixtures/` | 已完成 | 6 个文件（md / ts / png / mp4 / json） |

## 阶段 4：GitHub 风格仓库浏览（已完成）

| # | 任务 | 状态 | 验证证据 |
| --- | --- | --- | --- |
| 4.1 | 项目仓库页（目录树 + 文件表 + 徽章 + 操作） | 已完成 | `app/projects/[id]/page.tsx`；截图 `app-repo-*.png` |
| 4.2 | 文件浏览页（类型分流） | 已完成 | `app/projects/[id]/blob/[...path]/page.tsx` |
| 4.3 | 代码高亮（highlight.js） | 已完成 | 截图 `app-blob-code-*.png` |
| 4.4 | Markdown 渲染 + sanitize-html 消毒 | 已完成 | 截图 `app-blob-markdown-*.png` |
| 4.5 | 图片查看 | 已完成 | 截图 `app-blob-image-*.png` |
| 4.6 | 视频播放（HTTP Range + 播放 / 暂停 / 停止 + 进度条） | 已完成 | 截图 `app-blob-video-*.png`；e2e 校验 206 |
| 4.7 | 文件下载接口 | 已完成 | `app/api/files/[...path]/route.ts` |

## 阶段 5：我的项目与管理后台（已完成）

| # | 任务 | 状态 | 验证证据 |
| --- | --- | --- | --- |
| 5.1 | 我的项目页 | 已完成 | `app/dashboard/page.tsx` |
| 5.2 | 管理后台（统计卡 + 用户管理 + 项目管理） | 已完成 | `app/admin/page.tsx`；截图 `app-admin-*.png` |
| 5.3 | 置顶 / 取消置顶、删除项目（含磁盘目录） | 已完成 | e2e T-13 |
| 5.4 | 用户角色修改 / 删除用户（含会话与项目） | 已完成 | e2e T-14 |

## 阶段 6：验证与文档（已完成）

| # | 任务 | 状态 | 验证证据 |
| --- | --- | --- | --- |
| 6.1 | TypeScript 校验 | 已完成 | `npm run typecheck` 通过 |
| 6.2 | 生产构建 | 已完成 | `npm run build` 通过 |
| 6.3 | 端到端自检脚本 | 已完成 | `scripts/e2e-check.mjs` → ALL_E2E_OK |
| 6.4 | Playwright 截图自查（桌面 + 移动 14 张） | 已完成 | `screens/app-*.png`，全部 200、无 console 错误 |
| 6.5 | PRD 同步为本地完整应用版 | 已完成 | `docs/PRD.md`（01–10 章 + T-01~T-14） |
| 6.6 | TECH_STACK / TASKS / README 更新 | 已完成 | `docs/TECH_STACK.md`、本文件、`README.md` |
| 6.7 | sitemap 补本地应用路由 | 已完成 | `docs/sitemap/sitemap.md` |

## 阶段 7：待用户确认后进行

| # | 任务 | 状态 | 阻塞项 |
| --- | --- | --- | --- |
| 7.1 | 机构素材（Logo / 封面 / 社区文案）接入 | 待确认 | 素材未提供 |
| 7.2 | 正式色值（是否用机构品牌色替换主色紫） | 待确认 | 机构视觉规范未提供 |
| 7.3 | 项目名称"社区项目站"是否最终 | 待确认 | — |
| 7.4 | 部署到服务器 / 域名 / HTTPS | 待确认 | 用户确认本地运行；部署待定 |
| 7.5 | 数据层迁移 SQLite / Postgres | 待开始 | 依赖 7.4 |
| 7.6 | 登录限流、管理员口令更换 | 待开始 | 依赖 7.4 |
| 7.7 | 邮箱验证 / 找回密码 | 不在本期范围 | 后续版本 |
| 7.8 | 评论 / 通知等社区互动 | 不在本期范围 | 后续版本 |
| 7.9 | 完整手机端适配 | 待确认 | 时间待确认 |
| 7.10 | `docs/prd`、`docs/prototypes`、`docs/design` 空子目录是否清理 | 待确认 | 与既有扁平文档结构不一致 |
