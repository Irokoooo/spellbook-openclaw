'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Wand2, Send, Check, RefreshCw, ChevronRight, Sparkles, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import type { SkillFormField } from '@/types'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

interface ParsedSkill {
  name: string
  description: string
  form_fields: SkillFormField[]
  prompt: string
}

interface Stage {
  emoji: string
  text: string
}

const STARTER_PROMPTS = [
  '我想做一个帮我写客户拜访跟进邮件的技能',
  '我需要一个分析竞品公司的工具，输入公司名就能出报告',
  '帮我做一个把会议记录整理成待办事项的技能',
  '我想快速生成项目投资回报分析',
]

const GUIDE_STEPS = [
  { emoji: '💡', text: '描述你想要的功能' },
  { emoji: '🤖', text: 'AI 自动生成 Skill' },
  { emoji: '✨', text: '打磨直到满意' },
  { emoji: '🚀', text: '一键保存使用' },
]

const REFINE_SUGGESTIONS = [
  '帮我增加一个城市选择字段',
  '让输出格式更简洁，去掉不必要的章节',
  '把提示词改得更专业一些',
  '增加示例输出格式',
]

export default function SkillWorkshopPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage | null>(null)
  const [parsedSkill, setParsedSkill] = useState<ParsedSkill | null>(null)
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setStage({ emoji: '🔍', text: '理解你的需求中...' })

    try {
      const res = await fetch('/api/skill-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.map(m => ({ role: m.role, content: m.content })) }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: '请求失败' }))
        toast.error(err.error || '请求失败')
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      // Consume SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        // Parse SSE lines
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'stage') {
              setStage({ emoji: event.emoji, text: event.text })
            } else if (event.type === 'done') {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: event.reply },
              ])
              if (event.parsedSkill) setParsedSkill(event.parsedSkill)
              setStage(null)
            } else if (event.type === 'error') {
              toast.error(event.error || 'AI 生成失败')
              setMessages((prev) => prev.slice(0, -1))
              setStage(null)
            }
          } catch { /* malformed line */ }
        }
      }
    } catch {
      toast.error('网络错误，请重试')
      setMessages((prev) => prev.slice(0, -1))
      setStage(null)
    } finally {
      setLoading(false)
      setStage(null)
    }
  }

  async function saveSkill() {
    if (!parsedSkill) return
    setSaving(true)
    try {
      const res = await fetch('/api/skill-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '__save__',
          action: 'save',
          skillJson: {
            name: parsedSkill.name,
            description: parsedSkill.description,
            form_fields: parsedSkill.form_fields,
            prompt: parsedSkill.prompt,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '保存失败')
      } else {
        toast.success(`Skill「${parsedSkill.name}」已保存，可在对话页使用了！`)
        setParsedSkill(null)
        setMessages([])
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setMessages([])
    setParsedSkill(null)
    setInput('')
    setStage(null)
  }

  const isFirstMessage = messages.length === 0

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-600" />
            <h1 className="text-lg font-semibold text-zinc-900">Skill 工坊</h1>
            <Badge variant="outline" className="text-xs text-violet-600 border-violet-200">
              AI 引导创建
            </Badge>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-400 hover:text-zinc-700" onClick={reset}>
              <RefreshCw className="h-3.5 w-3.5" />
              重新开始
            </Button>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef as any}>
          {isFirstMessage && !loading ? (
            <WelcomeScreen onSelect={sendMessage} />
          ) : (
            <div className="space-y-5 max-w-2xl mx-auto">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {loading && stage && <ThinkingIndicator stage={stage} />}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        {!isFirstMessage && (
          <div className="border-t bg-white px-6 py-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Textarea
                placeholder={parsedSkill
                  ? '告诉我哪里需要调整，比如：把输入字段改成下拉选择 / 让输出更简洁...'
                  : '描述你的需求，或告诉我如何改进...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                rows={2}
                className="resize-none"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="self-end gap-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-zinc-400 mt-2">
              Enter 发送 · Shift+Enter 换行
            </p>
          </div>
        )}
      </div>

      {/* Right panel — Skill preview */}
      {parsedSkill && (
        <SkillPreviewPanel
          skill={parsedSkill}
          onSave={saveSkill}
          saving={saving}
          onRefine={(msg) => sendMessage(msg)}
        />
      )}
    </div>
  )
}

// ---- Sub-components ----

function WelcomeScreen({ onSelect }: { onSelect: (msg: string) => void }) {
  const [custom, setCustom] = useState('')

  return (
    <div className="max-w-xl mx-auto pt-8 space-y-8">
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {GUIDE_STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <span>{step.emoji}</span>
              <span>{step.text}</span>
            </span>
            {i < GUIDE_STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 mb-4">
          <Wand2 className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">你想创建什么样的 Skill？</h2>
        <p className="text-zinc-500 text-sm">用自然语言描述你的需求，AI 会帮你生成完整配置</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">快速开始</p>
        <div className="grid grid-cols-1 gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelect(prompt)}
              className="text-left rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-700 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center gap-3"
            >
              <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">或者自定义描述</p>
        <div className="flex gap-2">
          <Textarea
            placeholder="我想做一个帮我..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (custom.trim()) onSelect(custom)
              }
            }}
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={() => custom.trim() && onSelect(custom)}
            disabled={!custom.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center mr-2 mt-1 shrink-0">
          <Wand2 className="h-3.5 w-3.5 text-violet-600" />
        </div>
      )}
      <div className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'rounded-tr-sm bg-violet-600 text-white'
          : 'rounded-tl-sm bg-zinc-100 text-zinc-800'
      }`}>
        {message.content}
      </div>
    </div>
  )
}

const STAGE_COLORS: Record<string, string> = {
  '🔍': 'from-blue-400 to-violet-400',
  '🧱': 'from-violet-400 to-pink-400',
  '✍️': 'from-pink-400 to-orange-400',
  '✨': 'from-orange-400 to-yellow-400',
}

function ThinkingIndicator({ stage }: { stage: Stage }) {
  const gradient = STAGE_COLORS[stage.emoji] || 'from-violet-400 to-pink-400'
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center mr-2 mt-1 shrink-0">
        <Wand2 className="h-3.5 w-3.5 text-violet-600" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 space-y-2 min-w-48">
        {/* Stage label */}
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="text-base">{stage.emoji}</span>
          <span>{stage.text}</span>
        </div>
        {/* Animated progress bar */}
        <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} animate-[shimmer_1.5s_ease-in-out_infinite]`}
            style={{ width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }}
          />
        </div>
        {/* Bouncing dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SkillPreviewPanel({
  skill,
  onSave,
  saving,
  onRefine,
}: {
  skill: ParsedSkill
  onSave: () => void
  saving: boolean
  onRefine: (msg: string) => void
}) {
  return (
    <div className="w-80 border-l bg-zinc-50 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="font-medium text-sm text-zinc-900">Skill 预览</span>
          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 ml-auto">
            已生成
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">名称</p>
            <p className="font-semibold text-zinc-900">{skill.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">描述</p>
            <p className="text-sm text-zinc-600">{skill.description}</p>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
              输入字段（{skill.form_fields?.length ?? 0}个）
            </p>
            <div className="space-y-1.5">
              {(skill.form_fields ?? []).map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{f.label}</p>
                    <p className="text-xs text-zinc-400">{f.name} · {f.type}</p>
                  </div>
                  {f.required && (
                    <Badge variant="outline" className="text-xs text-red-500 border-red-200">必填</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">提示词预览</p>
            <div className="rounded-md border bg-white p-3 text-xs text-zinc-600 font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {skill.prompt}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
              <MessageSquare className="h-3 w-3 inline mr-1" />
              快速调整
            </p>
            <div className="space-y-1.5">
              {REFINE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onRefine(s)}
                  className="w-full text-left text-xs text-zinc-600 rounded-md border bg-white px-3 py-2 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white">
        <Button
          className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
          onClick={onSave}
          disabled={saving}
        >
          <Check className="h-4 w-4" />
          {saving ? '保存中...' : '保存 Skill'}
        </Button>
        <p className="text-center text-xs text-zinc-400 mt-2">
          保存后可在「对话」页立即使用
        </p>
      </div>
    </div>
  )
}
