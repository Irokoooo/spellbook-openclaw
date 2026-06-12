'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  title: string
  created_at: string
}

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
}

export default function HistoryDrawer({ open, onClose, onSelect }: HistoryDrawerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setConversations(data ?? [])
      setLoading(false)
    }
    load()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-72 sm:max-w-xs p-0 flex flex-col" showCloseButton>
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-sm font-semibold text-zinc-900">历史对话</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-400">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm">还没有历史对话</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-zinc-100 transition-colors"
                  onClick={() => { onSelect(conv.id); onClose() }}
                >
                  <p className="text-sm text-zinc-800 truncate leading-snug">{conv.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDate(conv.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
