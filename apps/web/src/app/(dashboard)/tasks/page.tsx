'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Clock, Loader2, X, CheckSquare, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/useConfirm'
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
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()
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

    // Realtime updates — also fire toast on failure
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
          const updated = payload.new as Task
          setTasks((prev) => {
            const old = prev.find((t) => t.id === updated.id)
            // Show toast only on status transition to failed (not on initial load)
            if (old && old.status !== 'failed' && updated.status === 'failed') {
              toast.error(`任务失败：${updated.skill_name}`, {
                description: updated.error ?? '请前往任务中心查看详情',
                duration: 8000,
              })
            }
            return prev.map((t) => t.id === updated.id ? updated : t)
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function retryTask(task: Task) {
    // Re-create a queued task with same skill_name and input
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const agentId = agentData?.[0]?.id
    if (!agentId) {
      toast.error('没有可用的 Agent')
      return
    }

    const { error } = await supabase.from('tasks').insert({
      agent_id: agentId,
      skill_id: task.skill_id,
      skill_name: task.skill_name,
      input: task.input,
      status: 'queued',
    })

    if (error) {
      toast.error('重试失败：' + error.message)
    } else {
      toast.success('任务已重新提交')
    }
  }

  async function handleCopyOutput(output: string) {
    try {
      await navigator.clipboard.writeText(output)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  async function cancelTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'cancelled' })
      .eq('id', taskId)
      .eq('status', 'queued')

    if (error) toast.error('取消失败')
    else toast.success('任务已取消')
  }

  async function deleteTask(taskId: string) {
    const confirmed = await confirm({
      title: '删除任务',
      description: '确定要删除这个任务吗？删除后不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
      showDontAskAgain: true,
      dontAskAgainKey: 'delete_task',
    })
    if (!confirmed) return
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      toast.error('删除失败：' + error.message)
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success('任务已删除')
    }
  }


  function toggleSelect(taskId: string) {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  async function batchRetry() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || selectedTasks.size === 0) return
    const { data: agentData } = await supabase
      .from('agents').select('id').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1)
    const agentId = agentData?.[0]?.id
    if (!agentId) { toast.error('没有可用的 Agent'); return }
    const failedTasks = tasks.filter((t) => selectedTasks.has(t.id) && t.status === 'failed')
    const inserts = failedTasks.map((t) => ({ agent_id: agentId, skill_id: t.skill_id, skill_name: t.skill_name, input: t.input, status: 'queued' }))
    if (inserts.length === 0) { toast.error('选中的任务中没有失败的任务'); return }
    const { error } = await supabase.from('tasks').insert(inserts)
    if (error) { toast.error('批量重试失败：' + error.message) }
    else { toast.success(inserts.length + ' 个任务已重新提交'); setSelectedTasks(new Set()); setSelectMode(false) }
  }

  async function batchDelete() {
    if (selectedTasks.size === 0) return
    const confirmed = await confirm({
      title: '批量删除任务',
      description: '确定要删除选中的 ' + selectedTasks.size + ' 个任务吗？删除后不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
      showDontAskAgain: true,
      dontAskAgainKey: 'batch_delete_task',
    })
    if (!confirmed) return
    const ids = Array.from(selectedTasks)
    const { error } = await supabase.from('tasks').delete().in('id', ids)
    if (error) { toast.error('批量删除失败：' + error.message) }
    else {
      setTasks((prev) => prev.filter((t) => !selectedTasks.has(t.id)))
      setSelectedTasks(new Set())
      setSelectMode(false)
    }
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
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-zinc-900">任务中心</h1>
          <button
            onClick={() => { setLoading(true); window.location.reload() }}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline-offset-2 hover:underline"
          >
            刷新
          </button>
          <Button
            size="sm"
            variant="ghost"
            className={'h-7 text-xs gap-1 ' + (selectMode ? 'text-violet-600 bg-violet-50' : 'text-zinc-400')}
            onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedTasks(new Set()) }}
          >
            {selectMode ? '取消多选' : '多选'}
          </Button>
        </div>
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
                  {selectMode && (
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(task.id) }}>
                      {selectedTasks.has(task.id) ? (
                        <CheckSquare className="h-4 w-4 text-violet-500" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-300 hover:text-zinc-500" />
                      )}
                    </button>
                  )}
                  <StatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 truncate">{task.skill_name}</p>
                    {task.status === 'running' && task.progress ? (
                      <p className="text-xs text-yellow-600 flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        {task.progress}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400">
                        {formatDistanceToNow(new Date(task.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </p>
                    )}
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
                  {task.status !== 'queued' && task.status !== 'running' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-300 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                      title="删除任务"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Expanded detail */}
                {expanded === task.id && (
                  <div className="border-t px-4 py-3 bg-zinc-50 space-y-3">
                    <div className="flex gap-2">
                      {task.status === 'failed' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => retryTask(task)}>
                          重试
                        </Button>
                      )}
                      {task.output && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopyOutput(task.output!)}>
                          复制输出
                        </Button>
                      )}
                    </div>
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
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-zinc-500">输出</p>
                          <button
                            className="text-xs text-violet-500 hover:text-violet-700 underline-offset-2 hover:underline"
                            onClick={() => {
                              const blob = new Blob([task.output!], { type: 'text/markdown;charset=utf-8' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = (task.skill_name || 'output') + '.md'
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                          >
                            下载 .md
                          </button>
                        </div>
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
      {/* Batch action bar */}
      {selectMode && selectedTasks.size > 0 && (
        <div className="border-t bg-white px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            已选择 <span className="font-medium text-zinc-800">{selectedTasks.size}</span> 个任务
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={batchRetry}>
              批量重试
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 hover:text-red-700 border-red-200 hover:border-red-300" onClick={batchDelete}>
              批量删除
            </Button>
          </div>
        </div>
      )}
      </ScrollArea>
      <ConfirmDialog />
    </div>
  )
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
  if (status === 'failed' || status === 'cancelled') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />
  if (status === 'running') return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin shrink-0" />
  return <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
}


