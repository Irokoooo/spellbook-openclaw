'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, MessageCircle, Send } from 'lucide-react'

interface DanmakuComment {
  id: string
  content: string
  color: string
  created_at: string
}

const STORAGE_KEY = 'spellbook_danmaku_enabled'

export function DanmakuLayer() {
  const [enabled, setEnabled] = useState(false)
  const [comments, setComments] = useState<DanmakuComment[]>([])
  const [input, setInput] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') setEnabled(true)
  }, [])

  const toggleEnabled = useCallback(() => {
    const next = !enabled
    setEnabled(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }, [enabled])

  // Fetch comments
  useEffect(() => {
    if (!enabled) return
    fetchComments()
    const interval = setInterval(fetchComments, 8000)
    return () => clearInterval(interval)
  }, [enabled])

  async function fetchComments() {
    try {
      const res = await fetch('/api/danmaku')
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch {}
  }

  async function submitComment() {
    if (!input.trim() || submitting) return
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/danmaku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ content: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        setShowInput(false)
        fetchComments()
      }
    } catch {} finally { setSubmitting(false) }
  }

  if (!enabled) return null

  return (
    <>
      {/* Danmaku floating comments */}
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
        {comments.map((c, i) => {
          const top = 10 + ((i * 17 + (parseInt(c.id.slice(0, 4), 36) % 73)) % 80)
          const duration = 8 + (c.content.length * 0.06) + (i % 3)
          const delay = (i * 0.7) % 6
          return (
            <div
              key={c.id + '-' + i}
              className="absolute whitespace-nowrap text-sm font-bold select-none"
              style={{
                top: `${top}%`,
                color: c.color,
                animation: `danmaku-scroll ${duration}s linear ${delay}s infinite`,
                textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.2)',
                opacity: 0.92,
              }}
            >
              {c.content}
            </div>
          )
        })}
      </div>

      {/* Control buttons */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
        {showInput && (
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border p-2 flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitComment() }}
              placeholder="发个弹幕 (Enter 发送)..."
              maxLength={120}
              className="w-48 px-2 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-emerald-400"
              autoFocus
            />
            <button onClick={submitComment} disabled={submitting || !input.trim()} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition">
              <Send className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setShowInput(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowInput(!showInput)}
            className="p-2.5 rounded-full bg-white/90 backdrop-blur shadow-lg border hover:bg-white transition text-zinc-600 hover:text-emerald-600"
            title="发弹幕"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={toggleEnabled}
            className="p-2.5 rounded-full bg-white/90 backdrop-blur shadow-lg border hover:bg-white transition text-zinc-600 hover:text-red-500"
            title="关闭弹幕"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes danmaku-scroll {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  )
}