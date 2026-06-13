'use client'

import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { LeafyGreen, Moon, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { gsap } from 'gsap'

const THEMES = [
  { key: 'studio',   label: '工坊',  Icon: Palette },
  { key: 'grimoire', label: '典籍',  Icon: Moon    },
  { key: 'default',  label: '森林',  Icon: LeafyGreen },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const iconRef = useRef<SVGSVGElement>(null)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = THEMES.find((t) => t.key === theme) ?? THEMES[0]
  const nextIndex = (THEMES.findIndex((t) => t.key === theme) + 1) % THEMES.length
  const next = THEMES[nextIndex]

  function handleClick() {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (iconRef.current) {
        gsap.fromTo(iconRef.current,
          { rotate: 0 },
          { rotate: 180, duration: 0.3, ease: 'power2.inOut', clearProps: 'transform' }
        )
      }
    })
    setTheme(next.key)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-900"
      onClick={handleClick}
      title={`切换到：${next.label}`}
    >
      <current.Icon ref={iconRef} className="h-4 w-4 shrink-0" />
      <span className="text-xs">{current.label}主题</span>
    </Button>
  )
}
