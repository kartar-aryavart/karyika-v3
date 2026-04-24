-- ══════════════════════════════════════════════════════════
-- KARYIKA v3 — Fix column names to snake_case
-- Run this in Supabase SQL Editor AFTER migration 001
-- ══════════════════════════════════════════════════════════

-- Rename camelCase columns → snake_case (no more quoted names)
alter table public.tasks rename column "dueTime"       to due_time;
alter table public.tasks rename column "startDate"     to start_date;
alter table public.tasks rename column "estimatedTime" to estimated_time;
alter table public.tasks rename column "actualTime"    to actual_time;
alter table public.tasks rename column "assigneeId"    to assignee_id;
alter table public.tasks rename column "customFields"  to custom_fields;
alter table public.tasks rename column "sprintId"      to sprint_id;
alter table public.tasks rename column "coverColor"    to cover_color;
alter table public.tasks rename column "completedAt"   to completed_at;

-- Habits table
alter table public.habits rename column "targetDays"     to target_days;
alter table public.habits rename column "targetType"     to target_type;
alter table public.habits rename column "targetValue"    to target_value;
alter table public.habits rename column "targetUnit"     to target_unit;
alter table public.habits rename column "timeOfDay"      to time_of_day;
alter table public.habits rename column "currentStreak"  to current_streak;
alter table public.habits rename column "longestStreak"  to longest_streak;
alter table public.habits rename column "skipProtection" to skip_protection;

-- Goals table
alter table public.goals rename column "lifeArea"       to life_area;
alter table public.goals rename column "dueDate"        to due_date;
alter table public.goals rename column "linkedTaskIds"  to linked_task_ids;
alter table public.goals rename column "checkIns"       to check_ins;
