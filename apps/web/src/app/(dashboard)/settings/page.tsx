'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Download, BookOpen, MessageCircle, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { AgentStatus } from '@/types'
import { marked } from 'marked'

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
  const [outputDir, setOutputDir] = useState('')
  const [savedDir, setSavedDir] = useState('')
  const [danmakuOn, setDanmakuOn] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualContent, setManualContent] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  const STORAGE_KEY = 'spellbook_default_output_dir'

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || ''
    setOutputDir(saved)
    setSavedDir(saved)
  }, [])

  function saveOutputDir(dir: string) {
    localStorage.setItem(STORAGE_KEY, dir)
    setSavedDir(dir)
    toast.success('默认输出目录已保存')
  }
  const [agentName, setAgentName] = useState('')
  const [agents, setAgents] = useState<AgentInfo[]>([])

  function downloadOpenClawEnv() {
    const apiKey = (document.getElementById("openclaw-apikey") as HTMLInputElement)?.value || ""
    const baseUrl = (document.getElementById("openclaw-baseurl") as HTMLInputElement)?.value || ""
    if (!apiKey) { toast.error("请先输入 API Key"); return }
    let envContent = `# SpellBook OpenClaw - Environment Configuration
# Generated from SpellBook settings page

DEEPSEEK_API_KEY=${apiKey}`
    if (baseUrl) {
      envContent += `\nOPENCLAW_BASE_URL=${baseUrl}`
    }
    downloadFile(".env", envContent)
    toast.success(".env 配置文件已下载，请放到 %USERPROFILE%\\\\.openclaw\\\\.env")
  }

  function showOpenClawHelp() {
    toast("配置说明", {
      description: "下载 .env 文件后，放到 C:\\\\Users\\\\你的用户名\\\\.openclaw\\\\.env 即可。或者运行 openclaw config 进入引导配置。"
    })
  }
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
    const dm = localStorage.getItem('spellbook_danmaku_enabled')
    if (dm === 'true') setDanmakuOn(true)
  }, [supabase])

  async function toggleDanmaku() {
    const next = !danmakuOn
    setDanmakuOn(next)
    localStorage.setItem('spellbook_danmaku_enabled', String(next))
  }

  async function openManual() {
    if (manualContent) { setManualOpen(true); return }
    setManualLoading(true)
    setManualOpen(true)
    try {
      const res = await fetch('/api/user-manual')
      if (res.ok) {
        const data = await res.json()
        setManualContent(marked.parse(data.content) as string)
      }
    } catch {} finally { setManualLoading(false) }
  }

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
                      {agent.last_seen && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          ???{new Date(agent.last_seen).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
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

        {/* One-Click Installer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">一键安装 Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-500">
              下载安装包直接运行，无需手动安装 Python 和依赖项。安装程序会自动检测已安装的 openclaw，
              并引导您完成配置。
            </p>
            <div className="flex gap-2">
              <a href="/downloads/SpellBook_Agent_Setup.exe" download>
                <Button>
                  <Download className="h-4 w-4 mr-1.5" />
                  下载安装包 (16MB)
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* OpenClaw Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">龙虾（OpenClaw）配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-500">
              配置 AI 模型的接入信息。Agent 需要通过龙虾调用 AI 来执行任务。
              支持任意 <strong>OpenAI 兼容</strong> 的 API 提供商。
            </p>

            <div className="grid gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1">API Key</label>
                <Input
                  id="openclaw-apikey"
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1">
                  Base URL
                  <span className="text-zinc-300 font-normal">（可选，默认 DeepSeek）</span>
                </label>
                <Input
                  id="openclaw-baseurl"
                  placeholder="https://api.deepseek.com"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  常用：OpenAI: api.openai.com/v1 · 通义千问: dashscope.aliyuncs.com/compatible-mode/v1 · 智谱: open.bigmodel.cn/api/paas/v4 · 月之暗面: api.moonshot.cn/v1
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" id="download-openclaw-env" onClick={downloadOpenClawEnv}>
                下载配置文件 (.env)
              </Button>
              <Button size="sm" variant="outline" id="show-openclaw-help" onClick={showOpenClawHelp}>
                查看详细指引
              </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              下载后将文件放到 <code className="font-mono bg-amber-100 px-1 rounded">%USERPROFILE%\.openclaw\.env</code>（替换已有文件），
              或者通过命令行运行 <code className="font-mono bg-amber-100 px-1 rounded">openclaw config</code> 完成配置。
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Danmaku Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">????</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-500">
              ???????????????????????????????
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDanmaku}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${danmakuOn ? 'bg-emerald-500' : 'bg-zinc-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${danmakuOn ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-zinc-600">
                {danmakuOn ? '?????' : '?????'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* User Manual */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={openManual}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                ??????
              </CardTitle>
              {manualOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
            </div>
          </CardHeader>
          {manualOpen && (
            <CardContent>
              {manualLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : manualContent ? (
                <div
                  className="prose prose-sm max-w-none prose-headings:text-zinc-800 prose-p:text-zinc-600 prose-a:text-emerald-600 prose-code:text-emerald-700 prose-code:bg-zinc-100 prose-code:px-1 prose-code:rounded prose-strong:text-zinc-800 prose-li:text-zinc-600 prose-table:border prose-th:bg-zinc-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-hr:border-zinc-200 max-h-[60vh] overflow-y-auto rounded-lg border bg-zinc-50/50 p-4"
                  dangerouslySetInnerHTML={{ __html: manualContent }}
                />
              ) : (
                <p className="text-sm text-zinc-400 text-center py-4">????????</p>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
