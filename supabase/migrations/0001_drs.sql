-- Turf DRS — single clean schema for the new site.
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- Legacy cleanup — the old StackPilot/Stack2Set tables are gone with the old
-- site. Dropped here so this migration fully replaces the previous schema.
-- Safe to re-run (`if exists`); the DRS tables below never match these names.
-- ---------------------------------------------------------------------------
drop table if exists public.provider_alternatives cascade;
drop table if exists public.provider_tags cascade;
drop table if exists public.provider_features cascade;
drop table if exists public.provider_profiles cascade;
drop table if exists public.providers cascade;
drop table if exists public.categories cascade;
drop table if exists public.saved_prompts cascade;
drop table if exists public.saved_stacks cascade;
drop table if exists public.stack_items cascade;
drop table if exists public.stacks cascade;
drop table if exists public.workspace_items cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.favorites cascade;
drop table if exists public.recently_viewed cascade;
drop table if exists public.analysis_cache cascade;
drop table if exists public.shares cascade;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- drs_teams
-- ---------------------------------------------------------------------------
create table if not exists public.drs_teams (
  id text primary key,
  name text not null,
  short text not null,
  color text not null default '#14b8a6'
);

-- ---------------------------------------------------------------------------
-- drs_players
-- ---------------------------------------------------------------------------
create table if not exists public.drs_players (
  id text primary key,
  team_id text not null references public.drs_teams (id) on delete cascade,
  name text not null,
  role text not null
    check (role in ('batter', 'bowler', 'keeper', 'all-rounder'))
);

create index if not exists drs_players_team_idx on public.drs_players (team_id);

-- ---------------------------------------------------------------------------
-- drs_matches
-- ---------------------------------------------------------------------------
create table if not exists public.drs_matches (
  id text primary key,
  tournament text not null default '',
  venue_name text not null,
  venue_city text not null default '',
  venue_surface text not null default 'turf'
    check (venue_surface in ('turf', 'grass', 'astro')),
  format text not null default 'T20'
    check (format in ('T20', 'T10', 'ODI', 'Test', 'Custom')),
  overs_per_innings integer not null default 20,
  team_a_id text not null references public.drs_teams (id),
  team_b_id text not null references public.drs_teams (id),
  batting_first_id text not null references public.drs_teams (id),
  status text not null default 'setup'
    check (status in ('setup', 'live', 'finished')),
  created_at timestamptz not null default now(),
  check (team_a_id <> team_b_id)
);

-- ---------------------------------------------------------------------------
-- drs_deliveries
-- ---------------------------------------------------------------------------
create table if not exists public.drs_deliveries (
  id text primary key,
  match_id text not null references public.drs_matches (id) on delete cascade,
  over integer not null,
  ball integer not null,
  result text not null default '',
  runs integer not null default 0,
  kind text not null default 'dot'
    check (kind in ('dot', 'runs', 'wicket', 'review', 'boundary', 'edge')),
  review_type text
    check (review_type in ('lbw', 'caught', 'runout', 'stumping', 'boundary')),
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists drs_deliveries_match_idx
  on public.drs_deliveries (match_id, over, ball);

-- ---------------------------------------------------------------------------
-- drs_cameras
-- ---------------------------------------------------------------------------
create table if not exists public.drs_cameras (
  id text primary key,
  name text not null,
  position text not null
    check (position in ('umpire-end', 'square-leg', 'behind-wicket')),
  resolution text not null default '4K',
  fps integer not null default 120,
  signal text not null default 'good'
    check (signal in ('good', 'fair', 'strong')),
  recording boolean not null default true,
  primary_cam boolean not null default false
);

-- ---------------------------------------------------------------------------
-- drs_reviews
-- ---------------------------------------------------------------------------
create table if not exists public.drs_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_email text,
  user_name text,
  match_id text not null,
  match_label text not null default '',
  ball_id text not null,
  type text not null
    check (type in ('lbw', 'caught', 'runout', 'stumping', 'boundary')),
  on_field text not null
    check (on_field in ('OUT', 'NOT OUT', 'INCONCLUSIVE', 'SIX')),
  decision text not null
    check (decision in ('OUT', 'NOT OUT', 'INCONCLUSIVE')),
  status text not null
    check (status in ('UPHELD', 'OVERTURNED', 'INCONCLUSIVE')),
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists drs_reviews_match_idx
  on public.drs_reviews (match_id, created_at desc);
create index if not exists drs_reviews_user_idx
  on public.drs_reviews (user_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.drs_teams enable row level security;
alter table public.drs_players enable row level security;
alter table public.drs_matches enable row level security;
alter table public.drs_deliveries enable row level security;
alter table public.drs_cameras enable row level security;
alter table public.drs_reviews enable row level security;

create policy "DRS teams readable"      on public.drs_teams      for select using (true);
create policy "DRS players readable"    on public.drs_players    for select using (true);
create policy "DRS matches readable"    on public.drs_matches    for select using (true);
create policy "DRS deliveries readable" on public.drs_deliveries for select using (true);
create policy "DRS cameras readable"    on public.drs_cameras    for select using (true);

create policy "DRS reviews readable"    on public.drs_reviews for select using (true);
create policy "DRS reviews insertable"  on public.drs_reviews for insert with check (true);
create policy "DRS reviews updatable"   on public.drs_reviews for update using (user_id = auth.uid());
create policy "DRS reviews deletable"   on public.drs_reviews for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed: the demo match the workstation runs on.
-- ---------------------------------------------------------------------------
insert into public.drs_teams (id, name, short, color) values
  ('falcons', 'Falcons', 'FAL', '#0ea5a0'),
  ('strikers', 'Strikers', 'STR', '#f59e0b')
on conflict (id) do nothing;

insert into public.drs_players (id, team_id, name, role) values
  ('p1', 'falcons', 'Rohit Sharma', 'batter'),
  ('p2', 'falcons', 'Virat Kohli', 'batter'),
  ('p3', 'falcons', 'Rashid Khan', 'all-rounder'),
  ('p4', 'falcons', 'Pat Cummins', 'bowler'),
  ('p5', 'strikers', 'Andre Russell', 'all-rounder'),
  ('p6', 'strikers', 'Jasprit Bumrah', 'bowler'),
  ('p7', 'strikers', 'Kane Williamson', 'batter'),
  ('p8', 'strikers', 'Mitchell Starc', 'bowler')
on conflict (id) do nothing;

insert into public.drs_matches (id, tournament, venue_name, venue_city, venue_surface, format, overs_per_innings, team_a_id, team_b_id, batting_first_id, status) values
  ('demo-live', 'Hyderabad Turf League', 'Hyderabad Turf Arena', 'Hyderabad', 'turf', 'T20', 20, 'falcons', 'strikers', 'falcons', 'live')
on conflict (id) do nothing;

insert into public.drs_deliveries (id, match_id, over, ball, result, runs, kind, review_type, description) values
  ('16.1', 'demo-live', 16, 1, 'DOT', 0, 'dot', null, 'Good length, beat the outside edge.'),
  ('16.2', 'demo-live', 16, 2, '1 RUN', 1, 'runs', null, 'Driven through the off side, one taken.'),
  ('16.3', 'demo-live', 16, 3, '2 RUNS', 2, 'runs', null, 'Flicked wide of mid-wicket, quick two.'),
  ('16.4', 'demo-live', 16, 4, 'REVIEW', 0, 'review', 'lbw', 'Struck on the pad — LBW appeal signalled.')
on conflict (id) do nothing;

insert into public.drs_cameras (id, name, position, resolution, fps, signal, recording, primary_cam) values
  ('cam-01', 'CAM 01', 'umpire-end', '1080p', 60, 'good', true, true),
  ('cam-02', 'CAM 02', 'square-leg', '1080p', 60, 'fair', true, false),
  ('cam-03', 'CAM 03', 'behind-wicket', '720p', 120, 'good', true, false)
on conflict (id) do nothing;