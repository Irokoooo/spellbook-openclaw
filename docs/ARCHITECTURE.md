# SpellBook 架构设计

## 1. 系统架构图

```
                                   ┌─────────────────────┐
                                   │      用户设备        │
                                   │  (手机/电脑浏览器)   │
                                   └──────────┬──────────┘
                                              │ HTTPS
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Vercel Edge Network                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Next.js Application                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ │
│  │  │    Pages     │  │ API Routes   │  │  Server      │                  │ │
│  │  │  /dashboard  │  │  /api/tasks  │  │  Actions     │                  │ │
│  │  │  /chat       │  │  /api/skills │  │              │                  │ │
│  │  │  /skills     │  │  /api/agents │  │              │                  │ │
│  │  └──────────────┘  └──────┬───────┘  └──────────────┘                  │ │
│  └───────────────────────────┼────────────────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Supabase                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │   Auth       │  │   Realtime   │  │   Storage    │    │
│  │  - users     │  │  - 用户认证   │  │  - 任务推送   │  │  - 文档存储   │    │
│  │  - agents    │  │  - JWT       │  │  - 状态同步   │  │  (仅元数据)   │    │
│  │  - tasks     │  │              │  │              │  │              │    │
│  │  - skills    │  │              │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  └──────────────┘    │
└─────────────────────────────────────────────┼───────────────────────────────┘
                                              │ WebSocket (Realtime)
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Local Agent (用户电脑)                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Python FastAPI Service                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │ Task Runner  │  │ OpenClaw     │  │ Script       │               │  │
│  │  │ - 任务轮询    │  │ Wrapper      │  │ Executor     │               │  │
│  │  │ - 状态上报    │  │ - Skill执行  │  │ - 爬虫       │               │  │
│  │  │ - 结果回传    │  │ - 对话管理   │  │ - 数据处理   │               │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │  │
│  │                                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐                                 │  │
│  │  │ RAG Engine   │  │ Local DB     │                                 │  │
│  │  │ - 文档索引    │  │ - SQLite     │                                 │  │
│  │  │ - 向量检索    │  │ - 对话历史   │                                 │  │
│  │  └──────────────┘  └──────────────┘                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         OpenClaw Runtime                             │  │
│  │  - ~/.openclaw/openclaw.json                                         │  │
│  │  - Skills 目录                                                       │  │
│  │  - 模型配置 (deepseek)                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. 数据流

### 2.1 任务执行流程

```
用户操作                 云端                           本地Agent
────────────────────────────────────────────────────────────────────
  │                        │                              │
  │ 1. 选择Skill，输入参数  │                              │
  │ ─────────────────────> │                              │
  │                        │                              │
  │                        │ 2. 创建Task (status=pending) │
  │                        │ ─────────────────────────────>│ (Realtime推送)
  │                        │                              │
  │                        │                              │ 3. 拉取Task
  │                        │ <─────────────────────────────│
  │                        │                              │
  │                        │ 4. 更新status=running        │
  │ <───────────────────── │ <─────────────────────────────│
  │   (UI显示执行中)        │                              │
  │                        │                              │ 5. 执行OpenClaw
  │                        │                              │    Skill
  │                        │                              │
  │                        │ 6. 更新status=completed      │
  │                        │    + output                  │
  │ <───────────────────── │ <─────────────────────────────│
  │   (UI显示结果)          │                              │
```

### 2.2 Agent 心跳机制

```python
# Agent 每 30 秒上报心跳
async def heartbeat_loop():
    while True:
        await supabase.table('agents').update({
            'status': 'online',
            'last_seen': datetime.now()
        }).eq('id', agent_id)
        await asyncio.sleep(30)

# 云端判断离线：last_seen > 60秒前 → status = offline
```

### 2.3 离线任务排队

```
Agent离线时:
  Task 创建 → status = 'queued'
  
Agent上线时:
  1. 更新 agent.status = 'online'
  2. 查询 tasks where agent_id = ? and status = 'queued' order by created_at
  3. 依次执行
```

## 3. 安全设计

### 3.1 数据隔离原则

| 数据类型 | 存储位置 | 说明 |
|---------|---------|------|
| 用户账号 | Supabase | 邮箱、密码哈希 |
| Agent 元信息 | Supabase | ID、名称、状态 |
| Task 元信息 | Supabase | ID、状态、时间戳 |
| Task 输入/输出 | **本地** | 敏感业务数据不上云 |
| 文档内容 | **本地** | 知识库文档存本地 |
| 对话历史 | **本地** | 完整对话存本地 SQLite |

### 3.2 通信安全

```
Web ←→ Supabase: HTTPS + JWT
Agent ←→ Supabase: WSS + API Key (RLS 限制)
```

### 3.3 Row Level Security (RLS)

```sql
-- 用户只能看自己的 agents
CREATE POLICY "Users can only see own agents"
ON agents FOR SELECT
USING (auth.uid() = user_id);

-- 用户只能操作自己 agent 的 tasks
CREATE POLICY "Users can only see own tasks"
ON tasks FOR SELECT
USING (agent_id IN (
  SELECT id FROM agents WHERE user_id = auth.uid()
));
```

## 4. 目录结构详解

```
SpellBook_OpenClaw/
├── apps/
│   ├── web/                          # Next.js 前端应用
│   │   ├── app/                      # App Router
│   │   │   ├── (auth)/              # 认证相关页面组
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/         # 主应用页面组
│   │   │   │   ├── chat/
│   │   │   │   ├── tasks/
│   │   │   │   ├── skills/
│   │   │   │   └── settings/
│   │   │   ├── api/                 # API Routes
│   │   │   │   ├── tasks/
│   │   │   │   └── skills/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui 组件
│   │   │   ├── chat/                # 聊天相关组件
│   │   │   ├── skills/              # Skill相关组件
│   │   │   └── layout/              # 布局组件
│   │   ├── lib/
│   │   │   ├── supabase/            # Supabase 客户端
│   │   │   ├── hooks/               # 自定义 Hooks
│   │   │   └── utils/               # 工具函数
│   │   ├── types/                   # TypeScript 类型
│   │   └── package.json
│   │
│   └── local-agent/                  # Python 本地代理
│       ├── src/
│       │   ├── main.py              # 入口
│       │   ├── config.py            # 配置管理
│       │   ├── supabase_client.py   # Supabase 连接
│       │   ├── task_runner.py       # 任务执行器
│       │   ├── openclaw_wrapper.py  # OpenClaw 封装
│       │   └── scripts/             # 可执行脚本
│       │       └── crawlers/        # 爬虫脚本
│       ├── data/                    # 本地数据
│       │   ├── db.sqlite            # 本地数据库
│       │   └── knowledge/           # 知识库文档
│       ├── requirements.txt
│       └── pyproject.toml
│
├── packages/
│   └── shared/                       # 共享定义
│       └── types/                   # 跨端共享类型
│
├── docs/
│   ├── PRD.md                       # 产品需求文档
│   ├── ARCHITECTURE.md              # 架构设计（本文件）
│   └── API.md                       # API 文档
│
├── scripts/
│   ├── setup.sh                     # 初始化脚本
│   └── deploy.sh                    # 部署脚本
│
├── .env.example                     # 环境变量示例
├── README.md
└── package.json                     # Monorepo 根配置
```

## 5. 技术选型详解

### 5.1 为什么是 Next.js 15 + App Router

- **Server Components**: 减少客户端 JS，首屏快
- **Server Actions**: 简化表单处理，不用写 API
- **Streaming**: 流式渲染，AI 回复体验好
- **Vercel 部署**: 零配置，自动 CI/CD

### 5.2 为什么是 Supabase

- **免费额度大**: 500MB 数据库，5GB 带宽/月
- **Realtime 内置**: 不用自己搭 WebSocket
- **Auth 内置**: 不用自己写认证
- **RLS**: 数据库层面的权限控制

### 5.3 为什么 Agent 用 Python

- **OpenClaw 兼容**: 可能需要调用 Python 脚本
- **爬虫生态**: requests, playwright, scrapy
- **RAG 生态**: langchain, llama-index
- **打包简单**: PyInstaller 可打包成 exe

## 6. 扩展性考虑

### 6.1 多 Agent 支持

```
用户 A
├── Agent 1 (办公电脑)
├── Agent 2 (家里电脑)
└── Agent 3 (服务器)

每个 Agent 独立注册，任务可指定 Agent 执行
```

### 6.2 Skill 市场（未来）

```
官方 Skill 仓库
     ↓ 同步
用户 Skill 库
     ↓ 启用
Agent 可执行列表
```

### 6.3 插件机制（未来）

```python
# Agent 插件接口
class Plugin:
    async def on_task_start(self, task): pass
    async def on_task_complete(self, task, result): pass
    async def execute(self, action, params): pass

# 企微插件示例
class WeChatWorkPlugin(Plugin):
    async def execute(self, action, params):
        if action == 'send_message':
            return await self.send_message(params)
```
