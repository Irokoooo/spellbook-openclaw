'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import type { AgentStatus } from '@/types'

interface AgentInfo {
  id: string
  name: string
  status: AgentStatus
  last_seen: string | null
}

function buildConfigToml(agentId: string, agentName: string): string {
  return `# SpellBook OpenClaw — Local Agent Config
# 由 SpellBook 设置页自动生成，请勿手动修改 agent_id

supabase_url = "${process.env.NEXT_PUBLIC_SUPABASE_URL}"
supabase_anon_key = "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
agent_id = "${agentId}"   # ${agentName}

# 心跳间隔（秒）
heartbeat_interval = 30

# 空闲时轮询任务的间隔（秒）
poll_interval = 5

# openclaw 可执行文件路径 — Windows 请使用 .cmd 路径
# 安装方式: npm install -g openclaw
openclaw_path = "openclaw"

# 本地 SQLite 数据库路径
local_db_path = "./data/db.sqlite"
`
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const [agentName, setAgentName] = useState('')
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [creating, setCreating] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')

      const { data } = await supabase
        .from('agents')
        .select('id, name, status, last_seen')
        .eq('user_id', user.id)
        .order('created_at')

      setAgents(data ?? [])
    }
    load()
  }, [supabase])

  async function registerAgent() {
    if (!agentName.trim()) return
    setCreating(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setCreating(false); return }

    const res = await fetch('/api/agent/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name: agentName.trim() }),
    })

    const result = await res.json()

    if (!res.ok) {
      toast.error('注册失败：' + result.error)
    } else {
      const newAgent: AgentInfo = {
        id: result.agent_id,
        name: result.agent_name,
        status: 'offline',
        last_seen: null,
      }
      setAgents((prev) => [...prev, newAgent])
      setAgentName('')

      // Auto-download config.toml
      downloadFile('config.toml', buildConfigToml(result.agent_id, result.agent_name))
      toast.success('Agent 已注册，config.toml 已下载')
    }

    setCreating(false)
  }

  async function deleteAgent(agentId: string) {
    const { error } = await supabase.from('agents').delete().eq('id', agentId)
    if (error) {
      toast.error('删除失败')
    } else {
      setAgents((prev) => prev.filter((a) => a.id !== agentId))
      toast.success('Agent 已删除')
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">设置</h1>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">账号</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">邮箱：<span className="text-zinc-900">{userEmail}</span></p>
          </CardContent>
        </Card>

        <Separator />

        {/* Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">本地 Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500">
              注册 Agent 后会自动下载 <code className="font-mono bg-zinc-100 px-1 rounded">config.toml</code>，
              放到本地 Agent 目录后运行 <code className="font-mono bg-zinc-100 px-1 rounded">start_agent.bat</code> 即可。
            </p>

            {/* Existing agents */}
            {agents.length > 0 && (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="rounded-lg border p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{agent.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            agent.status === 'online'
                              ? 'text-green-700 bg-green-50'
                              : agent.status === 'busy'
                              ? 'text-yellow-700 bg-yellow-50'
                              : 'text-zinc-500'
                          }`}
                        >
                          {agent.status === 'online' ? '在线' : agent.status === 'busy' ? '执行中' : '离线'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">{agent.id}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => downloadFile('config.toml', buildConfigToml(agent.id, agent.name))}
                    >
                      <Download className="h-3 w-3" />
                      config.toml
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { navigator.clipboard.writeText(agent.id); toast.success('Agent ID 已复制') }}
                    >
                      复制 ID
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-400 hover:text-red-600"
                      onClick={() => deleteAgent(agent.id)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Register new */}
            <div className="flex gap-2">
              <Input
                placeholder="Agent 名称（如：办公室电脑）"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && registerAgent()}
              />
              <Button onClick={registerAgent} disabled={creating || !agentName.trim()}>
                {creating ? '注册中...' : '注册并下载配置'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
