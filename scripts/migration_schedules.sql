-- Migration: create schedules table for cron-based task scheduling
-- Run in Supabase SQL Editor

create table if not exists schedules (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text not null default '',
  skill_id        uuid references skills(id) on delete set null,
  skill_name      text not null,
  input_template  jsonb not null default '{}',
  cron_expression text not null,
  enabled         boolean not null default true,
  last_run_at     timestamptz,
  next_run_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table schedules enable row level security;

create policy "users: own schedules only"
  on schedules for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to auto-update updated_at
create or replace function update_schedules_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_schedules_updated_at
  before update on schedules
  for each row execute function update_schedules_updated_at();
