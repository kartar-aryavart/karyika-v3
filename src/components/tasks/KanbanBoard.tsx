'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { cn, STATUS_CONFIG } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'
import { TaskCard } from './TaskCard'
import { QuickAdd } from './QuickAdd'
import { useUpdateTask } from '@/hooks/useTasks'

// ─── Column ───────────────────────────────────────────────────────────────────

const COLUMN_ORDER: TaskStatus[] = ['todo', 'in-progress', 'review', 'done']
const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo:        'bg-stone-400',
  'in-progress': 'bg-indigo-500',
  review:      'bg-amber-500',
  done:        'bg-emerald-500',
  blocked:     'bg-red-500',
  hold:        'bg-gray-500',
  cancelled:   'bg-stone-300',
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onEdit?: (task: Task) => void
}

function KanbanColumn({ status, tasks, onEdit }: KanbanColumnProps) {
  const [showAdd, setShowAdd] = useState(false)
  const config = STATUS_CONFIG[status]
  const colorDot = COLUMN_COLORS[status]
  const isDone = status === 'done'

  return (
    <div className={cn('flex flex-col gap-3 min-w-[280px] w-[280px]', isDone && 'opacity-80')}>
      {/* Column header */}
      <div className="flex items-center gap-2 px-1">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', colorDot)} />
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {config.label}
        </span>
        <span className="ml-auto text-[12px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          className={cn(
            'flex flex-col gap-2 min-h-[120px] p-2 rounded-xl',
            'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]',
            'transition-colors duration-150'
          )}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} />
          ))}

          {tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-[12px] text-[var(--text-tertiary)]">Drop tasks here</p>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Add task */}
      {showAdd ? (
        <QuickAdd
          onSuccess={() => setShowAdd(false)}
          autoFocus
          placeholder="Task name..."
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg w-full',
            'text-[13px] text-[var(--text-tertiary)]',
            'hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
            'transition-colors duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]'
          )}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add task
        </button>
      )}
    </div>
  )
}

// ─── Main Board ───────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
}

export function KanbanBoard({ tasks, onEdit }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const updateTask = useUpdateTask()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [], 'in-progress': [], review: [], blocked: [], hold: [], done: [], cancelled: [],
    }
    for (const task of tasks) {
      map[task.status].push(task)
    }
    return map
  }, [tasks])

  const handleDragStart = (event: { active: { id: string | number } }) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) return

    // Find which column the item was dropped into
    const overTask = tasks.find((t) => t.id === over.id)
    if (!overTask) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    if (activeTask.status !== overTask.status) {
      updateTask.mutate({
        id: activeTask.id,
        status: overTask.status as TaskStatus,
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_ORDER.map((status, i) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
          >
            <KanbanColumn
              status={status}
              tasks={tasksByStatus[status]}
              onEdit={onEdit}
            />
          </motion.div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-[2deg] shadow-xl">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
