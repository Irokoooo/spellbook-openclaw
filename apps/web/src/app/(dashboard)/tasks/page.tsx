'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Clock, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const STATUS_LABELS: Record<TaskStatus, string> = {
  queued:    '等待',
  running:   '执行中',
  completed: '完成',
  failed:    '失败',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  queued:    'bg-zinc-100 text-zinc-600',
  running:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-400',
}

type Filter = 'all' | 'active' | 'completed' | 'failed'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadTasks() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)

      const agentIds = (agentData ?? []).map((a: { id: string }) => a.id)
      if (agentIds.length === 0) { setLoading(false); return }

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
        .limit(100)

      setTasks(data ?? [])
      setLoading(false)
    }

    loadTasks()

    // Realtime updates
    const channel = supabase
      .channel('tasks-page')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks((prev) => [payload.new as Task, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTasks((prev) =>
            prev.map((t) => t.id === payload.new.id ? payload.new as Task : t)
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function cancelTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'cancelled' })
      .eq('id', taskId)
      .eq('status', 'queued')

    if (error) toast.error('取消失败')
    else toast.success('任务已取消')
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return t.status === 'queued' || t.status === 'running'
    if (filter === 'completed') return t.status === 'completed'
    if (filter === 'failed') return t.status === 'failed'
    return true
  })

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">任务中心</h1>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="active">进行中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="failed">失败</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-zinc-400">
            暂无任务
          </div>
        ) : (
          <div className="p-6 space-y-2 max-w-4xl mx-auto">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border bg-white overflow-hidden"
              >
                {/* Task header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50"
                  onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                >
                  <StatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 truncate">{task.skill_name}</p>
                    <p className="text-xs text-zinc-400">
                      {formatDistanceToNow(new Date(task.created_at), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </p>
                  </div>
                  <Badge className={`text-xs ${STATUS_COLORS[task.status]}`} variant="outline">
                    {STATUS_LABELS[task.status]}
                  </Badge>
                  {task.status === 'queued' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500"
                      onClick={(e) => { e.stopPropagation(); cancelTask(task.id) }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Expanded detail */}
                {expanded === task.id && (
                  <div className="border-t px-4 py-3 bg-zinc-50 space-y-3">
                    {task.input && Object.keys(task.input).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">输入</p>
                        <div className="text-sm text-zinc-700 space-y-1">
                          {Object.entries(task.input).map(([k, v]) => (
                            <p key={k}><span className="text-zinc-400">{k}：</span>{String(v)}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.output && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">输出</p>
                        <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans">
                          {task.output}
                        </pre>
                      </div>
                    )}
                    {task.error && (
                      <div>
                        <p className="text-xs font-medium text-red-500 mb-1">错误</p>
                        <p className="text-sm text-red-600">{task.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
  if (status === 'failed' || status === 'cancelled') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />
  if (status === 'running') return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin shrink-0" />
  return <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
}
