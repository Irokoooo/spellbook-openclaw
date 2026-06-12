'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  ListTodo,
  Sparkles,
  Settings,
  LogOut,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import AgentStatusBadge from './AgentStatusBadge'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navItems = [
  { href: '/chat',            label: '对话',       icon: MessageSquare },
  { href: '/tasks',           label: '任务',       icon: ListTodo },
  { href: '/skills',          label: 'Skills',    icon: Sparkles },
  { href: '/skills/workshop', label: 'Skill 工坊', icon: Wand2 },
  { href: '/settings',        label: '设置',       icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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
    <aside className="flex h-screen w-56 flex-col border-r bg-zinc-50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Wand2 className="h-5 w-5 text-violet-600" />
        <span className="font-bold text-zinc-900">SpellBook</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
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
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
      </div>
    </aside>
  )
}
