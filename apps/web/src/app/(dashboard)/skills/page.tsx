'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Skill } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import SkillEditor from '@/components/skills/SkillEditor'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Skill | 'new' | null>(null)
  const supabase = createClient()

  async function loadSkills() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setSkills(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function setup() {
      await loadSkills()
      if (cancelled) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      channel = supabase
        .channel('skills-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'skills', filter: `user_id=eq.${user.id}` },
          (payload) => { setSkills((prev) => [payload.new as Skill, ...prev]) }
        )
        .subscribe()
    }

    setup()
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleEnabled(skill: Skill) {
    const { error } = await supabase
      .from('skills')
      .update({ enabled: !skill.enabled })
      .eq('id', skill.id)

    if (error) {
      toast.error('更新失败')
    } else {
      setSkills((prev) =>
        prev.map((s) => s.id === skill.id ? { ...s, enabled: !s.enabled } : s)
      )
    }
  }

  async function deleteSkill(skillId: string) {
    const { error } = await supabase.from('skills').delete().eq('id', skillId)
    if (error) {
      toast.error('删除失败')
    } else {
      setSkills((prev) => prev.filter((s) => s.id !== skillId))
      toast.success('Skill 已删除')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Skills 管理</h1>
        <Button size="sm" className="gap-2" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" />
          新建 Skill
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
            <p>还没有 Skill，点击右上角新建</p>
          </div>
        ) : (
          <div className="p-6 space-y-3 max-w-4xl mx-auto">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-lg border bg-white px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900">{skill.name}</p>
                    {!skill.enabled && (
                      <Badge variant="outline" className="text-zinc-400 text-xs">已禁用</Badge>
                    )}
                  </div>
                  {skill.description && (
                    <p className="text-sm text-zinc-500 mt-0.5 truncate">{skill.description}</p>
                  )}
                  <p className="text-xs text-zinc-400 mt-1">
                    {skill.form_fields?.length ?? 0} 个输入字段
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={skill.enabled}
                    onCheckedChange={() => toggleEnabled(skill)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setEditing(skill)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                    onClick={() => deleteSkill(skill.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Skill editor dialog */}
      {editing !== null && (
        <SkillEditor
          skill={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadSkills() }}
        />
      )}
    </div>
  )
}
