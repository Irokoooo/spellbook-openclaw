import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const SKILL_GENERATOR_PROMPT = `你是一名 AI 助手，专门帮助用户设计 AI Skill（技能）。

一个 Skill 由以下部分组成：
1. name: 技能名称（简短，5字以内）
2. description: 一句话描述（20字以内）
3. form_fields: 用户需要填写的输入字段列表
4. prompt: 发给 AI 的系统提示词

你的任务：根据用户描述的需求，生成完整的 Skill 配置，并以 JSON 格式输出。

输出格式（严格放在代码块里）：
\`\`\`json
{
  "name": "技能名称",
  "description": "一句话描述",
  "form_fields": [
    {
      "name": "field_key",
      "label": "显示标签",
      "type": "text",
      "placeholder": "提示文字",
      "required": true
    }
  ],
  "prompt": "完整的系统提示词，要详细、专业、结构清晰"
}
\`\`\`

然后在 JSON 后面用一段话解释设计思路，并询问用户是否满意或需要调整。

设计原则：
- form_fields 只保留真正必要的输入，1-4个字段为宜
- type 只能是 text / textarea / select / number 之一
- select 类型需要加 "options": ["选项1", "选项2"]
- prompt 要详细，包含角色定位、输出格式要求、注意事项
- 语言全部用中文`

function getAIClient(): OpenAI {
  const apiKey = process.env.AI_API_KEY
  const baseURL = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1'
  if (!apiKey) throw new Error('AI_API_KEY 环境变量未配置')
  return new OpenAI({ apiKey, baseURL })
}

function getModel(): string {
  return process.env.AI_MODEL || 'deepseek-chat'
}

// SSE helper
function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json()
  const { message, history = [], action, skillJson, thinkingMode = 'off' } = body as {
    message?: string
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
    action?: string
    skillJson?: Record<string, unknown>
    thinkingMode?: 'off' | 'high'
  }

  // action=save: insert skill into DB (no streaming needed)
  if (action === 'save') {
    if (!skillJson) {
      return new Response(JSON.stringify({ error: 'skillJson required' }), { status: 400 })
    }
    const { data, error } = await supabase
      .from('skills')
      .insert({ user_id: user.id, ...skillJson, enabled: true })
      .select()
      .single()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify({ skill: data }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!message) {
    return new Response(JSON.stringify({ error: 'message required' }), { status: 400 })
  }

  const abortController = new AbortController()
  request.signal.addEventListener('abort', () => abortController.abort())

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)))
      }

      const STAGES = [
        { emoji: '🔍', text: '理解你的需求中...' },
        { emoji: '🧱', text: '设计输入字段...' },
        { emoji: '✍️', text: '撰写 Skill 提示词...' },
        { emoji: '✨', text: '最后润色中...' },
      ]

      let stageIdx = 0
      send({ type: 'stage', ...STAGES[stageIdx] })

      const stageTicker = setInterval(() => {
        stageIdx = Math.min(stageIdx + 1, STAGES.length - 1)
        send({ type: 'stage', ...STAGES[stageIdx] })
      }, 4000)

      try {
        const client = getAIClient()
        const model = getModel()

        // Build message history: system prompt + prior turns + current message
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: SKILL_GENERATOR_PROMPT },
          ...history,
          { role: 'user', content: message },
        ]

        const extra: Record<string, unknown> = {}
        if (thinkingMode === 'high') {
          extra.thinking = { type: 'enabled', budget_tokens: 8000 }
        }

        const completion = await client.chat.completions.create({
          model,
          messages,
          max_tokens: 4096,
          ...extra,
        }, { signal: abortController.signal })

        clearInterval(stageTicker)

        const reply = completion.choices[0]?.message?.content ?? ''

        // Extract ```json ... ``` block
        const jsonMatch = reply.match(/```json\s*([\s\S]*?)```/)
        let parsedSkill = null
        if (jsonMatch?.[1]) {
          try { parsedSkill = JSON.parse(jsonMatch[1].trim()) } catch { /* not valid yet */ }
        }

        send({ type: 'done', reply, parsedSkill })
      } catch (err: unknown) {
        clearInterval(stageTicker)
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
