-- SpellBook Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── agents ─────────────────────────────────────────────────────────────────
create table if not exists agents (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  status     text not null default 'offline' check (status in ('online', 'offline', 'busy')),
  last_seen  timestamptz,
  created_at timestamptz not null default now()
);

alter table agents enable row level security;

create policy "users: own agents only"
  on agents for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── skills ─────────────────────────────────────────────────────────────────
create table if not exists skills (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text not null default '',
  form_fields jsonb not null default '[]',
  prompt      text not null default '',
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table skills enable row level security;

create policy "users: own skills only"
  on skills for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── tasks ──────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id         uuid primary key default uuid_generate_v4(),
  agent_id   uuid not null references agents(id) on delete cascade,
  skill_id   uuid references skills(id) on delete set null,
  skill_name text not null default '',
  input      jsonb not null default '{}',
  output     text,
  status     text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  error      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;

-- Users can read/write tasks belonging to their own agents
create policy "users: tasks via own agents"
  on tasks for all
  using (
    agent_id in (select id from agents where user_id = auth.uid())
  )
  with check (
    agent_id in (select id from agents where user_id = auth.uid())
  );

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable realtime for tasks (Web listens for status updates)
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table agents;
