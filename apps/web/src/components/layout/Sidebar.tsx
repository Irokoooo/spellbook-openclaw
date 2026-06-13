'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'
import {
  MessageSquare, ListTodo, Sparkles, Settings, LogOut, Wand2, Menu, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import AgentStatusBadge from './AgentStatusBadge'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useParticles } from '@/contexts/ParticlesContext'

const navItems = [
  { href: '/chat',            label: '对话',       icon: MessageSquare },
  { href: '/tasks',           label: '任务',       icon: ListTodo },
  { href: '/skills',          label: 'Skills',    icon: Sparkles },
  { href: '/skills/workshop', label: 'Skill 工坊', icon: Wand2 },
  { href: '/settings',        label: '设置',       icon: Settings },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navRef = useRef<HTMLElement>(null)
  const { enabled: particlesEnabled, toggle: toggleParticles } = useParticles()

  // Detect mobile
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    addEventListener('resize', check)
    return () => removeEventListener('resize', check)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Entrance animation
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(el.querySelectorAll('a'), {
        opacity: 0, x: -8, duration: 0.22, ease: 'power2.out',
        stagger: 0.04, clearProps: 'transform,opacity',
      })
    })
    return () => mm.revert()
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('退出失败')
    } else {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white border shadow-sm hover:bg-zinc-50 transition-colors"
        aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
      >
        {mobileOpen ? <X className="h-4 w-4 text-zinc-600" /> : <Menu className="h-4 w-4 text-zinc-600" />}
      </button>

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'flex h-screen w-56 flex-col border-r bg-zinc-50 shrink-0 transition-transform duration-300',
          isMobile
            ? 'fixed left-0 top-0 z-40' + (mobileOpen ? ' translate-x-0' : ' -translate-x-full')
            : 'relative',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b">
          <Wand2 className="h-5 w-5 text-violet-600" />
          <span className="font-bold text-zinc-900">SpellBook</span>
        </div>

        {/* Nav */}
        <nav ref={navRef} className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t px-4 py-3 space-y-2">
          <AgentStatusBadge />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-900"
            onClick={toggleParticles}
            title={particlesEnabled ? '关闭魔法粒子' : '开启魔法粒子'}
          >
            <Sparkles className={cn('h-4 w-4', particlesEnabled ? 'text-violet-400' : 'text-zinc-400')} />
            <span className="text-xs">{particlesEnabled ? '粒子特效：开' : '粒子特效：关'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-900"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      </aside>
    </>
  )
}
