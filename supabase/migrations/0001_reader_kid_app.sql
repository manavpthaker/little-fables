-- Story World kid app (/read) — cross-device sync tables.
-- Kept separate from the existing creator-canvas schema (stories,
-- illustrations, character_geometry_profiles, etc.) because the reader is a
-- different product with a different shape. Everything here is prefixed
-- reader_ so it never collides with creator tables.
--
-- Identity model (MVP): one household = one Supabase auth user. Every device
-- (iPad, laptop, phone) signs in via magic link on the same shared email —
-- Supabase gives them the same user_id, so all their rows are automatically
-- one library. If we grow into multi-parent invites later, we migrate to a
-- households + household_members model.
--
-- Paste this whole file into the Supabase SQL editor and run.

-- =============================================================================
-- Tables
-- =============================================================================

create table if not exists reader_stories (
  id             text primary key,             -- app-owned id (uid() or 'miko-bridge')
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  by             text,
  cover_image    text,
  cover_emoji    text not null default '✨',
  cover_bg       text not null default 'linear-gradient(160deg,#38bdf8,#a7f3d0)',
  status         text not null default 'complete' check (status in ('complete','awaiting-choice')),
  source         text not null default 'generated' check (source in ('starter','generated')),
  teaching_goals jsonb not null default '[]'::jsonb,
  vocab          jsonb not null default '[]'::jsonb,   -- [{word, meaning}, ...]
  pages          jsonb not null,                        -- StoryPage[]
  retell_prompts jsonb not null default '[]'::jsonb,
  idea           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists reader_stories_user_id_idx on reader_stories(user_id);
create index if not exists reader_stories_updated_at_idx on reader_stories(user_id, updated_at desc);

create table if not exists reader_retells (
  id           text primary key,               -- app-owned uid
  user_id      uuid not null references auth.users(id) on delete cascade,
  story_id     text not null,
  story_title  text not null,
  mime_type    text,
  duration_ms  integer,
  audio_path   text not null,                  -- storage path inside the retells bucket
  created_at   timestamptz not null default now()
);

create index if not exists reader_retells_user_id_idx on reader_retells(user_id);
create index if not exists reader_retells_created_at_idx on reader_retells(user_id, created_at desc);

create table if not exists reader_universe (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,                    -- Universe blob (matches TS type)
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- updated_at triggers
-- =============================================================================

create or replace function reader_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reader_stories_touch on reader_stories;
create trigger reader_stories_touch
  before update on reader_stories
  for each row execute function reader_touch_updated_at();

drop trigger if exists reader_universe_touch on reader_universe;
create trigger reader_universe_touch
  before update on reader_universe
  for each row execute function reader_touch_updated_at();

-- =============================================================================
-- Row-level security — you can only see and change rows you own.
-- =============================================================================

alter table reader_stories  enable row level security;
alter table reader_retells  enable row level security;
alter table reader_universe enable row level security;

drop policy if exists reader_stories_select on reader_stories;
create policy reader_stories_select on reader_stories
  for select using (user_id = (select auth.uid()));

drop policy if exists reader_stories_insert on reader_stories;
create policy reader_stories_insert on reader_stories
  for insert with check (user_id = (select auth.uid()));

drop policy if exists reader_stories_update on reader_stories;
create policy reader_stories_update on reader_stories
  for update using (user_id = (select auth.uid()))
             with check (user_id = (select auth.uid()));

drop policy if exists reader_stories_delete on reader_stories;
create policy reader_stories_delete on reader_stories
  for delete using (user_id = (select auth.uid()));

drop policy if exists reader_retells_select on reader_retells;
create policy reader_retells_select on reader_retells
  for select using (user_id = (select auth.uid()));

drop policy if exists reader_retells_insert on reader_retells;
create policy reader_retells_insert on reader_retells
  for insert with check (user_id = (select auth.uid()));

drop policy if exists reader_retells_delete on reader_retells;
create policy reader_retells_delete on reader_retells
  for delete using (user_id = (select auth.uid()));

drop policy if exists reader_universe_select on reader_universe;
create policy reader_universe_select on reader_universe
  for select using (user_id = (select auth.uid()));

drop policy if exists reader_universe_insert on reader_universe;
create policy reader_universe_insert on reader_universe
  for insert with check (user_id = (select auth.uid()));

drop policy if exists reader_universe_update on reader_universe;
create policy reader_universe_update on reader_universe
  for update using (user_id = (select auth.uid()))
             with check (user_id = (select auth.uid()));

-- =============================================================================
-- Storage: retell audio blobs
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('reader-retells', 'reader-retells', false)
on conflict (id) do nothing;

drop policy if exists reader_retells_storage_select on storage.objects;
create policy reader_retells_storage_select on storage.objects
  for select
  using (
    bucket_id = 'reader-retells'
    and (select auth.uid())::text = split_part(name, '/', 1)
  );

drop policy if exists reader_retells_storage_insert on storage.objects;
create policy reader_retells_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'reader-retells'
    and (select auth.uid())::text = split_part(name, '/', 1)
  );

drop policy if exists reader_retells_storage_update on storage.objects;
create policy reader_retells_storage_update on storage.objects
  for update
  using (
    bucket_id = 'reader-retells'
    and (select auth.uid())::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'reader-retells'
    and (select auth.uid())::text = split_part(name, '/', 1)
  );

drop policy if exists reader_retells_storage_delete on storage.objects;
create policy reader_retells_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'reader-retells'
    and (select auth.uid())::text = split_part(name, '/', 1)
  );
