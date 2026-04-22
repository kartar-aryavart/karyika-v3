-- ══════════════════════════════════════════════════════════
-- KARYIKA v3 — Complete Database Schema
-- Run this ONCE in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────
create type task_status as enum ('todo','in-progress','review','blocked','hold','done','cancelled');
create type task_priority as enum ('urgent','high','medium','low','none');
create type project_status as enum ('active','done','archived');

-- ─── PROFILES ────────────────────────────────────────────
create table public.profiles (
  id                   uuid references auth.users on delete cascade primary key,
  email                text not null,
  name                 text,
  avatar_url           text,
  theme                text not null default 'dark' check (theme in ('dark','light','system')),
  timezone             text not null default 'Asia/Kolkata',
  lang                 text not null default 'en' check (lang in ('en','hi')),
  onboarding_completed boolean not null default false,
  life_score           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ─── PROJECTS ────────────────────────────────────────────
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
create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id);

-- ─── TASKS ───────────────────────────────────────────────
create table public.tasks (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  parent_id      uuid references public.tasks(id) on delete cascade,
  title          text not null check (char_length(title) > 0 and char_length(title) <= 500),
  desc           text,
  status         task_status not null default 'todo',
  priority       task_priority not null default 'none',
  due            date,
  "dueTime"      time,
  "startDate"    date,
  "estimatedTime" integer check ("estimatedTime" > 0),
  "actualTime"   integer check ("actualTime" >= 0),
  points         integer not null default 0,
  "assigneeId"   uuid references public.profiles(id) on delete set null,
  tags           text[] not null default '{}',
  subtasks       jsonb not null default '[]',
  "customFields" jsonb,
  dependencies   jsonb,
  recurring      jsonb,
  "sprintId"     text,
  urgency        text default 'not-urgent',
  importance     text default 'important',
  "coverColor"   text,
  done           boolean not null default false,
  "completedAt"  timestamptz,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create index idx_tasks_user_id    on public.tasks(user_id);
create index idx_tasks_status     on public.tasks(status);
create index idx_tasks_due        on public.tasks(due);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_done       on public.tasks(done);

-- ─── HABITS ──────────────────────────────────────────────
create table public.habits (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  emoji           text,
  color           text not null default '#10B981',
  frequency       text not null default 'daily' check (frequency in ('daily','weekly','custom')),
  "targetDays"    integer[] not null default '{0,1,2,3,4,5,6}',
  "targetType"    text not null default 'boolean' check ("targetType" in ('boolean','count','duration')),
  "targetValue"   integer not null default 1,
  "targetUnit"    text,
  "timeOfDay"     text not null default 'anytime' check ("timeOfDay" in ('morning','afternoon','evening','anytime')),
  "currentStreak" integer not null default 0,
  "longestStreak" integer not null default 0,
  logs            jsonb not null default '{}',
  "skipProtection" boolean not null default false,
  is_archived     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.habits enable row level security;
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);

-- ─── GOALS ───────────────────────────────────────────────
create table public.goals (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text,
  type            text not null default 'monthly',
  "lifeArea"      text not null default 'career',
  status          text not null default 'on-track',
  target          numeric not null default 100,
  current         numeric not null default 0,
  unit            text,
  color           text not null default '#F43F5E',
  emoji           text,
  "dueDate"       date,
  "linkedTaskIds" text[] not null default '{}',
  milestones      jsonb not null default '[]',
  "checkIns"      jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id);

-- ─── AI LOGS ─────────────────────────────────────────────
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
create policy "Users view own ai logs" on public.ai_logs for all using (auth.uid() = user_id);

-- ─── AUTO-UPDATED TIMESTAMPS ─────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated  before update on public.profiles  for each row execute procedure public.update_updated_at();
create trigger trg_projects_updated  before update on public.projects  for each row execute procedure public.update_updated_at();
create trigger trg_tasks_updated     before update on public.tasks     for each row execute procedure public.update_updated_at();
create trigger trg_habits_updated    before update on public.habits    for each row execute procedure public.update_updated_at();
create trigger trg_goals_updated     before update on public.goals     for each row execute procedure public.update_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
