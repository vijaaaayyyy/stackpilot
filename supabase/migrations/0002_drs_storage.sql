-- Turf DRS — delivery-footage storage.
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.
-- Run AFTER 0001_drs.sql. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Create the video bucket (public = clips play back without auth).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('drs-clips', 'drs-clips', true)
on conflict (id) do update set public = true;

-- ---------------------------------------------------------------------------
-- 2. Clip uploads live under {user-id}/… or anon/… — each caller only touches
--    their own folder.
-- ---------------------------------------------------------------------------
drop policy if exists "drs-clips select" on storage.objects;
create policy "drs-clips select"
  on storage.objects for select
  using (bucket_id = 'drs-clips' and (
    (storage.foldername(name))[1] = 'anon'
    or (storage.foldername(name))[1] = (auth.uid())::text
  ));

drop policy if exists "drs-clips insert" on storage.objects;
create policy "drs-clips insert"
  on storage.objects for insert
  with check (bucket_id = 'drs-clips' and (
    (storage.foldername(name))[1] = 'anon'
    or (storage.foldername(name))[1] = (auth.uid())::text
  ));

drop policy if exists "drs-clips update" on storage.objects;
create policy "drs-clips update"
  on storage.objects for update
  using (bucket_id = 'drs-clips' and (
    (storage.foldername(name))[1] = 'anon'
    or (storage.foldername(name))[1] = (auth.uid())::text
  ));

drop policy if exists "drs-clips delete" on storage.objects;
create policy "drs-clips delete"
  on storage.objects for delete
  using (bucket_id = 'drs-clips' and (
    (storage.foldername(name))[1] = 'anon'
    or (storage.foldername(name))[1] = (auth.uid())::text
  ));

-- ---------------------------------------------------------------------------
-- 3. Reviews can carry a link to their clip.
-- ---------------------------------------------------------------------------
alter table public.drs_reviews
  add column if not exists clip_path text;