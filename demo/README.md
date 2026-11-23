# 社区项目站 Demo（Discourse 设计语言版）

纯静态 HTML/CSS/JS 演示：无框架、无依赖、无构建步骤。
用浏览器直接打开 `index.html` 即可查看（建议桌面浏览器，本期电脑优先）。

> 2026.11.23 起，Demo 视觉全面改为参照 [discourse.org](https://www.discourse.org/) 的设计语言，**废弃此前的黑白线框样式**（公告条、marquee、线框元素已移除）。
> 采集数据（截图 / CSS / 资源）保存在 `D:\Blog\copycat\www.discourse.org`，本目录的 `style.css` 依据其设计令牌重写。

## 文件清单

| 文件 | 说明 |
| --- | --- |
| `index.html` | 首页：社区介绍 hero + 三组跳转卡片 + 社区数据带 + 页脚 |
| `groups/project.html` | 项目组主页：置顶项目区 + 全部项目区 |
| `groups/rd.html` | 研发组主页（同布局，数据占位） |
| `groups/design.html` | 设计组主页（同布局，数据占位） |
| `groups/project/showcase.html` | 项目展示页（示例项目，占位） |
| `groups/project/detail.html` | 项目详情页（示例项目，占位） |
| `style.css` | 全站样式：Discourse 设计令牌 + 全部组件（约 940 行） |
| `main.js` | 交互：导航滚动状态 / 汉堡菜单 / 关于下拉 / 视频按钮反馈（无依赖） |
| `assets/fonts/` | Inter Variable 与 Kaio Black 本地字体文件（见下方字体说明） |
| `screens/` | Playwright 截图：6 页 × 桌面（1440px）+ 移动（390px），共 12 张 |
| `check_html.py` / `check_links.py` | 自检脚本：标签配对 / 相对链接存在性 |

## 页面与 PRD / 网站地图对应关系

| Demo 文件 | 页面 | 优先级 | 本期做？ | 建议路由（待确认） |
| --- | --- | --- | --- | --- |
| `index.html` | 首页 | P0 | 做 | `/` |
| `groups/project.html` | 项目组项目首页 | P1 | 做 | `/groups/project` |
| `groups/rd.html` | 研发组项目首页 | P1 | 做 | `/groups/rd` |
| `groups/design.html` | 设计组项目首页 | P1 | 做 | `/groups/design` |
| `groups/project/showcase.html` | 项目展示页（项目组 · 示例项目） | P2 | 做（Demo） | `/groups/project/{project}` |
| `groups/project/detail.html` | 项目详情页（项目组 · 示例项目） | P3 | 做（Demo） | `/groups/project/{project}` 二级页面 |

页面链路按 PRD 第 02 章范围表实现：项目组主页 → 项目展示页 → 项目详情页。
研发组 / 设计组暂无展示页 Demo，卡片维持不可点击（F-05）。

## 设计来源与设计令牌

参照 discourse.org 首页（2026.11.23 采集），核心令牌如下（详见 `style.css` 顶部 `:root`）：

| 类别 | 令牌 |
| --- | --- |
| 色彩 | 页面底 `#f9f8fc`；正文 `#333638`；次要 `#6b7280`；主色紫 `#7b5fe2`（hover `#8b6df8`）；链接紫 `#503281`；深紫 `#4a3574` / `#33254f`；深色区块 `#000`；页脚渐变 `#f9f8fc → #e0d5ff`，页脚文字 `#80719f`；点缀蓝 `#28abe2`、绿 `#4ba458`、橙 `#f15c22`、黄 `#fff470` |
| 字体 | 展示标题 Kaio Black（900，letter-spacing -0.03em）；正文 Inter Variable（400/500/700）；中文回退系统字体（见下方说明） |
| 字号 | xs .75rem / sm .875rem / md 1rem / lg 1.125rem / xl 1.375rem / 2xl 2rem / 3xl 2.5rem / 4xl 3rem / 5xl 3.75rem |
| 间距 | 2 / 4 / 8 / 16 / 24 / 32 / 48 / 64 / 80 / 96 px |
| 圆角 | sm 4 / md 8 / lg 16 / round 100em（胶囊按钮） |
| 阴影 | 卡片 `0 1px 4px rgba(25,33,61,.05)`；导航 `0 4px 10px rgba(100,0,255,.06)` |
| 布局 | 容器最大 1290px、内容 1148px；断点 62em / 48em / 25rem |
| 动效 | 过渡 0.15–0.2s ease-in-out；hero 浮动图标 `hero-float` 动画；`prefers-reduced-motion` 降级 |

## 组件与页面结构

- **顶部导航**：固定定位，初始透明（深色 hero 上用白色文字 `has-light-nav`），滚动后变白底 + 阴影（`is-scrolled`）；含"关于"下拉与移动端汉堡菜单。
- **首页 hero**：深紫渐变底 + 模糊色斑 + 浮动彩色图标；Kaio 大标题、一句主张、胶囊主/次按钮、合作机构 Logo 带（占位）。
- **三组跳转卡片**（`.group-card`）：白底 16px 圆角 + 阴影、彩色圆形图标、特性清单、hover 上浮；三卡均链接对应组主页（F-02）。
- **社区数据带**（`.stat-card`）：深色区块 + 白色统计卡，大数字 + 小号标签（占位）。
- **组主页**：紧凑深色页头（面包屑 + 标题 + 一句介绍）+ 置顶项目区（`.pin-badge`，与普通卡同样式、可多个，F-03）+ 全部项目区（一项目一卡片，F-04，含空状态说明）。
- **项目展示页**：封面 + 简介两栏卡、meta 信息行、成果卡片 3 张、"进入项目详情"CTA。
- **项目详情页**：项目文件列表（文件/文件夹行 + 下载占位）、图文教程（16:9 配图占位）、视频教程（黑色 16:9 播放器占位：中央播放钮 + 播放/暂停/停止圆钮 + 进度条），三类均可缺项。
- **页脚**：浅紫渐变 + 5 列链接 + 社交圆图标 + 底部版权行（全站统一）。

## Demo 说明

- 全部文案、组介绍、项目数据、Logo 均为**占位**，待提供后替换（见 PRD 第 07 章素材清单）。
- 首页 CTA 平滑滚动用 CSS `scroll-behavior: smooth` 实现（F-01）；不支持时浏览器降级为瞬时定位。
- 三个组主页为同一布局，仅标题与数据不同（PRD 第 07 章共同规则）。
- 本 Demo **不是最终技术实现**：技术栈未确认（`docs/TECH_STACK.md` 尚不存在），确认后将按 Next.js App Router + TypeScript + Tailwind CSS 重建，届时按正式组件库（如 shadcn/ui）重新实现，不直接沿用本目录的 HTML/CSS。
- **字体授权**：Kaio 为商业字体，本 Demo 仅作效果试用；Inter 为开源字体（SIL Open Font License）。Kaio 不含中文字形，中文标题回退系统字体，观感与采样站存在差异——正式实现前需确认授权或替换中文展示字体。

## 检查与验证

- `python check_html.py`：6 个文件标签配对全部通过（ALL_HTML_OK）。
- `python check_links.py`：100 条站内链接全部可达（ALL_LINKS_OK，含 fragment）。
- Playwright 截图（`screens/`）：桌面 + 移动端共 12 张，无 console 错误、无网络请求失败。
- 渲染效果（字体、间距、动效的最终观感）**未逐像素比对**，需用户在浏览器中打开确认；比对命令可参考 copycat skill 的 `compare.mjs`。
