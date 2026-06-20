-- Translume — Supabase schema (anonymous cloud mode)
--
-- Run this once in the Supabase SQL editor. It creates the tables, a public
-- storage bucket for the video files, an atomic view counter, and permissive
-- RLS policies suited to the "anonymous, link-based sharing" model (no login).
--
-- NOTE ON SECURITY: anonymous mode intentionally lets anyone with the anon key
-- read/insert/delete. That's fine for a personal tool or a trusted team. When
-- you add accounts, tighten these policies to scope rows to auth.uid().

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.recordings (
  id           text primary key,
  title        text not null default 'Untitled',
  created_at   timestamptz not null default now(),
  duration     double precision not null default 0,
  width        int not null default 0,
  height       int not null default 0,
  size         bigint not null default 0,
  mode         text not null check (mode in ('screen', 'camera', 'both')),
  thumbnail    text,                       -- data URL poster frame
  storage_path text not null,              -- path in the 'recordings' bucket
  views        int not null default 0,
  folder       text,
  mime_type    text not null default 'video/webm',
  transcript   jsonb,                      -- [{ time, text }]
  ai           jsonb,                      -- { title, summary, chapters, generatedAt }
  trim_start   double precision,           -- non-destructive trim in-point (seconds)
  trim_end     double precision,           -- non-destructive trim out-point (seconds)
  owner        uuid references auth.users (id) on delete cascade,  -- null in anonymous mode
  saved        boolean not null default false,                     -- "Watch later" bookmark
  visibility   text not null default 'unlisted' check (visibility in ('private','unlisted','public'))
);

-- Idempotent migrations for existing installs (safe to re-run):
alter table public.recordings add column if not exists trim_start double precision;
alter table public.recordings add column if not exists trim_end   double precision;
alter table public.recordings add column if not exists owner      uuid;
alter table public.recordings add column if not exists saved      boolean not null default false;

create table if not exists public.comments (
  id           text primary key,
  recording_id text not null references public.recordings (id) on delete cascade,
  author       text not null default 'Anonymous',
  body         text not null default '',
  time_sec     double precision not null default 0,
  emoji        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.folders (
  id          text primary key,
  name        text not null,
  owner       uuid references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.folders add column if not exists owner uuid;

create index if not exists comments_recording_idx on public.comments (recording_id);
create index if not exists recordings_created_idx on public.recordings (created_at desc);

-- ----------------------------------------------------------------------------
-- Atomic view counter (called via supabase.rpc('increment_views', ...))
-- ----------------------------------------------------------------------------

create or replace function public.increment_views(rec_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.recordings set views = views + 1 where id = rec_id;
$$;

grant execute on function public.increment_views(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Row Level Security — per-user ownership (accounts mode)
--   Recordings: owners manage their own; shared links stay public (non-private).
--   Folders: private to the owner.
--   Comments: open — viewers of a shared link (often anonymous) can read & post.
-- ----------------------------------------------------------------------------

alter table public.recordings enable row level security;
alter table public.comments   enable row level security;
alter table public.folders    enable row level security;

drop policy if exists "anon all recordings" on public.recordings;
drop policy if exists "read recordings"     on public.recordings;
drop policy if exists "insert own recordings" on public.recordings;
drop policy if exists "update own recordings" on public.recordings;
drop policy if exists "delete own recordings" on public.recordings;
create policy "read recordings" on public.recordings
  for select using (owner = auth.uid() or visibility <> 'private');
create policy "insert own recordings" on public.recordings
  for insert with check (owner = auth.uid());
create policy "update own recordings" on public.recordings
  for update using (owner = auth.uid()) with check (owner = auth.uid());
create policy "delete own recordings" on public.recordings
  for delete using (owner = auth.uid());

drop policy if exists "anon all comments" on public.comments;
create policy "anon all comments" on public.comments
  for all using (true) with check (true);

drop policy if exists "anon all folders"   on public.folders;
drop policy if exists "read own folders"   on public.folders;
drop policy if exists "insert own folders" on public.folders;
drop policy if exists "update own folders" on public.folders;
drop policy if exists "delete own folders" on public.folders;
create policy "read own folders" on public.folders
  for select using (owner = auth.uid());
create policy "insert own folders" on public.folders
  for insert with check (owner = auth.uid());
create policy "update own folders" on public.folders
  for update using (owner = auth.uid()) with check (owner = auth.uid());
create policy "delete own folders" on public.folders
  for delete using (owner = auth.uid());

-- ----------------------------------------------------------------------------
-- Storage bucket for the video blobs (public read via getPublicUrl)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', true)
on conflict (id) do update set public = true;

drop policy if exists "recordings read" on storage.objects;
create policy "recordings read" on storage.objects
  for select using (bucket_id = 'recordings');

drop policy if exists "recordings insert" on storage.objects;
create policy "recordings insert" on storage.objects
  for insert with check (bucket_id = 'recordings');

drop policy if exists "recordings update" on storage.objects;
create policy "recordings update" on storage.objects
  for update using (bucket_id = 'recordings');

drop policy if exists "recordings delete" on storage.objects;
create policy "recordings delete" on storage.objects
  for delete using (bucket_id = 'recordings');
