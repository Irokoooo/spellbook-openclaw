'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import type { AgentStatus } from '@/types'

export default function AgentStatusBadge() {
  const [status, setStatus] = useState<AgentStatus | 'unknown'>('unknown')
  const supabase = createClient()

  useEffect(() => {
    let agentId: string | null = null

    async function fetchStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('agents')
        .select('id, status')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        agentId = data.id
        setStatus(data.status as AgentStatus)
      }
    }

    fetchStatus()

    // Subscribe to agent status changes
    const channel = supabase
      .channel('agent-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agents',
        filter: agentId ? `id=eq.${agentId}` : undefined,
      }, (payload) => {
        setStatus((payload.new as { status: AgentStatus }).status)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const config: Record<string, { label: string; className: string }> = {
    online:  { label: 'Agent 在线', className: 'bg-green-100 text-green-700 border-green-200' },
    busy:    { label: 'Agent 执行中', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    offline: { label: 'Agent 离线', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
    unknown: { label: '未连接', className: 'bg-zinc-100 text-zinc-400 border-zinc-200' },
  }

  const { label, className } = config[status]

  return (
    <Badge variant="outline" className={`text-xs w-full justify-center ${className}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === 'online' ? 'bg-green-500' : status === 'busy' ? 'bg-yellow-500' : 'bg-zinc-400'}`} />
      {label}
    </Badge>
  )
}
