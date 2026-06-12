'use client'

import { useEffect, useRef } from 'react'
import { useChatContext } from '@/contexts/ChatContext'
import type { SkillDraftMessage, PlanMessage, TokenUsage } from '@/contexts/ChatContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Sparkles, Bot, BookMarked, ListChecks, PlusCircle, Coins, Square, Play, History } from 'lucide-react'
import HistoryDrawer from '@/components/chat/HistoryDrawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import TaskResult from '@/components/chat/TaskResult'
import { useState } from 'react'

const WELCOME_SUGGESTIONS = [
  '我想对深圳某个项目做竞品市场盘点',
  '帮我写一份客户解决方案',
  '调研一下某家公司的背景',
  '帮我生成朋友圈营销文案',
]

export default function ChatPage() {
  const {
    messages, loading, thinkingMode, setThinkingMode,
    agentId, agentChecked, sendMessage, confirmSaveSkill,
    totalUsage, newConversation, stopGeneration, pendingPlan,
    loadConversation,
  } = useChatContext()

  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [messages])

  async function handleSend(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    await sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Cost badge fixed to bottom-right */}
      <CostBadge usage={totalUsage} />
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-2">
        <Bot className="h-5 w-5 text-violet-500" />
        <h1 className="text-lg font-semibold text-zinc-900">对话</h1>
        {agentChecked && !agentId && (
          <span className="ml-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
            未连接 Agent —{' '}
            <a href="/settings" className="underline">去设置</a>
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto gap-1.5 text-xs h-8"
          onClick={() => setHistoryOpen(true)}
        >
          <History className="h-3.5 w-3.5" />
          历史对话
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          onClick={newConversation}
          disabled={loading}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          新对话
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        {isEmpty ? (
          <WelcomeScreen onSuggestion={(s) => handleSend(s)} />
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto pb-4">
            {messages.map((msg) => {
              if (msg.type === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-lg rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-2.5 text-white text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                )
              }

              if (msg.type === 'assistant') {
                return (
                  <div key={msg.id} className="flex justify-start gap-2.5">
                    <div className="mt-1 h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <div className="max-w-2xl rounded-2xl rounded-tl-sm border bg-white px-4 py-2.5 text-sm text-zinc-700 leading-relaxed shadow-sm">
                      {msg.loading ? (
                        <ThinkingIndicator text={msg.thinkingText ?? '正在思考…'} />
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                )
              }

              if (msg.type === 'task') {
                return (
                  <TaskResult
                    key={msg.id}
                    entry={{
                      id: msg.id,
                      type: 'task',
                      skill: msg.skill,
                      input: msg.input,
                      task: msg.task,
                      timestamp: msg.timestamp,
                    }}
                  />
                )
              }

              if (msg.type === 'skill_draft') {
                return (
                  <SkillDraftCard
                    key={msg.id}
                    msg={msg}
                    onConfirm={() => confirmSaveSkill(msg.id)}
                  />
                )
              }

              if (msg.type === 'plan') {
                return <PlanCard key={msg.id} msg={msg} />
              }

              return null
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs text-zinc-400">
              AI 助手会理解你的需求，自动匹配 Skill 并收集所需信息
            </p>
            <Select value={thinkingMode} onValueChange={(value) => setThinkingMode(value as 'off' | 'high')}>
              <SelectTrigger size="sm" className="bg-white text-xs text-zinc-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="off">快速模式</SelectItem>
                <SelectItem value="high">深度模式</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-end rounded-xl border bg-zinc-50 px-3 py-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="说说你想做什么…（Enter 发送，Shift+Enter 换行）"
              className="flex-1 resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] text-sm py-1"
              rows={1}
              disabled={loading}
            />
            {loading ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 h-8 text-zinc-500 border-zinc-300"
                onClick={stopGeneration}
              >
                <Square className="h-3.5 w-3.5" />
                停止
              </Button>
            ) : pendingPlan ? (
              <Button
                size="sm"
                className="shrink-0 gap-1.5 bg-blue-600 hover:bg-blue-700 h-8"
                onClick={() => handleSend('确认，继续执行')}
              >
                <Play className="h-3.5 w-3.5" />
                继续执行
              </Button>
            ) : (
              <Button
                size="sm"
                className="shrink-0 gap-1.5 bg-violet-600 hover:bg-violet-700 h-8"
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
              >
                <Send className="h-3.5 w-3.5" />
                发送
              </Button>
            )}
          </div>
        </div>
      </div>
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={(id) => { loadConversation(id); setHistoryOpen(false) }}
      />
    </div>
  )
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-72 gap-6 text-center max-w-lg mx-auto">
      <div className="space-y-2">
        <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
          <Sparkles className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="font-semibold text-zinc-900">你好，有什么可以帮你？</h2>
        <p className="text-sm text-zinc-500">直接描述需求，我会帮你匹配合适的工具并完成任务</p>
      </div>
      <div className="grid grid-cols-1 gap-2 w-full">
        {WELCOME_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-left text-sm rounded-lg border bg-white px-4 py-2.5 text-zinc-600 hover:border-violet-300 hover:bg-violet-50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Thinking Indicator ───────────────────────────────────────────────────────

function ThinkingIndicator({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-zinc-400 text-xs">
      <span className="flex gap-0.5">
        <span className="animate-bounce [animation-delay:0ms] h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span className="animate-bounce [animation-delay:150ms] h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span className="animate-bounce [animation-delay:300ms] h-1.5 w-1.5 rounded-full bg-violet-400" />
      </span>
      <span className="transition-all">{text}</span>
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ msg }: { msg: PlanMessage }) {
  return (
    <div className="flex justify-start gap-2.5">
      <div className="mt-1 h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <ListChecks className="h-3.5 w-3.5 text-blue-600" />
      </div>
      <div className="max-w-2xl rounded-2xl rounded-tl-sm border border-blue-200 bg-blue-50 px-4 py-3 text-sm shadow-sm">
        <div className="flex items-center gap-1.5 mb-2 text-blue-700 font-medium text-xs">
          执行计划
        </div>
        <div className="whitespace-pre-wrap text-zinc-700 leading-relaxed">{msg.text}</div>
      </div>
    </div>
  )
}

// ─── Cost Badge ───────────────────────────────────────────────────────────────

function CostBadge({ usage }: { usage: TokenUsage }) {
  const cost = (usage.input / 1_000_000) * 1 + (usage.cacheRead / 1_000_000) * 0.1 + (usage.output / 1_000_000) * 2
  if (usage.input + usage.output === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full border bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-500 shadow-md">
      <Coins className="h-3.5 w-3.5 text-amber-500" />
      <span>¥{cost < 0.001 ? '<0.001' : cost.toFixed(3)}</span>
    </div>
  )
}

function SkillDraftCard({ msg, onConfirm }: { msg: SkillDraftMessage; onConfirm: () => void }) {  const [saved, setSaved] = useState(false)

  async function handleConfirm() {
    setSaved(true)
    await onConfirm()
  }

  return (
    <div className="flex justify-start gap-2.5">
      <div className="mt-1 h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
      </div>
      <div className="max-w-2xl space-y-2">
        {msg.reply && (
          <div className="rounded-2xl rounded-tl-sm border bg-white px-4 py-2.5 text-sm text-zinc-700 leading-relaxed shadow-sm whitespace-pre-wrap">
            {msg.reply}
          </div>
        )}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm shadow-sm">
          <div className="flex items-center gap-1.5 mb-2 text-violet-700 font-medium">
            <BookMarked className="h-3.5 w-3.5" />
            检测到可沉淀的 Skill
          </div>
          <div className="space-y-0.5 text-zinc-700 mb-3">
            <div><span className="text-zinc-400">名称：</span>{msg.draft.name}</div>
            <div><span className="text-zinc-400">描述：</span>{msg.draft.description}</div>
            <div className="text-zinc-400 text-xs mt-1">
              参数：{msg.draft.form_fields.map((f) => f.label).join('、')}
            </div>
          </div>
          {saved ? (
            <p className="text-xs text-violet-600">已保存</p>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs bg-violet-600 hover:bg-violet-700" onClick={handleConfirm}>
                保存为 Skill
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-400" onClick={() => setSaved(true)}>
                暂不需要
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
