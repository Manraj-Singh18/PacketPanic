-- ============================================================
-- PACKET PANIC — Database Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'setup' check (status in ('setup','registration','active','ended','cancelled')),
  duration_seconds integer not null default 600 check (duration_seconds between 60 and 3600),
  event_pin text,
  practice_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TEAMS
-- ============================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_code text not null,
  team_name text not null,
  members text[] not null default '{}',
  access_token text not null,
  is_official boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, team_code),
  unique (event_id, team_name)
);

create index idx_teams_event on public.teams(event_id);
create index idx_teams_access_token on public.teams(access_token);

-- ============================================================
-- GAME SESSIONS
-- ============================================================
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','active','completed','expired','abandoned')),
  current_mission integer not null default 0 check (current_mission between 0 and 4),
  start_time timestamptz,
  end_time timestamptz,
  duration_seconds integer not null default 600,
  final_score integer not null default 0,
  completion_time_seconds numeric,
  hints_used integer not null default 0,
  missions_completed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sessions_team on public.game_sessions(team_id);
create index idx_sessions_event on public.game_sessions(event_id);
create index idx_sessions_status on public.game_sessions(status);
create index idx_sessions_score on public.game_sessions(final_score desc, completion_time_seconds asc);

-- ============================================================
-- MISSION RESULTS
-- ============================================================
create table public.mission_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  mission_id integer not null check (mission_id between 1 and 4),
  status text not null default 'in_progress' check (status in ('in_progress','completed','failed')),
  score integer not null default 0,
  attempts integer not null default 0,
  hints_used integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, mission_id)
);

create index idx_results_session on public.mission_results(session_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.game_sessions enable row level security;
alter table public.mission_results enable row level security;

-- Events: anyone can read active events (anon role is allowed for leaderboard)
create policy "Public can read events" on public.events for select using (true);

-- Teams: a team can read its own row using access_token (passed via header is not possible with anon, so we expose only via custom claim)
create policy "Teams read own row" on public.teams for select using (
  access_token = current_setting('request.header.x-team-token', true)
);

-- Game sessions: readable publicly for leaderboard
create policy "Public read sessions" on public.game_sessions for select using (true);

-- Mission results: readable publicly (only contains session_id and score)
create policy "Public read results" on public.mission_results for select using (true);

-- Note: All writes go through the service role key (server-side API routes)
-- The service role bypasses RLS, so we don't need insert policies for anon.

-- ============================================================
-- TRIGGER: updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$ begin
  new.updated_at = now();
  return new;
end;
 $$ language plpgsql;

create trigger trg_events_updated before update on public.events
  for each row execute function public.set_updated_at();

create trigger trg_sessions_updated before update on public.game_sessions
  for each row execute function public.set_updated_at();

-- ============================================================
-- VIEW: Leaderboard (convenience)
-- ============================================================
create or replace view public.leaderboard_view as
select
  gs.id as session_id,
  gs.event_id,
  t.team_name,
  gs.final_score,
  gs.completion_time_seconds,
  gs.missions_completed,
  gs.status,
  gs.end_time,
  row_number() over (
    partition by gs.event_id
    order by gs.final_score desc nulls last,
    gs.completion_time_seconds asc nulls last
  ) as rank
from public.game_sessions gs
join public.teams t on t.id = gs.team_id
where gs.status in ('completed','expired')
  and t.is_official = true;

-- ============================================================
-- INITIAL EVENT
-- ============================================================
insert into public.events (id, name, status, duration_seconds, practice_mode)
values (
  '00000000-0000-0000-0000-000000000001',
  'Packet Panic Inaugural Event',
  'registration',
  600,
  false
);