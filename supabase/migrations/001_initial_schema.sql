-- ══════════════════════════════════════════════════════════
-- KARYIKA v3 — Complete Database Schema (snake_case only)
-- Run this ONCE in Supabase SQL Editor
-- If you ran the old schema, run the DROP section first
-- ══════════════════════════════════════════════════════════

-- ── CLEAN SLATE (safe to run even if tables don't exist) ──
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists trg_tasks_updated    on public.tasks;
drop trigger if exists trg_habits_updated   on public.habits;
drop trigger if exists trg_goals_updated    on public.goals;
drop trigger if exists trg_projects_updated on public.projects;
drop trigger if exists trg_profiles_updated on public.profiles;
drop function if exists public.handle_new_user();
drop function if exists public.update_updated_at();
drop table if exists public.ai_logs    cascade;
drop table if exists public.goals      cascade;
drop table if exists public.habits     cascade;
drop table if exists public.tasks      cascade;
drop table if exists public.projects   cascade;
drop table if exists public.profiles   cascade;
drop type  if exists task_status       cascade;
drop type  if exists task_priority     cascade;
drop type  if exists project_status    cascade;

-- ── EXTENSIONS ────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── ENUMS ─────────────────────────────────────────────────
create type task_status   as enum ('todo','in-progress','review','blocked','hold','done','cancelled');
create type task_priority as enum ('urgent','high','medium','low','none');
create type project_status as enum ('active','done','archived');

-- ── PROFILES ──────────────────────────────────────────────
create table public.profiles (
  id                   uuid references auth.users on delete cascade primary key,
  email                text not null,
  name                 text,
  avatar_url           text,
  theme                text not null default 'dark' check (theme in ('dark','light','system')),
  timezone             text not null default 'Asia/Kolkata',
  lang                 text not null default 'en'   check (lang in ('en','hi')),
  onboarding_completed boolean not null default false,
  life_score           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_self" on public.profiles for all using (auth.uid() = id);

-- ── PROJECTS ──────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  color       text not null default '#818CF8',
  emoji       text,
  status      project_status not null default 'active',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects_self" on public.projects for all using (auth.uid() = user_id);

-- ── TASKS (all snake_case — NO quoted camelCase columns) ───
create table public.tasks (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  parent_id      uuid references public.tasks(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 500),
  description    text,
  status         task_status   not null default 'todo',
  priority       task_priority not null default 'none',
  due            date,
  due_time       time,
  start_date     date,
  estimated_time integer check (estimated_time > 0),
  actual_time    integer check (actual_time >= 0),
  points         integer not null default 0,
  assignee_id    uuid references public.profiles(id) on delete set null,
  tags           text[]  not null default '{}',
  subtasks       jsonb   not null default '[]',
  custom_fields  jsonb,
  dependencies   jsonb,
  recurring      text,
  sprint_id      text,
  urgency        text default 'not-urgent',
  importance     text default 'important',
  cover_color    text,
  done           boolean not null default false,
  completed_at   timestamptz,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "tasks_self" on public.tasks for all using (auth.uid() = user_id);
create index idx_tasks_user    on public.tasks(user_id);
create index idx_tasks_status  on public.tasks(status);
create index idx_tasks_due     on public.tasks(due);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_done    on public.tasks(done);

-- ── HABITS ────────────────────────────────────────────────
create table public.habits (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  emoji          text,
  color          text not null default '#10B981',
  frequency      text not null default 'daily' check (frequency in ('daily','weekly','custom')),
  target_days    integer[] not null default '{0,1,2,3,4,5,6}',
  target_type    text not null default 'boolean' check (target_type in ('boolean','count','duration')),
  target_value   integer not null default 1,
  target_unit    text,
  time_of_day    text not null default 'anytime' check (time_of_day in ('morning','afternoon','evening','anytime')),
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  logs           jsonb not null default '{}',
  skip_protection boolean not null default false,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.habits enable row level security;
create policy "habits_self" on public.habits for all using (auth.uid() = user_id);

-- ── GOALS ─────────────────────────────────────────────────
create table public.goals (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  description    text,
  type           text not null default 'monthly',
  life_area      text not null default 'career',
  status         text not null default 'on-track',
  target         numeric not null default 100,
  current        numeric not null default 0,
  unit           text,
  color          text not null default '#F43F5E',
  emoji          text,
  due_date       date,
  linked_task_ids text[] not null default '{}',
  milestones     jsonb  not null default '[]',
  check_ins      jsonb  not null default '[]',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "goals_self" on public.goals for all using (auth.uid() = user_id);

-- ── AI LOGS ───────────────────────────────────────────────
create table public.ai_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,
  input      text not null,
  output     text,
  tokens     integer default 0,
  created_at timestamptz not null default now()
);
alter table public.ai_logs enable row level security;
create policy "ai_logs_self" on public.ai_logs for all using (auth.uid() = user_id);

-- ── AUTO updated_at ───────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles for each row execute procedure public.update_updated_at();
create trigger trg_projects_updated before update on public.projects for each row execute procedure public.update_updated_at();
create trigger trg_tasks_updated    before update on public.tasks    for each row execute procedure public.update_updated_at();
create trigger trg_habits_updated   before update on public.habits   for each row execute procedure public.update_updated_at();
create trigger trg_goals_updated    before update on public.goals    for each row execute procedure public.update_updated_at();

-- ── AUTO create profile on signup ────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, avatar_url) values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
