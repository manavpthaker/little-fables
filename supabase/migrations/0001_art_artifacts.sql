-- Production art pipeline — artifact tracking table.
-- Run in the Supabase SQL editor (or `supabase db push`).
--
-- Storage buckets are created separately (see docs/art-production-setup.md):
--   art-candidates  PRIVATE
--   art-live        PUBLIC

create table if not exists public.art_artifacts (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('sheet', 'scene', 'cover')),
  character_id  text,           -- sheets
  book_id       text,           -- scenes / covers
  chapter_idx   int,            -- scenes
  page_idx      int,            -- scenes
  candidate_path text not null, -- path in the private art-candidates bucket
  live_url      text,           -- public URL in art-live, set on approval
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  model         text,
  prompt        text,
  created_at    timestamptz not null default now(),
  approved_at   timestamptz
);

create index if not exists art_artifacts_status_idx on public.art_artifacts (status);
create index if not exists art_artifacts_book_idx   on public.art_artifacts (book_id, status);
create index if not exists art_artifacts_char_idx   on public.art_artifacts (character_id, status);

-- RLS: all writes go through server routes using the service-role key (which
-- bypasses RLS), so no policies are needed for the pipeline itself. We enable
-- RLS and add a single PUBLIC-READ policy for APPROVED rows only, so the
-- kid-facing reader can read live overrides directly with the anon key if we
-- ever want to skip the /api/art/live route. Candidates (pending/rejected) are
-- never selectable by anon.
alter table public.art_artifacts enable row level security;

drop policy if exists "approved art is public" on public.art_artifacts;
create policy "approved art is public"
  on public.art_artifacts
  for select
  to anon, authenticated
  using (status = 'approved');
