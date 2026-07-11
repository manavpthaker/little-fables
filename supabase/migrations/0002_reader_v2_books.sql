-- Little Fables v2 — store the full Book as a jsonb blob on reader_stories.
-- Keeps the row/index shape the same while letting the client evolve the Book
-- schema (chapters, buddy state hooks, worldstate) without more migrations.
-- Also adds transcript to reader_retells (server-side Whisper transcription).

alter table reader_stories
  add column if not exists book jsonb;

-- Keep the old typed columns tolerant of nulls; new rows can rely on `book`.
alter table reader_stories alter column pages drop not null;

alter table reader_retells
  add column if not exists transcript text;

-- Additional v2 state (buddy, badges, reading days, wordbook, worldstate).
-- All are per-user singleton blobs; the client owns the schema in `data`.
create table if not exists reader_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table reader_state enable row level security;

drop policy if exists reader_state_select on reader_state;
create policy reader_state_select on reader_state
  for select using (user_id = (select auth.uid()));

drop policy if exists reader_state_insert on reader_state;
create policy reader_state_insert on reader_state
  for insert with check (user_id = (select auth.uid()));

drop policy if exists reader_state_update on reader_state;
create policy reader_state_update on reader_state
  for update using (user_id = (select auth.uid()))
             with check (user_id = (select auth.uid()));
