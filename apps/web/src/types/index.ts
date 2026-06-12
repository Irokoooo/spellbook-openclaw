export type AgentStatus = 'online' | 'offline' | 'busy'
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Agent {
  id: string
  user_id: string
  name: string
  status: AgentStatus
  last_seen: string | null
  created_at: string
}

export interface Skill {
  id: string
  user_id: string
  name: string
  description: string
  // JSON schema defining the input form fields shown to users
  form_fields: SkillFormField[]
  // The system prompt / SKILL.md content
  prompt: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface SkillFormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  placeholder?: string
  required?: boolean
  options?: string[] // for select type
}

export interface Task {
  id: string
  agent_id: string
  skill_id: string | null
  skill_name: string
  input: Record<string, unknown>
  output: string | null
  status: TaskStatus
  error: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  skill_id: string | null
  title: string
  messages: Message[]
  created_at: string
}
