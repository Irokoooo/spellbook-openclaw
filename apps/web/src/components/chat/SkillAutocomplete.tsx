'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'
import type { Skill } from '@/types'

interface Props {
  open: boolean
  query: string
  onSelect: (skill: Skill) => void
  onClose: () => void
  anchorRect: DOMRect | null
}

export default function SkillAutocomplete({ open, query, onSelect, onClose, anchorRect }: Props) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [filtered, setFiltered] = useState<Skill[]>([])
  const [highlightIdx, setHighlightIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load skills once
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('skills')
        .select('id, name, description, form_fields, prompt, enabled, user_id, created_at, updated_at')
        .eq('enabled', true)
        .order('name')
      if (!cancelled) {
        setSkills(data ?? [])
      }
    })()
    return () => { cancelled = true }
  }, [open, supabase])

  // Filter & highlight
  useEffect(() => {
    if (!query) {
      setFiltered(skills)
    } else {
      const q = query.toLowerCase()
      setFiltered(skills.filter(s =>
        s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      ))
    }
    setHighlightIdx(0)
  }, [query, skills])

  // Keyboard nav
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[highlightIdx]) {
      e.preventDefault()
      onSelect(filtered[highlightIdx])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [open, filtered, highlightIdx, onSelect, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!open || filtered.length === 0) return null

  const style: React.CSSProperties = anchorRect
    ? {
        position: 'fixed',
        left: anchorRect.left,
        top: anchorRect.bottom + 4,
        width: Math.max(anchorRect.width, 320),
        zIndex: 9999,
      }
    : {}

  return (
    <div
      ref={listRef}
      style={style}
      className="rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden"
    >
      <div className="px-3 py-1.5 text-[10px] text-zinc-400 uppercase tracking-wider border-b bg-zinc-50">
        匹配 Skill — 按 Enter 选择，Esc 关闭
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.map((skill, i) => (
          <button
            key={skill.id}
            className={`w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors ${
              i === highlightIdx ? 'bg-violet-50 border-l-2 border-violet-500' : 'border-l-2 border-transparent'
            }`}
            onMouseEnter={() => setHighlightIdx(i)}
            onClick={() => onSelect(skill)}
          >
            <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-800">{skill.name}</div>
              {skill.description && (
                <div className="text-xs text-zinc-400 truncate mt-0.5">{skill.description}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
