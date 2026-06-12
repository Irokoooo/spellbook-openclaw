-- SpellBook Database Schema
-- Run this in Supabase SQL Editor to initialize the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Agents: Local Agent instances registered by users
CREATE TABLE IF NOT EXISTS agents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  last_seen   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills: AI skill definitions (prompt + form config)
CREATE TABLE IF NOT EXISTS skills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  form_fields JSONB NOT NULL DEFAULT '[]',
  prompt      TEXT NOT NULL DEFAULT '',
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks: Task queue entries (metadata only — I/O stays local)
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_id    UUID REFERENCES skills(id) ON DELETE SET NULL,
  skill_name  TEXT NOT NULL,
  -- input/output are stored here for now; for production with sensitive data,
  -- the local agent can encrypt these or omit them entirely
  input       JSONB NOT NULL DEFAULT '{}',
  output      TEXT,
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks  ENABLE ROW LEVEL SECURITY;

-- Agents: users can only access their own agents
CREATE POLICY "agents_select_own" ON agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agents_insert_own" ON agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agents_update_own" ON agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "agents_delete_own" ON agents FOR DELETE USING (auth.uid() = user_id);

-- Skills: users can only access their own skills
CREATE POLICY "skills_select_own" ON skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "skills_insert_own" ON skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skills_update_own" ON skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "skills_delete_own" ON skills FOR DELETE USING (auth.uid() = user_id);

-- Tasks: users can access tasks belonging to their agents
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT
  WITH CHECK (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable Realtime for tasks and agents tables
-- (run in Supabase Dashboard > Database > Replication, or via SQL:)
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;

-- ============================================================
-- SEED: Demo skill examples
-- ============================================================

-- NOTE: Replace <your-user-id> with your actual auth.users UUID before running
-- INSERT INTO skills (user_id, name, description, form_fields, prompt) VALUES
-- (
--   '<your-user-id>',
--   '市场盘点助手',
--   '输入项目名称，自动搜索周边地块和竞品楼盘信息',
--   '[{"name":"project_name","label":"项目名称","type":"text","placeholder":"例：光明新城","required":true},{"name":"city","label":"城市","type":"text","placeholder":"例：深圳","required":true}]',
--   '你是一名房地产市场分析专家。用户会提供项目名称和城市，请帮助分析...'
-- );
