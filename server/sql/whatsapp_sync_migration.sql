-- WhatsApp data sync tabellen (idempotent)
-- Run dit in Supabase SQL Editor.

create table if not exists public.wa_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  client_id text not null,
  connected boolean not null default false,
  my_number text,
  last_error text,
  last_connected_at timestamptz,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_chats (
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_id text not null,
  name text,
  phone_number text,
  avatar text,
  is_group boolean not null default false,
  unread_count integer not null default 0,
  timestamp bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, chat_id)
);

create index if not exists wa_chats_user_timestamp_idx
  on public.wa_chats (user_id, timestamp desc);

create table if not exists public.wa_messages (
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_id text not null,
  message_id text not null,
  body text not null default '',
  from_me boolean not null default false,
  timestamp bigint not null default 0,
  type text not null default 'chat',
  author text,
  updated_at timestamptz not null default now(),
  primary key (user_id, chat_id, message_id)
);

create index if not exists wa_messages_user_chat_timestamp_idx
  on public.wa_messages (user_id, chat_id, timestamp desc);

alter table public.wa_connections enable row level security;
alter table public.wa_chats enable row level security;
alter table public.wa_messages enable row level security;

drop policy if exists "wa_connections_select_own" on public.wa_connections;
drop policy if exists "wa_connections_insert_own" on public.wa_connections;
drop policy if exists "wa_connections_update_own" on public.wa_connections;
drop policy if exists "wa_chats_select_own" on public.wa_chats;
drop policy if exists "wa_chats_insert_own" on public.wa_chats;
drop policy if exists "wa_chats_update_own" on public.wa_chats;
drop policy if exists "wa_messages_select_own" on public.wa_messages;
drop policy if exists "wa_messages_insert_own" on public.wa_messages;
drop policy if exists "wa_messages_update_own" on public.wa_messages;

create policy "wa_connections_select_own"
on public.wa_connections
for select
using (auth.uid() = user_id);

create policy "wa_connections_insert_own"
on public.wa_connections
for insert
with check (auth.uid() = user_id);

create policy "wa_connections_update_own"
on public.wa_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wa_chats_select_own"
on public.wa_chats
for select
using (auth.uid() = user_id);

create policy "wa_chats_insert_own"
on public.wa_chats
for insert
with check (auth.uid() = user_id);

create policy "wa_chats_update_own"
on public.wa_chats
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wa_messages_select_own"
on public.wa_messages
for select
using (auth.uid() = user_id);

create policy "wa_messages_insert_own"
on public.wa_messages
for insert
with check (auth.uid() = user_id);

create policy "wa_messages_update_own"
on public.wa_messages
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
