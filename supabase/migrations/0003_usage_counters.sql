-- Daily usage counters — the cost circuit-breaker for the public API routes.
-- One row per (day, kind); kinds are 'tts', 'art', 'story', 'respond',
-- 'listen', 'score'. The routes fail OPEN if this table is missing or
-- unreachable (a breaker, not a gate), so applying this migration is what
-- actually arms the budget.
--
-- Run in the Supabase SQL editor (same project as art_artifacts).

create table if not exists public.usage_counters (
  day date not null,
  kind text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, kind)
);

-- Service-role only — no anon policies. RLS on with no policies means only
-- the service key (which bypasses RLS) can touch it.
alter table public.usage_counters enable row level security;

-- Atomic increment-and-read so concurrent serverless invocations can't race
-- past the limit.
create or replace function public.bump_usage(p_kind text)
returns integer
language sql
security definer
as $$
  insert into public.usage_counters as u (day, kind, count)
  values (current_date, p_kind, 1)
  on conflict (day, kind)
  do update set count = u.count + 1, updated_at = now()
  returning count;
$$;
