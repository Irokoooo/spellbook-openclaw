-- Conversation history tables
-- Run this in the Supabase SQL Editor (or via `supabase db push`)

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  session_id text,
  created_at timestamptz default now() not null
);
alter table conversations enable row level security;
drop policy if exists "Users can manage own conversations" on conversations;
create policy "Users can manage own conversations"
  on conversations for all using (auth.uid() = user_id);

create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null,
  data jsonb not null,
  created_at timestamptz default now() not null
);
alter table conversation_messages enable row level security;
drop policy if exists "Users can manage own messages" on conversation_messages;
create policy "Users can manage own messages"
  on conversation_messages for all
  using (exists (
    select 1 from conversations c
    where c.id = conversation_messages.conversation_id
      and c.user_id = auth.uid()
  ));
