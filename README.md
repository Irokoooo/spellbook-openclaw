# SpellBook - OpenClaw 智能工作台

> 让非技术用户也能驾驭 AI Agent 的力量

## 项目愿景

SpellBook 是一个 **OpenClaw 的可视化管理平台**，提供：
- 🎯 **对客户**：简洁的 Web 界面，像聊天一样调用定制好的 AI 技能
- 🛠️ **对开发者**：强大的 Skill 编排工具，快速响应客户需求

## 核心架构

```
┌─────────────────────────────────────────────────────┐
│              Web 控制台 (Next.js + Vercel)           │
│  聊天界面 │ Skill编辑器 │ 任务监控 │ 知识库管理       │
└─────────────────────┬───────────────────────────────┘
                      │ WebSocket
                      ▼
┌─────────────────────────────────────────────────────┐
│              Local Agent (Python)                    │
│  OpenClaw 调用 │ 爬虫执行 │ RAG引擎 │ 企微Hook       │
└─────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术选型 | 理由 |
|------|---------|------|
| 前端 | Next.js 15 + TailwindCSS + shadcn/ui | 快速开发、美观、SSR |
| 后端 | Next.js API Routes + Vercel | 免运维、自动扩缩 |
| 数据库 | Supabase (PostgreSQL) | 免费额度大、实时订阅 |
| 本地Agent | Python + FastAPI | 生态丰富、爬虫友好 |
| 通信 | Supabase Realtime | 免搭 WebSocket 服务 |

## 目录结构

```
SpellBook_OpenClaw/
├── apps/
│   ├── web/                 # Next.js 前端
│   └── local-agent/         # Python 本地代理
├── packages/
│   └── shared/              # 共享类型定义
├── docs/
│   ├── PRD.md              # 产品需求文档
│   └── ARCHITECTURE.md     # 架构设计
└── scripts/                 # 部署和工具脚本
```

## 快速开始

```bash
# 1. 安装依赖
cd apps/web && pnpm install

# 2. 配置环境变量
cp .env.example .env.local

# 3. 启动开发服务器
pnpm dev
```

## 开发路线图

详见 [docs/PRD.md](docs/PRD.md)
