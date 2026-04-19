-- Call-only MVP schema (idempotent)
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  avatar_key text not null default 'avatar_01',
  status text not null default 'draft',
  live_status text not null default 'not_live',
  billing_status text not null default 'none',
  desired_plan text not null default 'plan_150',
  setup_step integer not null default 1,
  setup_completed boolean not null default false,
  prompt text,
  language text not null default 'nl-NL',
  currency text not null default 'EUR',
  live_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistants_status_check check (status in (
    'draft', 'configured', 'awaiting_payment', 'provisioning_pending', 'live', 'needs_number_reselect'
  )),
  constraint assistants_live_status_check check (live_status in (
    'not_live', 'live', 'needs_number_reselect'
  )),
  constraint assistants_billing_status_check check (billing_status in (
    'none', 'invoice_sent', 'paid_approved', 'active', 'past_due'
  ))
);

alter table public.assistants add column if not exists avatar_key text;
alter table public.assistants add column if not exists setup_step integer;
alter table public.assistants add column if not exists setup_completed boolean;

update public.assistants
set avatar_key = coalesce(avatar_key, 'avatar_01'),
    setup_step = coalesce(setup_step, 1),
    setup_completed = coalesce(setup_completed, false);

alter table public.assistants
  alter column avatar_key set default 'avatar_01',
  alter column avatar_key set not null,
  alter column setup_step set default 1,
  alter column setup_step set not null,
  alter column setup_completed set default false,
  alter column setup_completed set not null;

create table if not exists public.assistant_profiles (
  id bigserial primary key,
  assistant_id uuid not null unique references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null default 'Mijn Bedrijf',
  business_type text,
  services jsonb not null default '[]'::jsonb,
  pricing text,
  opening_hours text,
  tone_of_voice text,
  goals text,
  website_url text,
  secondary_language text,
  role_description text,
  handoff_rules text,
  greeting text,
  knowledge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assistant_profiles add column if not exists website_url text;
alter table public.assistant_profiles add column if not exists secondary_language text;
alter table public.assistant_profiles add column if not exists role_description text;
alter table public.assistant_profiles add column if not exists handoff_rules text;

create table if not exists public.assistant_voices (
  id bigserial primary key,
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  voice_key text not null,
  display_name text not null,
  provider text not null default 'elevenlabs',
  external_voice_id text,
  preview_url text,
  twilio_voice text,
  selected boolean not null default false,
  status text not null default 'selected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assistant_id, voice_key)
);

create index if not exists assistant_voices_selected_idx
  on public.assistant_voices (assistant_id, selected, updated_at desc);

create table if not exists public.assistant_numbers (
  id bigserial primary key,
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  e164 text not null,
  display_label text,
  country_code text,
  provider text not null default 'twilio',
  source text not null default 'wizard',
  twilio_phone_sid text,
  selected boolean not null default false,
  status text not null default 'reserved',
  linked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_numbers_status_check check (status in (
    'reserved', 'live', 'simulated_live', 'needs_number_reselect', 'released'
  )),
  unique (assistant_id, e164)
);

create index if not exists assistant_numbers_selected_idx
  on public.assistant_numbers (assistant_id, selected, updated_at desc);

create table if not exists public.assistant_faq_entries (
  id bigserial primary key,
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null,
  answer text not null,
  position integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assistant_faq_entries_assistant_idx
  on public.assistant_faq_entries (assistant_id, is_active, position asc);

create table if not exists public.assistant_channel_settings (
  id bigserial primary key,
  assistant_id uuid not null unique references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  call_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  sms_templates jsonb not null default '[]'::jsonb,
  whatsapp_templates jsonb not null default '[]'::jsonb,
  availability_mode text not null default 'always',
  availability_schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_channel_settings_mode_check check (availability_mode in ('always', 'custom_hours'))
);

create index if not exists assistant_channel_settings_user_idx
  on public.assistant_channel_settings (user_id, updated_at desc);

create table if not exists public.commerce_integrations (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  status text not null default 'pending_setup',
  store_url text not null,
  access_token text,
  api_key text,
  api_secret text,
  webhook_secret text,
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_integrations_provider_check check (provider in ('shopify', 'prestashop', 'woocommerce', 'magento', 'bigcommerce', 'stripe')),
  constraint commerce_integrations_status_check check (status in ('connected', 'pending_setup', 'disconnected', 'error')),
  unique (assistant_id, provider)
);

alter table public.commerce_integrations add column if not exists metadata jsonb;

update public.commerce_integrations
set metadata = coalesce(metadata, '{}'::jsonb);

alter table public.commerce_integrations
  alter column metadata set default '{}'::jsonb,
  alter column status set default 'pending_setup';

alter table public.commerce_integrations
  drop constraint if exists commerce_integrations_provider_check;

alter table public.commerce_integrations
  add constraint commerce_integrations_provider_check
  check (provider in ('shopify', 'prestashop', 'woocommerce', 'magento', 'bigcommerce', 'stripe'));

alter table public.commerce_integrations
  drop constraint if exists commerce_integrations_status_check;

alter table public.commerce_integrations
  add constraint commerce_integrations_status_check
  check (status in ('connected', 'pending_setup', 'disconnected', 'error'));

create index if not exists commerce_integrations_assistant_idx
  on public.commerce_integrations (assistant_id, status, updated_at desc);

update public.commerce_integrations
set
  access_token = null,
  api_key = null,
  api_secret = null,
  webhook_secret = null,
  status = 'pending_setup',
  last_sync_at = null,
  metadata = jsonb_strip_nulls(
    coalesce(metadata, '{}'::jsonb) ||
    jsonb_build_object(
      'setupMode', 'concierge',
      'managedBy', coalesce(nullif(metadata->>'managedBy', ''), 'admin_after_request'),
      'securityReset', true
    )
  ),
  updated_at = now()
where access_token is not null
   or api_key is not null
   or api_secret is not null
   or webhook_secret is not null
   or coalesce(metadata->>'setupMode', '') = 'self_service';

create table if not exists public.web_test_sessions (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint web_test_sessions_status_check check (status in ('active', 'ended', 'failed'))
);

create index if not exists web_test_sessions_user_idx
  on public.web_test_sessions (user_id, created_at desc);

create table if not exists public.web_test_turns (
  id bigserial primary key,
  session_id uuid not null references public.web_test_sessions (id) on delete cascade,
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  turn_index integer not null,
  role text not null,
  input_text text,
  output_text text,
  latency_ms integer,
  audio_data_url text,
  debug_steps jsonb,
  created_at timestamptz not null default now(),
  constraint web_test_turns_role_check check (role in ('user', 'assistant', 'system'))
);

create index if not exists web_test_turns_session_idx
  on public.web_test_turns (session_id, turn_index asc);

update public.web_test_turns
set audio_data_url = null
where audio_data_url is not null;

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  call_sid text not null unique,
  from_number text,
  to_number text,
  status text not null default 'in_progress',
  duration_seconds integer default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists call_sessions_user_idx
  on public.call_sessions (user_id, created_at desc);

create table if not exists public.call_turns (
  id bigserial primary key,
  call_session_id uuid not null references public.call_sessions (id) on delete cascade,
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  turn_index integer not null,
  role text not null,
  transcript text,
  response_text text,
  created_at timestamptz not null default now(),
  constraint call_turns_role_check check (role in ('user', 'assistant', 'system'))
);

create index if not exists call_turns_session_idx
  on public.call_turns (call_session_id, turn_index asc);

create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'queued',
  trigger text,
  attempt_count integer not null default 0,
  error_message text,
  payload jsonb,
  result jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provisioning_jobs_status_check check (status in (
    'queued', 'processing', 'success', 'failed', 'needs_number_reselect'
  ))
);

create index if not exists provisioning_jobs_assistant_idx
  on public.provisioning_jobs (assistant_id, created_at desc);

create table if not exists public.usage_ledger (
  id bigserial primary key,
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_type text not null,
  quantity numeric not null default 1,
  unit text not null default 'count',
  amount_eur numeric not null default 0,
  metadata jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists usage_ledger_assistant_idx
  on public.usage_ledger (assistant_id, occurred_at desc);

create table if not exists public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  payer_name text,
  email text,
  vat_number text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  billing_account_id uuid references public.billing_accounts (id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'invoice_sent',
  plan_key text not null default 'plan_150',
  amount_eur numeric not null default 0,
  currency text not null default 'EUR',
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_status_check check (status in (
    'draft', 'invoice_sent', 'paid_approved', 'void'
  ))
);

create index if not exists invoices_assistant_idx
  on public.invoices (assistant_id, created_at desc);

create table if not exists public.subscription_state (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null unique references public.assistants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_key text not null default 'plan_150',
  status text not null default 'pending_payment',
  included_minutes integer not null default 0,
  included_tasks integer not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_state_status_check check (status in (
    'pending_payment', 'active', 'paused', 'canceled'
  ))
);

create index if not exists subscription_state_user_idx
  on public.subscription_state (user_id, updated_at desc);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_role_check check (role in ('owner', 'admin', 'support'))
);

create index if not exists admin_users_active_idx
  on public.admin_users (active, updated_at desc);

alter table public.assistants enable row level security;
alter table public.assistant_profiles enable row level security;
alter table public.assistant_voices enable row level security;
alter table public.assistant_numbers enable row level security;
alter table public.assistant_faq_entries enable row level security;
alter table public.assistant_channel_settings enable row level security;
alter table public.commerce_integrations enable row level security;
alter table public.web_test_sessions enable row level security;
alter table public.web_test_turns enable row level security;
alter table public.call_sessions enable row level security;
alter table public.call_turns enable row level security;
alter table public.provisioning_jobs enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.invoices enable row level security;
alter table public.subscription_state enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "assistants_select_own" on public.assistants;
drop policy if exists "assistants_insert_own" on public.assistants;
drop policy if exists "assistants_update_own" on public.assistants;
create policy "assistants_select_own" on public.assistants for select using (auth.uid() = user_id);
create policy "assistants_insert_own" on public.assistants for insert with check (auth.uid() = user_id);
create policy "assistants_update_own" on public.assistants for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assistant_profiles_select_own" on public.assistant_profiles;
drop policy if exists "assistant_profiles_insert_own" on public.assistant_profiles;
drop policy if exists "assistant_profiles_update_own" on public.assistant_profiles;
create policy "assistant_profiles_select_own" on public.assistant_profiles for select using (auth.uid() = user_id);
create policy "assistant_profiles_insert_own" on public.assistant_profiles for insert with check (auth.uid() = user_id);
create policy "assistant_profiles_update_own" on public.assistant_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assistant_voices_select_own" on public.assistant_voices;
drop policy if exists "assistant_voices_insert_own" on public.assistant_voices;
drop policy if exists "assistant_voices_update_own" on public.assistant_voices;
create policy "assistant_voices_select_own" on public.assistant_voices for select using (auth.uid() = user_id);
create policy "assistant_voices_insert_own" on public.assistant_voices for insert with check (auth.uid() = user_id);
create policy "assistant_voices_update_own" on public.assistant_voices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assistant_numbers_select_own" on public.assistant_numbers;
drop policy if exists "assistant_numbers_insert_own" on public.assistant_numbers;
drop policy if exists "assistant_numbers_update_own" on public.assistant_numbers;
create policy "assistant_numbers_select_own" on public.assistant_numbers for select using (auth.uid() = user_id);
create policy "assistant_numbers_insert_own" on public.assistant_numbers for insert with check (auth.uid() = user_id);
create policy "assistant_numbers_update_own" on public.assistant_numbers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assistant_faq_entries_select_own" on public.assistant_faq_entries;
drop policy if exists "assistant_faq_entries_insert_own" on public.assistant_faq_entries;
drop policy if exists "assistant_faq_entries_update_own" on public.assistant_faq_entries;
create policy "assistant_faq_entries_select_own" on public.assistant_faq_entries for select using (auth.uid() = user_id);
create policy "assistant_faq_entries_insert_own" on public.assistant_faq_entries for insert with check (auth.uid() = user_id);
create policy "assistant_faq_entries_update_own" on public.assistant_faq_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assistant_channel_settings_select_own" on public.assistant_channel_settings;
drop policy if exists "assistant_channel_settings_insert_own" on public.assistant_channel_settings;
drop policy if exists "assistant_channel_settings_update_own" on public.assistant_channel_settings;
create policy "assistant_channel_settings_select_own" on public.assistant_channel_settings for select using (auth.uid() = user_id);
create policy "assistant_channel_settings_insert_own" on public.assistant_channel_settings for insert with check (auth.uid() = user_id);
create policy "assistant_channel_settings_update_own" on public.assistant_channel_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "commerce_integrations_select_own" on public.commerce_integrations;
drop policy if exists "commerce_integrations_insert_own" on public.commerce_integrations;
drop policy if exists "commerce_integrations_update_own" on public.commerce_integrations;
create policy "commerce_integrations_select_own" on public.commerce_integrations for select using (auth.uid() = user_id);
create policy "commerce_integrations_insert_own" on public.commerce_integrations for insert with check (auth.uid() = user_id);
create policy "commerce_integrations_update_own" on public.commerce_integrations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "web_test_sessions_select_own" on public.web_test_sessions;
drop policy if exists "web_test_sessions_insert_own" on public.web_test_sessions;
drop policy if exists "web_test_sessions_update_own" on public.web_test_sessions;
create policy "web_test_sessions_select_own" on public.web_test_sessions for select using (auth.uid() = user_id);
create policy "web_test_sessions_insert_own" on public.web_test_sessions for insert with check (auth.uid() = user_id);
create policy "web_test_sessions_update_own" on public.web_test_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "web_test_turns_select_own" on public.web_test_turns;
drop policy if exists "web_test_turns_insert_own" on public.web_test_turns;
drop policy if exists "web_test_turns_update_own" on public.web_test_turns;
create policy "web_test_turns_select_own" on public.web_test_turns for select using (auth.uid() = user_id);
create policy "web_test_turns_insert_own" on public.web_test_turns for insert with check (auth.uid() = user_id);
create policy "web_test_turns_update_own" on public.web_test_turns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "call_sessions_select_own" on public.call_sessions;
drop policy if exists "call_sessions_insert_own" on public.call_sessions;
drop policy if exists "call_sessions_update_own" on public.call_sessions;
create policy "call_sessions_select_own" on public.call_sessions for select using (auth.uid() = user_id);
create policy "call_sessions_insert_own" on public.call_sessions for insert with check (auth.uid() = user_id);
create policy "call_sessions_update_own" on public.call_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "call_turns_select_own" on public.call_turns;
drop policy if exists "call_turns_insert_own" on public.call_turns;
drop policy if exists "call_turns_update_own" on public.call_turns;
create policy "call_turns_select_own" on public.call_turns for select using (auth.uid() = user_id);
create policy "call_turns_insert_own" on public.call_turns for insert with check (auth.uid() = user_id);
create policy "call_turns_update_own" on public.call_turns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "provisioning_jobs_select_own" on public.provisioning_jobs;
drop policy if exists "provisioning_jobs_insert_own" on public.provisioning_jobs;
drop policy if exists "provisioning_jobs_update_own" on public.provisioning_jobs;
create policy "provisioning_jobs_select_own" on public.provisioning_jobs for select using (auth.uid() = user_id);
create policy "provisioning_jobs_insert_own" on public.provisioning_jobs for insert with check (auth.uid() = user_id);
create policy "provisioning_jobs_update_own" on public.provisioning_jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "usage_ledger_select_own" on public.usage_ledger;
drop policy if exists "usage_ledger_insert_own" on public.usage_ledger;
drop policy if exists "usage_ledger_update_own" on public.usage_ledger;
create policy "usage_ledger_select_own" on public.usage_ledger for select using (auth.uid() = user_id);
create policy "usage_ledger_insert_own" on public.usage_ledger for insert with check (auth.uid() = user_id);
create policy "usage_ledger_update_own" on public.usage_ledger for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "billing_accounts_select_own" on public.billing_accounts;
drop policy if exists "billing_accounts_insert_own" on public.billing_accounts;
drop policy if exists "billing_accounts_update_own" on public.billing_accounts;
create policy "billing_accounts_select_own" on public.billing_accounts for select using (auth.uid() = user_id);
create policy "billing_accounts_insert_own" on public.billing_accounts for insert with check (auth.uid() = user_id);
create policy "billing_accounts_update_own" on public.billing_accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "invoices_select_own" on public.invoices;
drop policy if exists "invoices_insert_own" on public.invoices;
drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_select_own" on public.invoices for select using (auth.uid() = user_id);
create policy "invoices_insert_own" on public.invoices for insert with check (auth.uid() = user_id);
create policy "invoices_update_own" on public.invoices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subscription_state_select_own" on public.subscription_state;
drop policy if exists "subscription_state_insert_own" on public.subscription_state;
drop policy if exists "subscription_state_update_own" on public.subscription_state;
create policy "subscription_state_select_own" on public.subscription_state for select using (auth.uid() = user_id);
create policy "subscription_state_insert_own" on public.subscription_state for insert with check (auth.uid() = user_id);
create policy "subscription_state_update_own" on public.subscription_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self" on public.admin_users
  for select
  using (auth.uid() = user_id and active = true);
