-- Turf DRS — review-capture flow (clip-per-delivery rows + private bucket).
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.
-- Run AFTER 0001-0003. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Dedupe drs_reviews so each (match_id, ball_id) has exactly one row, then
--    enforce it: the capture flow upserts a draft row (clip_path only) and the
--    umpire's call updates that same row.
-- ---------------------------------------------------------------------------
delete from public.drs_reviews
where id not in (
  select distinct on (match_id, ball_id) id
  from public.drs_reviews
  order by match_id, ball_id, created_at desc, id
);

create unique index if not exists drs_reviews_match_ball_uidx
  on public.drs_reviews (match_id, ball_id);

-- ---------------------------------------------------------------------------
-- 2. Draft rows: a review is created with clip_path on "Review" tap, with the
--    umpire's type/on-field/decision/status filled in afterwards. Drop the
--    NOT NULL so the draft can exist with nulls.
-- ---------------------------------------------------------------------------
alter table public.drs_reviews alter column type drop not null;
alter table public.drs_reviews alter column on_field drop not null;
alter table public.drs_reviews alter column decision drop not null;
alter table public.drs_reviews alter column status drop not null;

-- ---------------------------------------------------------------------------
-- 3. Updates/upserts (including anon/hosted draft rows where user_id is null)
--    must be able to reach the row for the umpire's call.
-- ---------------------------------------------------------------------------
drop policy if exists "DRS reviews updatable" on public.drs_reviews;
create policy "DRS reviews updatable" on public.drs_reviews
  for update using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 4. The drs-clips bucket is PRIVATE — clips play back via signed URLs only.
-- ---------------------------------------------------------------------------
update storage.buckets set public = false where id = 'drs-clips';

-- ---------------------------------------------------------------------------
-- 5. Clip objects now live under {match_id}/{ball_id}.webm (no owner prefix),
--    so storage RLS is bucket-wide instead of folder-scoped.
-- ---------------------------------------------------------------------------
drop policy if exists "drs-clips select" on storage.objects;
create policy "drs-clips select"
  on storage.objects for select
  using (bucket_id = 'drs-clips');

drop policy if exists "drs-clips insert" on storage.objects;
create policy "drs-clips insert"
  on storage.objects for insert
  with check (bucket_id = 'drs-clips');

drop policy if exists "drs-clips update" on storage.objects;
create policy "drs-clips update"
  on storage.objects for update
  using (bucket_id = 'drs-clips');

drop policy if exists "drs-clips delete" on storage.objects;
create policy "drs-clips delete"
  on storage.objects for delete
  using (bucket_id = 'drs-clips');