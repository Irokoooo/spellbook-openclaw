'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Skill, SkillFormField } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  skill: Skill | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY_FIELD: SkillFormField = {
  name: '',
  label: '',
  type: 'text',
  placeholder: '',
  required: true,
}

export default function SkillEditor({ skill, onClose, onSaved }: Props) {
  const [name, setName] = useState(skill?.name ?? '')
  const [description, setDescription] = useState(skill?.description ?? '')
  const [prompt, setPrompt] = useState(skill?.prompt ?? '')
  const [fields, setFields] = useState<SkillFormField[]>(
    skill?.form_fields ?? []
  )
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function updateField(index: number, patch: Partial<SkillFormField>) {
    setFields((prev) => prev.map((f, i) => i === index ? { ...f, ...patch } : f))
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('请填写 Skill 名称'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      name: name.trim(),
      description: description.trim(),
      prompt: prompt.trim(),
      form_fields: fields,
    }

    let error
    if (skill) {
      ;({ error } = await supabase.from('skills').update(payload).eq('id', skill.id))
    } else {
      ;({ error } = await supabase.from('skills').insert(payload))
    }

    if (error) {
      toast.error('保存失败：' + error.message)
    } else {
      toast.success(skill ? 'Skill 已更新' : 'Skill 已创建')
      onSaved()
    }

    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{skill ? '编辑 Skill' : '新建 Skill'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>名称 *</Label>
              <Input
                placeholder="市场盘点助手"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Input
                placeholder="一句话说明这个 Skill 的作用"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <Label>系统提示词 (Prompt)</Label>
            <Textarea
              placeholder="你是一名资深市场分析师。用户会提供项目名称和城市，请..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <Separator />

          {/* Form fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>输入字段</Label>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setFields((prev) => [...prev, { ...EMPTY_FIELD }])}
              >
                <Plus className="h-3.5 w-3.5" />
                添加字段
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">
                无输入字段 — 用户将直接提交执行
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">字段 {i + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                        onClick={() => removeField(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">字段名（英文）</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="project_name"
                          value={field.name}
                          onChange={(e) => updateField(i, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">显示标签</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="项目名称"
                          value={field.label}
                          onChange={(e) => updateField(i, { label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">类型</Label>
                        <Select
                          value={field.type}
                          onValueChange={(v) => updateField(i, { type: (v ?? 'text') as SkillFormField['type'] })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">单行文本</SelectItem>
                            <SelectItem value="textarea">多行文本</SelectItem>
                            <SelectItem value="number">数字</SelectItem>
                            <SelectItem value="select">下拉选择</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">占位提示</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="例：光明新城"
                          value={field.placeholder ?? ''}
                          onChange={(e) => updateField(i, { placeholder: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
