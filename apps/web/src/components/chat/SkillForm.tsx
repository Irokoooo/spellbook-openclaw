'use client'

import type { Skill } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  skill: Skill
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}

export default function SkillForm({ skill, values, onChange }: Props) {
  if (!skill.form_fields || skill.form_fields.length === 0) return null

  function set(name: string, value: string) {
    onChange({ ...values, [name]: value })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-zinc-50 p-4">
      {skill.form_fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name} className="text-sm">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>

          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={values[field.name] ?? ''}
              onChange={(e) => set(field.name, e.target.value)}
              required={field.required}
              rows={3}
            />
          ) : field.type === 'select' ? (
            <Select
              value={values[field.name] ?? ''}
              onValueChange={(v) => set(field.name, v ?? '')}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={field.placeholder ?? '请选择'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.name}
              type={field.type === 'number' ? 'number' : 'text'}
              placeholder={field.placeholder}
              value={values[field.name] ?? ''}
              onChange={(e) => set(field.name, e.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}
    </div>
  )
}
