'use client'

import type { Skill } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDown, Sparkles } from 'lucide-react'

interface Props {
  skills: Skill[]
  selected: Skill | null
  onSelect: (skill: Skill) => void
}

export default function SkillSelector({ skills, selected, onSelect }: Props) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        暂无可用 Skill，请前往{' '}
        <a href="/skills" className="underline text-violet-600">Skills 管理</a>{' '}
        添加
      </p>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700',
          'hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1'
        )}
      >
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        {selected ? selected.name : '选择 Skill'}
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {skills.map((skill) => (
          <DropdownMenuItem
            key={skill.id}
            onClick={() => onSelect(skill)}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="font-medium">{skill.name}</span>
            {skill.description && (
              <span className="text-xs text-zinc-400 line-clamp-1">{skill.description}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
