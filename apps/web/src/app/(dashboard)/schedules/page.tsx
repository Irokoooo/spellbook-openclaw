'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Skill } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  Plus,
  Trash2,
  Play,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/useConfirm'

interface Schedule {
  id: string
  name: string
  description: string
  skill_id: string | null
  skill_name: string
  input_template: Record<string, string>
  cron_expression: string
  enabled: boolean
  last_run_at: string | null
  next_run_at: string | null
  created_at: string
}

const CRON_PRESETS = [
  { label: '每分钟（调试用）', value: '* * * * *' },
  { label: '每小时',           value: '0 * * * *' },
  { label: '每天早上 9 点',    value: '0 9 * * *' },
  { label: '每周一早 9 点',    value: '0 9 * * 1' },
  { label: '每月 1 号早 9 点', value: '0 9 1 * *' },
  { label: '自定义',           value: '__custom__' },
]

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  // New schedule form
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formSkillId, setFormSkillId] = useState<string>('')
  const [formCron, setFormCron] = useState('0 9 * * *')
  const [formCronPreset, setFormCronPreset] = useState('0 9 * * *')
  const [formCustomCron, setFormCustomCron] = useState('')
  const [formInput, setFormInput] = useState('')
  const [saving, setSaving] = useState(false)

  const { confirm, ConfirmDialog } = useConfirm()
  const supabase = createClient()

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [schedRes, skillRes] = await Promise.all([
      supabase.from('schedules').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('skills').select('*').eq('user_id', user.id).eq('enabled', true).order('name'),
    ])

    setSchedules(schedRes.data ?? [])
    setSkills(skillRes.data ?? [])
    setLoading(false)
  }

  // Check if schedules table exists; offer one-click migration if not
  const [needsMigration, setNeedsMigration] = useState(false)
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    async function checkMigration() {
      const { error } = await supabase.from("schedules").select("id").limit(1)
      if (error && error.message?.includes("does not exist")) {
        setNeedsMigration(true)
      }
    }
    checkMigration()
  }, [])

  async function runMigration() {
    setMigrating(true)
    // Use the Supabase Management API or fall back to instructions
    const sql = [
      "CREATE TABLE IF NOT EXISTS public.schedules (",
      "  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,",
      "  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,",
      "  name text NOT NULL,",
      "  description text NOT NULL DEFAULT '',",
      "  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,",
      "  skill_name text NOT NULL,",
      "  input_template jsonb NOT NULL DEFAULT '{}',",
      "  cron_expression text NOT NULL,",
      "  enabled boolean NOT NULL DEFAULT true,",
      "  last_run_at timestamptz,",
      "  created_at timestamptz NOT NULL DEFAULT now(),",
      "  updated_at timestamptz NOT NULL DEFAULT now()",
      ");",
      "ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;",
      'CREATE POLICY "users: own schedules only" ON public.schedules FOR ALL',
      "  USING (auth.uid() = user_id)",
      "  WITH CHECK (auth.uid() = user_id);",
    ].join("\n")
    
    // Copy SQL to clipboard and open Supabase SQL Editor
    await navigator.clipboard.writeText(sql)
    window.open("https://supabase.com/dashboard/project/hbnaqcjpdabicpyzoagp/sql/new", "_blank")
    toast.success("SQL 已复制到剪贴板，请在打开的 Supabase SQL Editor 中粘贴并运行")
    setNeedsMigration(false)
    setMigrating(false)
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function cronFromPreset(value: string) {
    setFormCronPreset(value)
    if (value !== '__custom__') {
      setFormCron(value)
    }
  }

  async function handleSave() {
    if (!formName.trim()) { toast.error('请填写名称'); return }
    if (!formSkillId) { toast.error('请选择要执行的 Skill'); return }
    const cronExpr = formCronPreset === '__custom__' ? formCustomCron.trim() : formCron
    if (!cronExpr) { toast.error('请填写 Cron 表达式'); return }

    const skill = skills.find((s) => s.id === formSkillId)
    if (!skill) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let inputObj: Record<string, string> = {}
    try {
      if (formInput.trim()) inputObj = JSON.parse(formInput.trim())
    } catch { toast.error('输入模板 JSON 格式错误'); setSaving(false); return }

    const { error } = await supabase.from('schedules').insert({
      user_id: user.id,
      name: formName.trim(),
      description: formDesc.trim(),
      skill_id: formSkillId,
      skill_name: skill.name,
      input_template: inputObj,
      cron_expression: cronExpr,
      enabled: true,
    })

    if (error) { toast.error('创建失败：' + error.message) }
    else {
      toast.success('定时任务已创建')
      setShowNew(false)
      resetForm()
      loadData()
    }
    setSaving(false)
  }

  function resetForm() {
    setFormName(''); setFormDesc(''); setFormSkillId('')
    setFormCron('0 9 * * *'); setFormCronPreset('0 9 * * *'); setFormCustomCron('')
    setFormInput('')
  }

  async function toggleEnabled(sched: Schedule) {
    const { error } = await supabase
      .from('schedules')
      .update({ enabled: !sched.enabled })
      .eq('id', sched.id)
    if (error) { toast.error('更新失败') }
    else { setSchedules((prev) => prev.map((s) => s.id === sched.id ? { ...s, enabled: !s.enabled } : s)) }
  }

  async function deleteSchedule(id: string) {
    const confirmed = await confirm({
      title: '删除定时任务',
      description: '确定要删除这个定时任务吗？删除后不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
      icon: <Trash2 className="h-6 w-6" />,
      showDontAskAgain: true,
      dontAskAgainKey: 'delete_schedule',
    })
    if (!confirmed) return
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) { toast.error('删除失败') }
    else { setSchedules((prev) => prev.filter((s) => s.id !== id)); toast.success('已删除') }
  }

  function parseCron(cron: string): string {
    const parts = cron.split(' ')
    if (parts.length !== 5) return cron
    const [min, hour, dom, , dow] = parts
    let desc = ''
    if (min === '*' && hour === '*') desc = '每分钟'
    else if (min === '0' && hour === '*') desc = '每小时整点'
    else if (min === '0') desc = `每天 ${hour}:00`
    else desc = `${cron}`
    if (dow !== '*' && dow !== undefined) {
      const days = ['日', '一', '二', '三', '四', '五', '六']
      desc += ` 周${days[parseInt(dow)]}`
    }
    if (dom !== '*' && dom !== undefined) desc += ` 每月${dom}号`
    return desc
  }

  return (
    <div className="flex h-full flex-col">
      {needsMigration && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <span className="text-lg">⚠️</span>
            <span>需要初始化定时任务表，一键操作：</span>
          </div>
          <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={runMigration} disabled={migrating}>
            {migrating ? "处理中..." : "复制 SQL 并打开 Supabase"}
          </Button>
        </div>
      )}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-500" />
          <h1 className="text-lg font-semibold text-zinc-900">定时任务</h1>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          新建定时任务
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
            <Clock className="h-10 w-10" />
            <p className="text-sm">还没有定时任务</p>
            <p className="text-xs">设置定时任务后，Agent 会在指定时间自动执行 Skill</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              创建第一个
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-3 max-w-4xl mx-auto">
            {schedules.map((sched) => (
              <Card key={sched.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      sched.enabled ? 'bg-violet-100' : 'bg-zinc-100'
                    }`}>
                      <Calendar className={`h-4 w-4 ${sched.enabled ? 'text-violet-600' : 'text-zinc-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${sched.enabled ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {sched.name}
                        </p>
                        <Badge variant="outline" className={`text-[10px] ${
                          sched.enabled ? 'text-green-600 bg-green-50' : 'text-zinc-400'
                        }`}>
                          {sched.enabled ? '运行中' : '已暂停'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Skill：{sched.skill_name}
                        {' · '}
                        {parseCron(sched.cron_expression)}
                        {' · '}
                        {sched.last_run_at
                          ? `上次执行：${new Date(sched.last_run_at).toLocaleDateString('zh-CN')}`
                          : '尚未执行'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={sched.enabled} onCheckedChange={() => toggleEnabled(sched)} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                        onClick={() => deleteSchedule(sched.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* New schedule dialog */}
      <Dialog open={showNew} onOpenChange={(v) => { if (!v) setShowNew(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建定时任务</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">名称 *</label>
              <Input placeholder="每周市场盘点" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">描述</label>
              <Input placeholder="周一早上自动跑市场数据盘点" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">执行 Skill *</label>
              <Select value={formSkillId} onValueChange={(v: string | null) => v && setFormSkillId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要执行的 Skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">执行频率 *</label>
              <Select value={formCronPreset} onValueChange={(v: string | null) => v && cronFromPreset(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formCronPreset === '__custom__' && (
                <div className="mt-2 space-y-1">
                  <Input
                    placeholder="输入 Cron 表达式，如：30 9 * * 1"
                    value={formCustomCron}
                    onChange={(e) => { setFormCustomCron(e.target.value); setFormCron(e.target.value) }}
                  />
                  <p className="text-[10px] text-zinc-400">
                    格式：分 时 日 月 周（如 <code className="font-mono bg-zinc-100 px-1">30 9 * * 1</code> = 每周一早 9:30）
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">输入参数（JSON，可选）</label>
              <Textarea
                placeholder='{"city": "深圳", "project_type": "住宅"}'
                value={formInput}
                onChange={(e) => setFormInput(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
      <ConfirmDialog />
</div>
  )
}
