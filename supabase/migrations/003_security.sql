-- ══════════════════════════════════════════════════════════
-- KARYIKA v3 — Security Schema: RBAC + Audit Logging + RLS
-- Run AFTER 001_initial_schema.sql
-- ══════════════════════════════════════════════════════════

-- ── PHASE 3: Add role to profiles ────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin', 'super_admin'));

-- Index for fast role checks
create index if not exists idx_profiles_role on public.profiles(role);

-- ── PHASE 4: Tighten RLS policies ────────────────────────
-- Drop old permissive policies
drop policy if exists "profiles_self" on public.profiles;
drop policy if exists "tasks_self"    on public.tasks;
drop policy if exists "projects_self" on public.projects;
drop policy if exists "habits_self"   on public.habits;
drop policy if exists "goals_self"    on public.goals;
drop policy if exists "ai_logs_self"  on public.ai_logs;

-- PROFILES: users see own, super_admin sees all
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  ));
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id);

-- TASKS: strict user isolation
create policy "tasks_select" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update" on public.tasks for update using (auth.uid() = user_id);
create policy "tasks_delete" on public.tasks for delete using (auth.uid() = user_id);

-- PROJECTS: strict user isolation
create policy "projects_select" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update" on public.projects for update using (auth.uid() = user_id);
create policy "projects_delete" on public.projects for delete using (auth.uid() = user_id);

-- HABITS: strict user isolation
create policy "habits_select" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update" on public.habits for update using (auth.uid() = user_id);
create policy "habits_delete" on public.habits for delete using (auth.uid() = user_id);

-- GOALS: strict user isolation
create policy "goals_select" on public.goals for select using (auth.uid() = user_id);
create policy "goals_insert" on public.goals for insert with check (auth.uid() = user_id);
create policy "goals_update" on public.goals for update using (auth.uid() = user_id);
create policy "goals_delete" on public.goals for delete using (auth.uid() = user_id);

-- ── PHASE 7: Audit log table ──────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,   -- 'INSERT', 'UPDATE', 'DELETE'
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

-- Only super_admin can read audit logs
alter table public.audit_logs enable row level security;
create policy "audit_super_admin_only" on public.audit_logs for select
  using (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'
  ));

-- Index for fast queries
create index if not exists idx_audit_user      on public.audit_logs(user_id);
create index if not exists idx_audit_table     on public.audit_logs(table_name);
create index if not exists idx_audit_created   on public.audit_logs(created_at desc);
create index if not exists idx_audit_record_id on public.audit_logs(record_id);

-- ── Audit trigger function ────────────────────────────────
create or replace function public.audit_trigger_fn()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    case TG_OP when 'DELETE' then OLD.id else NEW.id end,
    case TG_OP when 'INSERT' then null else to_jsonb(OLD) end,
    case TG_OP when 'DELETE' then null else to_jsonb(NEW) end
  );
  return case TG_OP when 'DELETE' then OLD else NEW end;
end; $$;

-- Attach audit triggers to key tables
drop trigger if exists audit_tasks    on public.tasks;
drop trigger if exists audit_projects on public.projects;

create trigger audit_tasks
  after insert or update or delete on public.tasks
  for each row execute procedure public.audit_trigger_fn();

create trigger audit_projects
  after insert or update or delete on public.projects
  for each row execute procedure public.audit_trigger_fn();

-- ── Set first user as super_admin (run manually after first signup) ──
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'your@email.com';
