# SpellBook 开发进度

> 最后更新：2026-06-09

---

## 已完成

### 基础框架
- [x] 项目目录结构（monorepo，apps/web + apps/local-agent + packages/shared）
- [x] Next.js 15 App Router 搭建，TailwindCSS + shadcn/ui
- [x] Supabase 客户端配置（browser + server 两套）
- [x] TypeScript 类型定义（Agent、Skill、Task、Message 等）
- [x] 基础布局：侧边栏导航（Sidebar）+ AgentStatusBadge

### 用户认证
- [x] Supabase Auth 集成
- [x] 登录页面（/login）
- [x] 注册页面（/register）
- [x] Auth 路由布局隔离（(auth) 路由组）

### 聊天界面（/chat）
- [x] 自然语言对话界面，AI 助手通过对话收集任务参数
- [x] SSE 流式输出
- [x] 欢迎页快捷建议入口
- [x] 快速/深度思考模式切换（`thinkingMode: off | high`）
- [x] Realtime 订阅：任务状态变更实时反映到 TaskResult 卡片
- [x] 多轮对话状态维护（sessionId + collectedFields）
- [x] TaskResult 组件：展示任务状态、输入、输出

### 路由 API
- [x] `/api/chat`：调用 OpenClaw 做 Skill 路由 + 参数收集，解析 ACTION:SUBMIT 触发任务
- [x] `/api/skill-workshop`：AI 引导生成 Skill 配置（SSE + 多阶段进度）

### Skill 管理（/skills）
- [x] Skill 列表页：启用/禁用、编辑、删除
- [x] SkillEditor 组件：新建/编辑 Skill（名称、描述、form_fields、prompt）
- [x] Skill 工坊（/skills/workshop）：AI 对话式生成 Skill，右侧预览面板，一键保存

### 任务中心（/tasks）
- [x] 任务列表，按 all / active / completed / failed 筛选
- [x] 任务展开详情（输入、输出、错误）
- [x] 取消队列中的任务
- [x] Realtime 实时订阅（INSERT + UPDATE）

### 设置页（/settings）
- [x] 账号信息展示
- [x] Agent 注册（创建、复制 ID、删除）
- [x] Agent 在线/执行中/离线状态展示

### OpenClaw 集成
- [x] `runOpenclaw()` 封装：spawn node 直接调用 .mjs，绕过 Windows shell 分词问题
- [x] 支持 `--session-id`、`--thinking`、`--json` 参数

---

## 待完成

### 本地 Agent（apps/local-agent）
- [ ] Python FastAPI 框架搭建
- [ ] Supabase 连接（任务轮询 or Realtime 推送）
- [ ] 心跳上报（每 30s 更新 agent.status + last_seen）
- [ ] 任务拉取与执行（调用本地 OpenClaw CLI）
- [ ] 任务结果回传（output / error / status → Supabase）
- [ ] 离线任务排队恢复（上线后按 created_at 顺序执行 queued 任务）
- [ ] PyInstaller 打包成 exe

### Supabase 数据库
- [ ] 建表 SQL 脚本（users / agents / tasks / skills）
- [ ] RLS 策略配置
- [ ] 数据库迁移文件整理

### 功能补全
- [ ] Skill 表单：支持 select 类型的下拉选项编辑
- [ ] 任务输出 Markdown 渲染（当前为纯文本 pre）
- [ ] Agent 离线超时自动标记（last_seen > 60s → offline，建议用 Supabase Edge Function 或 pg cron）
- [ ] 移动端响应式适配（侧边栏折叠）

### 部署
- [ ] Vercel 环境变量配置（NEXT_PUBLIC_SUPABASE_URL 等）
- [ ] 本地 Agent 安装/启动文档
- [ ] .env.example 完整填写

---

## 当前主要工作项

1. **搭建 local-agent**：这是整个链路中唯一还没动的部分。Web 端任务提交已通，下一步需要 Python Agent 把任务真正跑起来。
2. **数据库初始化脚本**：Supabase 表结构目前只有类型定义，缺少可执行的建表 SQL。

---

## 技术债

| 项 | 描述 |
|----|------|
| Realtime RLS | tasks 的 Realtime 订阅需要 RLS 策略允许用户只收到自己 agent 的变更 |
| proxy.ts | `apps/web/src/proxy.ts` 用途待确认 |
| skill-workshop session | 工坊的 OpenClaw session 和 chat 的 session 是独立的，没有互通 |

---

## 2026-06-12 GitHub 推送

- **动作**：完成项目初始提交并推送到 GitHub
- **仓库**：[github.com/Irokoooo/spellbook-openclaw](https://github.com/Irokoooo/spellbook-openclaw)
- **分支**：main
- **提交**：94 个文件，含 web、local-agent、docs、scripts
- **配置**：Git 全局用户信息已写入全局控制台

---

## 2026-06-12 启动 & Vercel 部署

- **动作**：启动开发服务器 + 部署到 Vercel
- **本地**：http://localhost:3000（Next.js 16.2.7 + Webpack）
- **生产**：https://web-rho-puce-53.vercel.app
- **Vercel 项目**：serahinas-projects/web（已连接 GitHub）
- **环境变量**：已配置 NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY、NEXT_PUBLIC_APP_URL
- **构建状态**：✅ 14 个页面全部编译成功
- **注意**：vercel.json 从根目录移到 apps/web，移除了无效的 rootDirectory 字段

---

## 2026-06-12 Claude 主题系统 & 重新部署

- **动作**：合并 Claude 开发的三主题系统，提交推送并重新部署到 Vercel
- **提交**：8b3bcc6 - add @playwright/test dev dependency
- **三主题**：默认（锌色+紫罗兰）、典籍/Grimoire（暗棕黑+金色+Cormorant Garamond 字体）、工坊/Studio（暖奶油+赤陶+Nunito 字体）
- **主题切换**：侧边栏底部切换按钮，循环切换，localStorage 持久化，无 hydration 闪烁
- **验证**：Playwright 截图确认三个主题在生产环境渲染正确
- **构建性能**：缓存命中，构建时间从 39s 降至 26s

---

## 2026-06-12 Codex 全功能深度测试

- **动作**：用账号 2436698411@qq.com 深度测试生产环境各功能
- **环境**：https://web-rho-puce-53.vercel.app（Vercel 生产部署）
- **测试工具**：Node REPL + Playwright 自动化

### 测试结果

| 功能 | 结果 | 详情 |
|------|------|------|
| 登录/注册 | ✅ PASS | Supabase Auth 正常，/chat 页面加载 |
| 聊天对话 | ✅ PASS | 消息发送、流式响应正常 |
| Skill 管理 | ✅ PASS | 5 个 Skills 已创建：市场盘点助手、公司背景调研、营销文案生成、环境自检助手、解决方案撰写 |
| Skill 工坊 | ✅ PASS | /skills/workshop 页面正常 |
| 任务系统 | ✅ PASS | /tasks 页面加载正常 |
| 设置页 | ✅ PASS | 账号信息、Agent 注册（4efb146d）、Agent 在线状态正常 |
| 三主题切换 | ✅ PASS | 默认→典籍→工坊→默认 循环切换，data-theme 属性变化正确，无 UI 闪烁 |

### 本地 vs 部署对比
- 本地 dev server (localhost:3000) 与生产 (Vercel) UI 完全一致
- 背景色、样式表、data-theme 属性均匹配
- Vercel 构建缓存命中，部署正常

### 待办
- [ ] DeepSeek API Key：需在 DeepSeek 控制台删除泄露的 Key，生成新 Key 并更新到 ~/.openclaw/.env
- [ ] .env.local 干净，无硬编码 Key；.gitignore 已正确忽略 .claude/ 和 .env*
- [ ] 本地 Agent (Python) 尚未安装运行（下次测试重点）
