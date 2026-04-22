# Karyika v3 — Tasks System Integration Guide
## Phase 1 Files — Drop-In Instructions (Windows CMD)

---

## 📦 What's Inside This ZIP

```
karyika-tasks-phase1/
├── src/
│   ├── hooks/
│   │   └── useTasks.ts              ← All task mutations + queries
│   ├── types/
│   │   └── tasks.ts                 ← TypeScript types, enums, configs
│   ├── app/
│   │   ├── api/
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts         ← GET + POST /api/tasks
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts     ← PATCH + DELETE /api/tasks/:id
│   │   │   └── ai/
│   │   │       └── parse-task/
│   │   │           └── route.ts     ← POST /api/ai/parse-task (Groq NLP)
│   │   └── (dashboard)/
│   │       └── tasks/
│   │           └── page.tsx         ← MAIN TASKS PAGE (drop this in)
│   ├── components/
│   │   └── tasks/
│   │       ├── TaskRow.tsx          ← Single task row (list view)
│   │       ├── TaskCard.tsx         ← Task card (kanban view)
│   │       ├── TaskDetail.tsx       ← Right-side detail drawer
│   │       ├── TaskFilters.tsx      ← Filter bar component
│   │       ├── TaskStates.tsx       ← Empty state + skeleton loader
│   │       ├── KanbanBoard.tsx      ← Full drag-drop board
│   │       └── QuickAdd.tsx         ← AI-powered quick add input
│   └── styles/
│       └── tasks.css                ← CSS tokens to add to globals.css
└── INTEGRATION.md                   ← This file
```

---

## 🔧 STEP 1 — Install missing packages

Open CMD in `C:\K\karyika-v3` and run:

```cmd
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

You should already have: `framer-motion`, `@tanstack/react-query`, `zod`

---

## 📁 STEP 2 — Copy files into your project

### Windows CMD commands:

```cmd
REM Create directories
mkdir src\hooks
mkdir src\types
mkdir src\app\api\tasks\[id]
mkdir src\app\api\ai\parse-task
mkdir src\components\tasks

REM Copy all files (run from inside the zip's extracted folder)
copy src\hooks\useTasks.ts          C:\K\karyika-v3\src\hooks\useTasks.ts
copy src\types\tasks.ts             C:\K\karyika-v3\src\types\tasks.ts
copy src\app\api\tasks\route.ts     C:\K\karyika-v3\src\app\api\tasks\route.ts
copy "src\app\api\tasks\[id]\route.ts"  "C:\K\karyika-v3\src\app\api\tasks\[id]\route.ts"
copy src\app\api\ai\parse-task\route.ts C:\K\karyika-v3\src\app\api\ai\parse-task\route.ts
copy "src\app\(dashboard)\tasks\page.tsx"  "C:\K\karyika-v3\src\app\(dashboard)\tasks\page.tsx"
copy src\components\tasks\TaskRow.tsx       C:\K\karyika-v3\src\components\tasks\TaskRow.tsx
copy src\components\tasks\TaskCard.tsx      C:\K\karyika-v3\src\components\tasks\TaskCard.tsx
copy src\components\tasks\TaskDetail.tsx    C:\K\karyika-v3\src\components\tasks\TaskDetail.tsx
copy src\components\tasks\TaskFilters.tsx   C:\K\karyika-v3\src\components\tasks\TaskFilters.tsx
copy src\components\tasks\TaskStates.tsx    C:\K\karyika-v3\src\components\tasks\TaskStates.tsx
copy src\components\tasks\KanbanBoard.tsx   C:\K\karyika-v3\src\components\tasks\KanbanBoard.tsx
copy src\components\tasks\QuickAdd.tsx      C:\K\karyika-v3\src\components\tasks\QuickAdd.tsx
```

---

## 🎨 STEP 3 — Add CSS to globals.css

Open `src\styles\globals.css` and paste the contents of `src\styles\tasks.css` at the **end** of your existing file.

---

## 📝 STEP 4 — Update your types/index.ts

In your existing `src/types/index.ts`, add this line at the top:

```typescript
export * from './tasks'
```

OR, if you want to keep types in one file, copy the content of `src/types/tasks.ts` into your existing `src/types/index.ts`.

---

## 🔌 STEP 5 — Verify your lib/utils.ts has cn()

Your `src/lib/utils.ts` must export a `cn()` function. If it doesn't, add:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwindcss/merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install if needed:
```cmd
npm install clsx tailwind-merge
```

---

## 🗄️ STEP 6 — Confirm Supabase schema

Make sure your `supabase/migrations/001_initial_schema.sql` has the `tasks` table. It should include these columns:
- id, user_id, project_id, parent_id
- title, description
- status (enum: todo/in_progress/in_review/done/cancelled)
- priority (enum: urgent/high/medium/low/none)
- due_date, due_time
- estimated_minutes, actual_minutes
- tags (text[])
- sort_order
- is_recurring, recurrence_rule
- completed_at, created_at, updated_at

If you already ran the migration from your context doc, this is done. ✅

---

## 🤖 STEP 7 — Confirm GROQ_API_KEY in .env.local

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your key from: https://console.groq.com/keys

---

## ✅ STEP 8 — Type check and run

```cmd
cd C:\K\karyika-v3
npm run type-check
npm run dev
```

Then visit: http://localhost:3000/tasks

---

## 🧪 What to test

1. **Create task** — Type in quick add and press Enter
2. **AI parse** — Type "Meeting kal 3pm urgent" — should show AI preview card
3. **Hinglish parse** — Type "aaj shaam ko report finish karni hai"
4. **Complete task** — Click checkbox — should animate green
5. **View toggle** — Switch between List and Board views
6. **Drag & drop** — In board view, drag a task to another column
7. **Edit task** — Click any task row to open right drawer
8. **Delete task** — Hover over a task row, click delete icon
9. **Filters** — Click status/priority filter pills
10. **Keyboard** — Press N to open quick add from anywhere

---

## ⚠️ Common Issues

### "Cannot find module '@/hooks/useTasks'"
→ Make sure `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }`

### "RLS error on tasks table"
→ Make sure you're logged in. RLS requires auth.users match. Run the SQL migration.

### "Groq API returning 401"
→ Check GROQ_API_KEY in .env.local is correct and starts with `gsk_`

### Type errors on Task interface
→ Make sure your `src/types/index.ts` exports from `./tasks`

---

## 🏗️ Architecture Summary

```
Page (tasks/page.tsx)
  ├── useTasks() ──→ GET /api/tasks ──→ Supabase SELECT
  ├── useCreateTask() → POST /api/tasks → Supabase INSERT (optimistic)
  ├── useUpdateTask() → PATCH /api/tasks/:id → Supabase UPDATE (optimistic)
  ├── useDeleteTask() → DELETE /api/tasks/:id → Supabase DELETE (optimistic)
  └── useCompleteTask() → PATCH /api/tasks/:id (status toggle, optimistic)

QuickAdd.tsx
  └── POST /api/ai/parse-task → Groq Llama 3.3 → ParsedTask JSON

KanbanBoard.tsx
  └── @dnd-kit/core → DragEndEvent → useUpdateTask() (status change)
```

---

## 📊 Files Created: 13
## 📦 New dependencies: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

*Phase 1 Tasks System — Karyika v3 | April 2026*
