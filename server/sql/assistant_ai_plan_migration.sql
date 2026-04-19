-- AI plan opslag voor onboarding flow (idempotent)
-- Run dit in Supabase SQL Editor als je schema al bestond.

alter table public.assistant_profiles add column if not exists ai_plan jsonb;
alter table public.assistant_profiles add column if not exists ai_plan_summary text;
alter table public.assistant_profiles add column if not exists ai_plan_status text;
alter table public.assistant_profiles add column if not exists ai_plan_updated_at timestamptz;

update public.assistant_profiles
set ai_plan = coalesce(ai_plan, '{}'::jsonb),
    ai_plan_status = coalesce(ai_plan_status, 'idle');

alter table public.assistant_profiles
  alter column ai_plan set default '{}'::jsonb,
  alter column ai_plan set not null,
  alter column ai_plan_status set default 'idle',
  alter column ai_plan_status set not null;

alter table public.assistant_profiles
  drop constraint if exists assistant_profiles_ai_plan_status_check;

alter table public.assistant_profiles
  add constraint assistant_profiles_ai_plan_status_check
  check (ai_plan_status in ('idle', 'generating', 'ready', 'error'));
