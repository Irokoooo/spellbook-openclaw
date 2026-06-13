'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, Skill } from '@/types'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserMessage {
  id: string
  type: 'user'
  content: string
  timestamp: string
}

interface AssistantMessage {
  id: string
  type: 'assistant'
  content: string
  loading: boolean
  thinkingText?: string
  timestamp: string
}

interface TaskMessage {
  id: string
  type: 'task'
  skill?: Skill
  input?: Record<string, string>
  task: Task
  timestamp: string
}

export interface SkillDraftField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
}

export interface SkillDraftMessage {
  id: string
  type: 'skill_draft'
  reply: string
  draft: {
    name: string
    description: string
    form_fields: SkillDraftField[]
  }
  timestamp: string
}

export interface PlanMessage {
  id: string
  type: 'plan'
  text: string
  timestamp: string
}

export type ChatMessage = UserMessage | AssistantMessage | TaskMessage | SkillDraftMessage | PlanMessage

export interface TokenUsage {
  input: number
  output: number
  cacheRead: number
}

interface ChatContextValue {
  messages: ChatMessage[]
  loading: boolean
  thinkingMode: 'off' | 'high'
  setThinkingMode: (m: 'off' | 'high') => void
  agentId: string | null
  agentChecked: boolean
  sessionId: string | null
  totalUsage: TokenUsage
  pendingPlan: string | null
  activeConversationId: string | null
  sendMessage: (text: string) => Promise<void>
  confirmSaveSkill: (draftId: string) => Promise<void>
  newConversation: () => void
  stopGeneration: () => void
  loadConversation: (id: string) => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextValue | null>(null)

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [thinkingMode, setThinkingMode] = useState<'off' | 'high'>('off')
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentChecked, setAgentChecked] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [totalUsage, setTotalUsage] = useState<TokenUsage>({ input: 0, output: 0, cacheRead: 0 })
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const activeConversationIdRef = useRef<string | null>(null)
  const collectedFieldsRef = useRef<Record<string, string>>({})
  const abortRef = useRef<AbortController | null>(null)
  const pendingPlanOriginalMsgRef = useRef<string>('')
  const lastOutputPathRef = useRef<string>('')

  const newConversation = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setSessionId(null)
    setTotalUsage({ input: 0, output: 0, cacheRead: 0 })
    setPendingPlan(null)
    setActiveConversationId(null)
    activeConversationIdRef.current = null
    collectedFieldsRef.current = {}
    pendingPlanOriginalMsgRef.current = ''
    lastOutputPathRef.current = ''
  }, [])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const accumulateUsage = useCallback((u: { input?: number; output?: number; cacheRead?: number } | null) => {
    if (!u) return
    setTotalUsage((prev) => ({
      input: prev.input + (u.input ?? 0),
      output: prev.output + (u.output ?? 0),
      cacheRead: prev.cacheRead + (u.cacheRead ?? 0),
    }))
  }, [])

  const supabase = createClient()

  const saveMessageToHistory = useCallback(async (conversationId: string | null, msg: ChatMessage) => {
    if (!conversationId) return
    const { error } = await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      role: msg.type,
      data: msg,
    })
    if (error) toast.error('历史消息保存失败：' + error.message)
  }, [supabase])

  const updateConversationSession = useCallback(async (conversationId: string | null, sid: string | null) => {
    if (!conversationId || !sid) return
    const { error } = await supabase
      .from('conversations')
      .update({ session_id: sid })
      .eq('id', conversationId)
    if (error) toast.error('对话会话保存失败：' + error.message)
  }, [supabase])

  const ensureConversation = useCallback(async (title: string) => {
    let convId = activeConversationIdRef.current
    if (convId) return convId

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: title.trim().slice(0, 60) || '新对话' })
      .select('id')
      .single()

    if (error) {
      toast.error('对话创建失败：' + error.message)
      return null
    }

    convId = data.id
    activeConversationIdRef.current = convId
    setActiveConversationId(convId)
    return convId
  }, [supabase])

  // Init: fetch agent
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false })
        .limit(1)
        .single()
      if (data) setAgentId(data.id)
      setAgentChecked(true)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: update task messages when status changes
  useEffect(() => {
    const taskIds = messages
      .filter((m): m is TaskMessage => m.type === 'task')
      .map((m) => m.task.id)
    if (taskIds.length === 0) return

    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
        const updated = payload.new as Task
        if (!taskIds.includes(updated.id)) return
        setMessages((prev) =>
          prev.map((m) =>
            m.type === 'task' && m.task.id === updated.id ? { ...m, task: updated } : m
          )
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitTask = useCallback(async (
    skillId: string,
    skillName: string,
    input: Record<string, string>,
    skill?: Skill
  ) => {
    if (!agentId) {
      toast.error('未找到 Agent，请先在设置中注册')
      return null
    }
    // Include default output directory from settings if available
    if (typeof window !== 'undefined') {
      const defaultDir = localStorage.getItem('spellbook_default_output_dir')
      if (defaultDir && !input.output_path) {
        input = { ...input, output_path: defaultDir + '/' + skillName + '_' + Date.now() + '.md' }
      }
    }
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({ agent_id: agentId, skill_id: skillId || null, skill_name: skillName, input, status: 'queued' })
      .select()
      .single()

    if (error) { toast.error('任务提交失败：' + error.message); return null }

    const taskMsg: TaskMessage = { id: task.id, type: 'task', skill, input, task, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, taskMsg])
    collectedFieldsRef.current = {}
    return taskMsg
  }, [agentId, supabase])

  const confirmSaveSkill = useCallback(async (draftId: string) => {
    const msg = messages.find((m): m is SkillDraftMessage => m.type === 'skill_draft' && m.id === draftId)
    if (!msg) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('请先登录'); return }

    const { error } = await supabase.from('skills').insert({
      user_id: user.id,
      name: msg.draft.name,
      description: msg.draft.description,
      form_fields: msg.draft.form_fields,
      enabled: true,
    })

    if (error) { toast.error('保存 Skill 失败：' + error.message); return }

    toast.success(`Skill「${msg.draft.name}」已保存，下次可以一键触发！`)
    setMessages((prev) => prev.map((m) =>
      m.id === draftId
        ? { ...m, type: 'assistant' as const, content: '✅ Skill 已保存，下次直接说「' + msg.draft.name + '」就能触发。', loading: false }
        : m
    ))
  }, [messages, supabase])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: UserMessage = { id: uid(), type: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setPendingPlan(null)
    setLoading(true)

    // Ensure we have a conversation record in DB
    const convId = await ensureConversation(text.trim())
    await saveMessageToHistory(convId, userMsg)

    const assistantId = uid()
    setMessages((prev) => [...prev, {
      id: assistantId, type: 'assistant', content: '', loading: true,
      thinkingText: '正在思考…', timestamp: new Date().toISOString(),
    }])

    const controller = new AbortController()
    abortRef.current = controller

    const originalMessage = pendingPlanOriginalMsgRef.current || undefined
    pendingPlanOriginalMsgRef.current = ''
    lastOutputPathRef.current = ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          collectedFields: collectedFieldsRef.current,
          thinkingMode,
          lastOutputPath: lastOutputPathRef.current || undefined,
          defaultOutputDir: (typeof window !== "undefined" ? localStorage.getItem("spellbook_default_output_dir") : null) || undefined,
          ...(originalMessage ? { originalMessage } : {}),
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: '请求失败' }))
        toast.error(err.error || '请求失败')
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'thinking') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, thinkingText: event.text } : m
                )
              )
            } else if (event.type === 'plan') {
              setMessages((prev) => {
                const planMsg: PlanMessage = {
                  id: uid(),
                  type: 'plan',
                  text: event.text,
                  timestamp: new Date().toISOString(),
                }
                const idx = prev.findIndex((m) => m.id === assistantId)
                if (idx === -1) return [...prev, planMsg]
                return [...prev.slice(0, idx), planMsg, ...prev.slice(idx)]
              })
            } else if (event.type === 'plan_wait') {
              setMessages((prev) => prev.filter((m) => m.id !== assistantId))
              setSessionId(event.sessionId)
              await updateConversationSession(activeConversationIdRef.current, event.sessionId)
              setPendingPlan(event.planText ?? '')
              pendingPlanOriginalMsgRef.current = text.trim()
              return
            } else if (event.type === 'reply') {
              const finalMsg: AssistantMessage = {
                id: assistantId, type: 'assistant', content: event.reply,
                loading: false, thinkingText: undefined, timestamp: new Date().toISOString(),
              }
              setSessionId(event.sessionId)
              accumulateUsage(event.tokenUsage)
              if (event.outputPath) lastOutputPathRef.current = event.outputPath
              setMessages((prev) => prev.map((m) => m.id === assistantId ? finalMsg : m))
              await updateConversationSession(activeConversationIdRef.current, event.sessionId)
              await saveMessageToHistory(activeConversationIdRef.current, finalMsg)
            } else if (event.type === 'submit') {
              const replyMsg: AssistantMessage = {
                id: assistantId, type: 'assistant', content: event.reply,
                loading: false, thinkingText: undefined, timestamp: new Date().toISOString(),
              }
              setSessionId(event.sessionId)
              accumulateUsage(event.tokenUsage)
              setMessages((prev) => prev.map((m) => m.id === assistantId ? replyMsg : m))
              await updateConversationSession(activeConversationIdRef.current, event.sessionId)
              await saveMessageToHistory(activeConversationIdRef.current, replyMsg)
              const taskMsg = await submitTask(event.skillId, event.skillName, event.input)
              if (taskMsg) await saveMessageToHistory(activeConversationIdRef.current, taskMsg)
            } else if (event.type === 'save_skill') {
              const draftMsg: SkillDraftMessage = {
                id: assistantId,
                type: 'skill_draft',
                reply: event.reply,
                draft: event.draft,
                timestamp: new Date().toISOString(),
              }
              setSessionId(event.sessionId)
              accumulateUsage(event.tokenUsage)
              setMessages((prev) => prev.map((m) => m.id === assistantId ? draftMsg : m))
              await updateConversationSession(activeConversationIdRef.current, event.sessionId)
              await saveMessageToHistory(activeConversationIdRef.current, draftMsg)
            } else if (event.type === "save_file") {
              // Trigger file download in browser
              const blob = new Blob([event.content], { type: "text/markdown;charset=utf-8" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = event.path || "output.md"
              a.click()
              URL.revokeObjectURL(url)
              toast.success("文件已下载: " + (event.path || "output.md"))
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: event.reply } : m))
              await updateConversationSession(activeConversationIdRef.current, event.sessionId)
              await saveMessageToHistory(activeConversationIdRef.current, { id: assistantId, type: "assistant" as const, loading: false, content: event.reply, timestamp: new Date().toISOString() })
            } else if (event.type === 'error') {
              toast.error(event.error || 'AI 出错了，请重试')
              setMessages((prev) => prev.filter((m) => m.id !== assistantId))
            }
          } catch { /* malformed SSE line */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } else {
        toast.error('网络错误，请重试')
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      }
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }, [loading, sessionId, thinkingMode, submitTask, accumulateUsage, ensureConversation, saveMessageToHistory, updateConversationSession])

  const loadConversation = useCallback(async (id: string) => {
    const { data: msgs } = await supabase
      .from('conversation_messages')
      .select('data')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (!msgs) return

    const { data: conv } = await supabase
      .from('conversations')
      .select('session_id')
      .eq('id', id)
      .single()

    setMessages(msgs.map((r) => r.data as ChatMessage))
    setActiveConversationId(id)
    activeConversationIdRef.current = id
    setSessionId(conv?.session_id ?? null)
    setPendingPlan(null)
    collectedFieldsRef.current = {}
  }, [supabase])

  return (
    <ChatContext.Provider value={{
      messages, loading, thinkingMode, setThinkingMode,
      agentId, agentChecked, sessionId, totalUsage, pendingPlan,
      activeConversationId,
      sendMessage, confirmSaveSkill, newConversation, stopGeneration,
      loadConversation,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}

