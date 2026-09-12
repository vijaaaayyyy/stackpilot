-- Turf DRS — clip metadata journal.
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.
-- Run AFTER 0001_drs.sql and 0002_drs_storage.sql. Safe to re-run.

-- ---------------------------------------------------------------------------
-- drs_clips: one row per delivery's clip (upserted by ball_id), so the clip
-- index survives across devices even though the video itself lives in the
-- drs-clips Storage bucket. Anonymous/hosted uploads are keyed by `owner`
-- ('anon' or the signed-in user id), mirroring the storage path prefix.
-- ---------------------------------------------------------------------------
create table if not exists public.drs_clips (
  id uuid primary key default gen_random_uuid(),
  ball_id text not null unique,
  owner text not null default 'anon',
  path text not null,
  name text not null,
  size bigint not null default 0,
  mime text not null default 'video/webm',
  duration_ms integer not null default 0,
  url text not null default '',
  captured_at timestamptz not null default now()
);

create index if not exists drs_clips_owner_idx on public.drs_clips (owner);
create index if not exists drs_clips_captured_idx on public.drs_clips (captured_at desc);

-- ---------------------------------------------------------------------------
-- Row level security: callers may only touch clips in their own folder.
-- `auth.uid()` (signed-in) and 'anon' (hosted) both supported.
-- ---------------------------------------------------------------------------
alter table public.drs_clips enable row level security;

drop policy if exists "DRS clips readable" on public.drs_clips;
create policy "DRS clips readable" on public.drs_clips
  for select
  using (
    owner = 'anon'
    or owner = (auth.uid())::text
  );

drop policy if exists "DRS clips insertable" on public.drs_clips;
create policy "DRS clips insertable" on public.drs_clips
  for insert
  with check (
    owner = 'anon'
    or owner = (auth.uid())::text
  );

drop policy if exists "DRS clips updatable" on public.drs_clips;
create policy "DRS clips updatable" on public.drs_clips
  for update
  using (
    owner = 'anon'
    or owner = (auth.uid())::text
  )
  with check (
    owner = 'anon'
    or owner = (auth.uid())::text
  );

drop policy if exists "DRS clips deletable" on public.drs_clips;
create policy "DRS clips deletable" on public.drs_clips
  for delete
  using (
    owner = 'anon'
    or owner = (auth.uid())::text
  );