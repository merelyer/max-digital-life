create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 800),
  kind text not null check (kind in ('profile', 'study', 'shared')),
  importance smallint not null check (importance between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.world_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  proactive_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.proactive_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('evening_check_in', 'unfinished_topic')),
  content text not null check (char_length(content) between 1 and 1200),
  delivered_at timestamptz not null default now(),
  dismissed_at timestamptz
);

create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index memories_user_created_idx on public.memories(user_id, created_at desc);
create index proactive_messages_user_delivered_idx on public.proactive_messages(user_id, delivered_at);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.world_states enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.proactive_messages enable row level security;

create policy profiles_owner on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy conversations_owner on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy messages_owner on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy memories_owner on public.memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy world_states_owner on public.world_states for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notification_preferences_owner on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy proactive_messages_owner on public.proactive_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
