'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Monitor, Moon, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

const THEMES = [
  { key: 'default',  label: '默认',  Icon: Monitor },
  { key: 'grimoire', label: '典籍',  Icon: Moon    },
  { key: 'studio',   label: '工坊',  Icon: Palette },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = THEMES.find((t) => t.key === theme) ?? THEMES[0]
  const nextIndex = (THEMES.findIndex((t) => t.key === theme) + 1) % THEMES.length
  const next = THEMES[nextIndex]

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-900"
      onClick={() => setTheme(next.key)}
      title={`切换到：${next.label}`}
    >
      <current.Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs">{current.label}主题</span>
    </Button>
  )
}
