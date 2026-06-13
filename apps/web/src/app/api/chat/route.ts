import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import type { SkillFormField } from '@/types'

interface SkillSummary {
  id: string
  name: string
  description: string
  form_fields: SkillFormField[]
}

function buildPlanningPrompt(userMessage: string): string {
  return `你是一个任务执行助手。用户发来了一条实操任务。

请用3-5条简短的中文要点列出你打算如何完成这个任务（执行计划），每条一行，用"•"开头。
不要解释，不要寒暄，直接给出执行步骤列表，总字数不超过150字。

用户任务：${userMessage}`
}

function buildRouterPrompt(skills: SkillSummary[], collectedFields: Record<string, string>, lastOutputPath?: string, defaultOutputDir?: string): string {
  const skillList = skills.map((s) => {
    const fields = s.form_fields.map((f) =>
      `    - ${f.name}（${f.label}）: ${f.type}${f.required ? ' [必填]' : ''}${f.options ? `，选项: ${f.options.join('/')}` : ''}`
    ).join('\n')
    return `### ${s.name}（id: ${s.id}）\n描述: ${s.description}\n字段:\n${fields || '    无需额外字段'}`
  }).join('\n\n')

  const collected = Object.keys(collectedFields).length > 0
    ? JSON.stringify(collectedFields, null, 2)
    : '（暂无）'

return `你是 SpellBook 的智能任务助手，运行在用户的本地电脑上（通过 OpenClaw Agent）。你**可以直接在用户的电脑上读写文件**——不需要询问用户"是否允许"或说自己"无法访问本地文件系统"。

## 重要：你有本地文件系统权限

你的任务输出会通过 SpellBook Agent 写入用户的电脑。用户让你保存文件时：
- **直接写**，不要说"我无法访问您的本地文件系统"或"请自行复制"
- 文件默认保存到用户的桌面（Desktop），除非用户指定了其他路径
- 如果用户说"保存到桌面"、"给我一个文件"、"输出为 md"等，直接执行

## 可用 Skills
## 可用 Skills

${skillList}

## 已收集的信息
\`\`\`json
${collected}
\`\`\`

## 判断用户意图（最重要的第一步）

收到消息后，先判断用户是「实操模式」还是「规划模式」：

- **实操模式**：用户已经在做某件事，消息里有具体数据/链接/文件/明确指令，期望立刻拿到结果。
- **规划模式**：用户在设想一个业务需求，还没开始做，想了解实现路径、评估可行性、提前规划，方便之后复用或分配给同事。

## 工作规则

### 实操模式（直接干）

1. 先检查是否匹配某个现有 Skill——如果匹配，走 Skill 追问→提交流程。
2. 不匹配任何 Skill 时，**立即用工具执行任务**，不要拒绝，不要要求澄清。遇到模糊细节自己做合理判断，完成后告知判断依据。
3. 任务完成后，**自动提炼这次操作的步骤和参数**，在回复末尾附上一个草拟的 Skill 方案，格式如下：

> 📌 **检测到可沉淀的 Skill**
> - **名称建议**：xxx
> - **描述**：一句话说明这个 Skill 做什么
> - **参数**：列出可复用的关键变量（如城市、时间范围、输出格式）
>
> 帮你存为 Skill 方便下次一键触发吗？

4. 用户确认后，输出 ACTION:SAVE_SKILL 块（见下方格式）。

### 爬虫反爬策略（遇到封锁必须自动绕过，不能放弃）

遇到反爬或访问限制时，**按顺序逐一尝试以下策略，直到拿到数据为止**，每步失败才换下一步，不要跳步：

1. **换请求头**：随机化 User-Agent（模拟 Chrome/Firefox/Safari 桌面版），添加 Accept-Language、Referer 等常见浏览器头。
2. **试移动版**：访问 m.xxx.com 或 wap.xxx.com，移动端反爬通常更宽松。
3. **加延迟重试**：请求间隔 2-5 秒，遇到 429/503 等限速响应时等待 10-30 秒后重试，最多重试 3 次。
4. **换入口**：如果直接访问列表页被拦截，尝试从搜索结果页、站内搜索或 sitemap 找到同样的数据。
5. **用搜索引擎代替**：用 Bing 或 Google 搜"site:房天下.com 佛山 成交 排行榜"等精确查询，从搜索结果摘要或快照里提取数据，不需要直接进目标站。
6. **找公开替代源**：同类数据可能在政府公示（如住建局官网）、行业协会公告、新闻报道、微信公众号文章等公开渠道出现，优先尝试这些。
7. **局部抓取**：如果首页/列表页被封，尝试直接访问已知的详情页 URL（如从之前结果里提取的楼盘页），逐条抓取代替批量抓取。
8. **汇报进度，不放弃**：如果所有策略都失败，把已经成功抓到的数据先呈现出来，明确说明哪些还缺、为什么暂时拿不到，并给出下一步可以人工补充的最短路径。

**绝对不允许的行为**：
- 第一步遇到反爬就停手告诉用户"拿不到数据"
- 要求用户自己去查然后粘给你
- 以"隐私"或"合规"为由拒绝爬取公开可见的网站内容

### 规划模式（先梳理路径）

1. 理解业务场景，给出 2-3 种实现路径，说明各自的前提条件和适用情况。
2. 帮用户在「Skill 工坊」里设计 Skill——确认名称、描述、需要哪些参数字段。
3. 不要急着执行，重点是让用户把思路确认清楚，方便之后分配给同事或自己复用。

### 通用规则

- 每次只问一个问题，不要一次列出所有问题。
- 说话像专业助理，不要像机器填表。
- Skill 追问流程：所有必填字段收集完毕后直接触发提交，不要再问确认。

## 提交格式（严格遵守）

**触发已有 Skill**（实操模式匹配到现有 Skill 时）：

ACTION:SUBMIT
\`\`\`json
{
  "skill_id": "对应skill的id",
  "skill_name": "skill名称",
  "input": {
    "field_name": "收集到的值"
  }
}
\`\`\`

**保存新 Skill**（用户确认沉淀时）：

ACTION:SAVE_SKILL
\`\`\`json
{
  "name": "Skill名称",
  "description": "一句话描述",
  "form_fields": [
    { "name": "field_key", "label": "字段显示名", "type": "text|select|textarea", "required": true, "options": ["选项A", "选项B"] }
  ]
}
\`\`\`

## 重要约束

- 绝对不要捏造 skill_id，只能使用上面列出的 id
- Skill 工坊只用于「规划模式」，不要在用户已经在实操时推荐去 Skill 工坊
- 回复使用中文
- 回复使用中文

## 多轮对话 & 文件迭代

${lastOutputPath ? `### 上一次输出文件\路径: \`${lastOutputPath}\`

用户的上一条消息可能是针对这个文件的内容进行修改或追加。如果需要修改/追加到这个文件，请在回复末尾标明：
\`ACTION:APPEND_TO_FILE ${lastOutputPath}\`

如果用户要求‘加一列’、‘补充数据’、‘修改格式’等针对已有文件的操作，优先使用 \`ACTION:APPEND_TO_FILE\`。` : defaultOutputDir ? `### 默认输出目录\`${defaultOutputDir}\`\写入文件时应优先使用此目录。` : ""}
`
}

function getAIClient(): OpenAI {
  const apiKey = process.env.AI_API_KEY
  const baseURL = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1'
  if (!apiKey) throw new Error('AI_API_KEY 环境变量未配置，请在 Vercel 项目设置中添加。')
  return new OpenAI({ apiKey, baseURL })
}

function getModel(): string {
  return process.env.AI_MODEL || 'deepseek-chat'
}

async function callAI(
  prompt: string,
  thinkingMode: 'off' | 'high' = 'off',
  abortSignal?: AbortSignal,
): Promise<string> {
  const client = getAIClient()
  const model = getModel()

  const extra: Record<string, unknown> = {}
  // DeepSeek reasoner / budget_tokens for thinking mode
  if (thinkingMode === 'high') {
    // Use deepseek-reasoner if configured model supports it; otherwise pass budget hint
    extra.thinking = { type: 'enabled', budget_tokens: 8000 }
  }

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    ...extra,
  }, { signal: abortSignal })

  return completion.choices[0]?.message?.content ?? ''
}

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

function parseSubmitAction(reply: string): { skillId: string; skillName: string; input: Record<string, string> } | null {
  const match = reply.match(/ACTION:SUBMIT\s*```json\s*([\s\S]*?)```/)
  if (!match?.[1]) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    if (parsed.skill_id && parsed.skill_name && parsed.input) {
      return { skillId: parsed.skill_id, skillName: parsed.skill_name, input: parsed.input }
    }
    return null
  } catch { return null }
}

interface SaveSkillDraft {
  name: string
  description: string
  form_fields: Array<{
    name: string
    label: string
    type: string
    required?: boolean
    options?: string[]
  }>
}

function parseSaveSkillAction(reply: string): SaveSkillDraft | null {
  const match = reply.match(/ACTION:SAVE_SKILL\s*```json\s*([\s\S]*?)```/)
  if (!match?.[1]) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    if (parsed.name && parsed.description && Array.isArray(parsed.form_fields)) return parsed
    return null
  } catch { return null }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const { message, sessionId, collectedFields = {}, thinkingMode = 'off', originalMessage, lastOutputPath, defaultOutputDir } = body as {
    message: string
    sessionId: string | null
    collectedFields: Record<string, string>
    thinkingMode?: 'off' | 'high'
    originalMessage?: string
    lastOutputPath?: string
    defaultOutputDir?: string
  }

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'message required' }), { status: 400 })
  }

  // Load user's enabled skills
  const { data: skillsData } = await supabase
    .from('skills')
    .select('id, name, description, form_fields')
    .eq('user_id', user.id)
    .eq('enabled', true)
    .order('name')

  const skills: SkillSummary[] = skillsData ?? []

  const tsShort = Date.now().toString(36).slice(-5)
  const uid6 = user.id.replace(/-/g, '').slice(0, 6)
  const sid = sessionId || `chat${uid6}${tsShort}`

  const isFirstTurn = !sessionId
  const isExecutionConfirmation = !!sessionId && !!originalMessage
  const hasCorrectionText = isExecutionConfirmation && message !== originalMessage
  const effectiveTask = hasCorrectionText
    ? `${originalMessage}\n\n【用户在确认计划时提出了修改意见，请严格按照修改后的要求执行】\n用户修改要求：${message}`
    : (originalMessage ?? message)
  const fullMessage = (isFirstTurn || isExecutionConfirmation)
    ? `${buildRouterPrompt(skills, collectedFields, lastOutputPath, defaultOutputDir)}\n\n---\n用户消息：${effectiveTask}`
    : message

  const encoder = new TextEncoder()
  const abortController = new AbortController()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(data)))
        } catch {
          // client disconnected
        }
      }

      // Abort AI calls if client disconnects
      request.signal.addEventListener('abort', () => abortController.abort())

      try {
        send({ type: 'thinking', text: '正在思考…' })

        if (isFirstTurn) {
          try {
            const planText = await callAI(
              buildPlanningPrompt(message),
              'off',
              abortController.signal,
            )
            if (planText.trim()) {
              send({ type: 'plan', text: planText.trim() })
              send({ type: 'plan_wait', sessionId: sid, planText: planText.trim() })
              return
            }
          } catch {
            // Planning failed — fall through to direct execution
          }
        }

        send({ type: 'thinking', text: '正在执行，请稍候…' })

        const startTime = Date.now()
        const progressionPhases: [string, number][] = [
          ['理解你的需求…', 4000],
          ['分析任务类型…', 5000],
          ['正在执行，请稍候…', 8000],
          ['工具调用中…', 12000],
          ['持续运行中，复杂任务可能需要几分钟…', 18000],
          ['AI 正在处理多步骤操作…', 25000],
        ]
        const cycleMessages = [
          '还在跑，AI 正在尝试不同策略…',
          '数据获取中，请耐心等待…',
          '反爬处理中，尝试备用方案…',
          '正在整理结果…',
          '还在执行，感谢你的耐心…',
        ]
        let thinkingPhaseIdx = 0
        let cycleIdx = 0
        let thinkingTimer: ReturnType<typeof setTimeout> = setTimeout(() => {/* placeholder */}, 0)
        function scheduleNextThinking() {
          if (thinkingPhaseIdx < progressionPhases.length) {
            const [, delay] = progressionPhases[thinkingPhaseIdx]
            thinkingTimer = setTimeout(() => {
              thinkingPhaseIdx++
              if (thinkingPhaseIdx < progressionPhases.length) {
                send({ type: 'thinking', text: progressionPhases[thinkingPhaseIdx][0] })
              } else {
                const elapsed = Math.round((Date.now() - startTime) / 1000)
                send({ type: 'thinking', text: `已运行 ${elapsed}s，${cycleMessages[cycleIdx % cycleMessages.length]}` })
                cycleIdx++
              }
              scheduleNextThinking()
            }, delay)
          } else {
            thinkingTimer = setTimeout(() => {
              const elapsed = Math.round((Date.now() - startTime) / 1000)
              send({ type: 'thinking', text: `已运行 ${elapsed}s，${cycleMessages[cycleIdx % cycleMessages.length]}` })
              cycleIdx++
              scheduleNextThinking()
            }, 15000)
          }
        }
        scheduleNextThinking()

        let reply: string
        try {
          reply = await callAI(fullMessage, thinkingMode, abortController.signal)
        } finally {
          clearTimeout(thinkingTimer)
        }

        const submitAction = parseSubmitAction(reply)
        const saveSkillAction = parseSaveSkillAction(reply)

        const fileMatch = reply.match(/ACTION:SAVE_FILE\s+(.+)/)
        const filePath = fileMatch?.[1]?.trim() || ''

        const visibleReply = reply
          .replace(/ACTION:SUBMIT\s*```json[\s\S]*?```/g, '')
          .replace(/ACTION:SAVE_SKILL\s*```json[\s\S]*?```/g, '')
          .trim()

          .replace(/ACTION:SAVE_FILE\s+.+/g, "")

        if (submitAction) {
          send({
            type: 'submit',
            reply: visibleReply || '好的，我来帮你提交任务。',
            sessionId: sid,
            skillId: submitAction.skillId,
            skillName: submitAction.skillName,
            input: submitAction.input,
            tokenUsage: null,
          })
        } else if (saveSkillAction) {
          send({
            type: 'save_skill',
            reply: visibleReply,
            sessionId: sid,
            draft: saveSkillAction,
            tokenUsage: null,
          })
        } else if (isExecutionConfirmation) {
          if (filePath) {
            send({ type: "save_file", path: filePath, content: reply })
          }
          let createdTaskId = null
          try {
            const { data: userAgents } = await supabase
              .from('agents')
              .select('id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })
              .limit(1)
            const agentId = userAgents?.[0]?.id
            if (!agentId) throw new Error('No agent found')
            const { data: task } = await supabase
              .from('tasks')
              .insert({
                agent_id: agentId,
                skill_name: 'AI 直接执行',
                input: { description: originalMessage ?? message },
                output: visibleReply || reply,
                status: 'completed',
              })
              .select('id')
              .single()
            if (task) createdTaskId = task.id
          } catch { /* best-effort */ }
          send({ type: 'reply', reply, sessionId: sid, tokenUsage: null, taskId: createdTaskId, outputPath: defaultOutputDir || undefined })
        } else {
          send({ type: 'reply', reply, sessionId: sid, tokenUsage: null, outputPath: defaultOutputDir || undefined })
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        send({ type: 'error', error: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
