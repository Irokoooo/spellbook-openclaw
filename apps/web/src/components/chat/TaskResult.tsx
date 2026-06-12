'use client'

import type { Skill, Task } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface ChatEntry {
  id: string
  type: 'user' | 'task'
  skill?: Skill
  input?: Record<string, string>
  task?: Task
  timestamp: string
}

const statusConfig = {
  queued:    { label: '等待执行', icon: Clock,    color: 'text-zinc-400' },
  running:   { label: '执行中',   icon: Loader2,  color: 'text-yellow-500', spin: true },
  completed: { label: '完成',     icon: CheckCircle, color: 'text-green-500' },
  failed:    { label: '失败',     icon: XCircle,  color: 'text-red-500' },
  cancelled: { label: '已取消',   icon: XCircle,  color: 'text-zinc-400' },
}

export default function TaskResult({ entry }: { entry: ChatEntry }) {
  const { skill, input, task } = entry

  if (!task) return null

  const cfg = statusConfig[task.status]
  const Icon = cfg.icon

  return (
    <div className="space-y-3">
      {/* User input bubble */}
      <div className="flex justify-end">
        <div className="max-w-lg rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-3 text-white text-sm">
          <p className="font-medium mb-1 opacity-80">{skill?.name}</p>
          {input && Object.entries(input).map(([k, v]) => (
            <p key={k}><span className="opacity-70">{k}：</span>{v}</p>
          ))}
        </div>
      </div>

      {/* Task result bubble */}
      <div className="flex justify-start">
        <div className="max-w-2xl rounded-2xl rounded-tl-sm border bg-white px-4 py-3 text-sm shadow-sm">
          {/* Status header */}
          <div className="flex items-center gap-1.5 mb-2 text-xs text-zinc-400">
            <Icon className={`h-3.5 w-3.5 ${cfg.color} ${(cfg as any).spin ? 'animate-spin' : ''}`} />
            <span>{cfg.label}</span>
          </div>

          {/* Output */}
          {task.status === 'queued' || task.status === 'running' ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ) : task.status === 'failed' ? (
            <p className="text-red-600 text-sm">{task.error ?? '执行失败'}</p>
          ) : task.status === 'completed' ? (
            <div className="whitespace-pre-wrap text-zinc-700 leading-relaxed">
              {task.output ?? '（无输出）'}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">任务已取消</p>
          )}
        </div>
      </div>
    </div>
  )
}
