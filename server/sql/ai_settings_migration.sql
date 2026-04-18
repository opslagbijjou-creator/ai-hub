  -- ai_settings per-user migratie (idempotent)
  -- Run dit in Supabase SQL Editor.

  create table if not exists public.ai_settings (
    user_id uuid primary key references auth.users (id) on delete cascade,
    target_audience text not null default 'all',
    knowledge text not null default '',
    calendar_connected boolean not null default false,
    updated_at timestamptz not null default now(),
    constraint ai_settings_target_audience_check
      check (target_audience in ('all', 'new', 'none'))
  );

  alter table public.ai_settings add column if not exists user_id uuid;
  alter table public.ai_settings add column if not exists target_audience text;
  alter table public.ai_settings add column if not exists knowledge text;
  alter table public.ai_settings add column if not exists calendar_connected boolean;
  alter table public.ai_settings add column if not exists updated_at timestamptz;

  do $$
  begin
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'ai_settings'
        and column_name = 'targetaudience'
    ) then
      execute 'update public.ai_settings
              set target_audience = coalesce(target_audience, targetaudience, ''all'')';
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'ai_settings'
        and column_name = 'calendarconnected'
    ) then
      execute 'update public.ai_settings
              set calendar_connected = coalesce(calendar_connected, calendarconnected, false)';
    end if;
  end $$;

  update public.ai_settings
  set target_audience = coalesce(target_audience, 'all'),
      knowledge = coalesce(knowledge, ''),
      calendar_connected = coalesce(calendar_connected, false),
      updated_at = coalesce(updated_at, now());

  alter table public.ai_settings
    alter column target_audience set default 'all',
    alter column knowledge set default '',
    alter column calendar_connected set default false,
    alter column updated_at set default now();

  with ranked as (
    select ctid,
          row_number() over (partition by user_id order by updated_at desc nulls last, ctid desc) as rn
    from public.ai_settings
    where user_id is not null
  )
  delete from public.ai_settings t
  using ranked r
  where t.ctid = r.ctid
    and r.rn > 1;

  do $$
  begin
    if not exists (
      select 1
      from pg_constraint
      where conname = 'ai_settings_user_id_key'
    ) then
      alter table public.ai_settings
        add constraint ai_settings_user_id_key unique (user_id);
    end if;
  exception
    when duplicate_table then null;
    when duplicate_object then null;
  end $$;

  insert into public.ai_settings (user_id, target_audience, knowledge, calendar_connected, updated_at)
  select u.id,
        coalesce(seed.target_audience, 'all'),
        coalesce(seed.knowledge, 'Wij zijn een behulpzaam bedrijf.'),
        coalesce(seed.calendar_connected, false),
        now()
  from auth.users u
  left join lateral (
    select s.target_audience, s.knowledge, s.calendar_connected
    from public.ai_settings s
    order by s.updated_at desc nulls last
    limit 1
  ) seed on true
  where not exists (
    select 1
    from public.ai_settings existing
    where existing.user_id = u.id
  );

  alter table public.ai_settings enable row level security;

  drop policy if exists "ai_settings_select_own" on public.ai_settings;
  drop policy if exists "ai_settings_insert_own" on public.ai_settings;
  drop policy if exists "ai_settings_update_own" on public.ai_settings;

  create policy "ai_settings_select_own"
  on public.ai_settings
  for select
  using (auth.uid() = user_id);

  create policy "ai_settings_insert_own"
  on public.ai_settings
  for insert
  with check (auth.uid() = user_id);

  create policy "ai_settings_update_own"
  on public.ai_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
