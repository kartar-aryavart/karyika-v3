'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type { Task, TaskUpdateInput } from '@/types'
import type { TaskCreateInput, TaskFilters } from '@/types/tasks'

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.project_id) params.set('project_id', filters.project_id)
  if (filters.due_date) params.set('due_date', filters.due_date)

  const res = await fetch(`/api/tasks?${params.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

async function createTaskApi(input: TaskCreateInput): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

async function updateTaskApi({ id, ...input }: TaskUpdateInput & { id: string }): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

async function deleteTaskApi(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete task')
}

// ─── useTasks ────────────────────────────────────────────────────────────────

export function useTasks(
  filters: TaskFilters = {},
  options?: Omit<UseQueryOptions<Task[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
    staleTime: 30_000,
    ...options,
  })
}

// ─── useCreateTask ────────────────────────────────────────────────────────────

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTaskApi,

    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.lists() })

      // Optimistic: create temp task
      const tempTask: Task = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        user_id: '',
        project_id: newTask.project_id ?? null,
        parent_id: newTask.parent_id ?? null,
        title: newTask.title,
        desc: newTask.description ?? null,
        status: newTask.status ?? 'todo',
        priority: newTask.priority ?? 'none',
        due: newTask.due_date ?? null,
        dueTime: newTask.due_time ?? null,
        estimatedTime: newTask.estimated_minutes ?? null,
        actualTime: null,
        points: 0,
        tags: newTask.tags ?? [],
        subtasks: [],
        customFields: {},
        recurring: undefined,
        sprintId: null,
        urgency: undefined,
        importance: undefined,
        coverColor: undefined,
        done: false,
        completedAt: null,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) =>
        old ? [tempTask, ...old] : [tempTask]
      )

      return { previousTasks }
    },

    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// ─── useUpdateTask ────────────────────────────────────────────────────────────

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTaskApi,

    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.lists() })

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) =>
        old?.map((task) => (task.id === updated.id ? { ...task, ...updated } as Task : task))
      )

      return { previousTasks }
    },

    onError: (_err, _updated, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// ─── useDeleteTask ────────────────────────────────────────────────────────────

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTaskApi,

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.lists() })

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) =>
        old?.filter((task) => task.id !== id)
      )

      return { previousTasks }
    },

    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// ─── useCompleteTask ──────────────────────────────────────────────────────────

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      updateTaskApi({
        id,
        status: done ? 'done' : 'todo',
        completed_at: done ? new Date().toISOString() : null,
      } as TaskUpdateInput & { id: string }),

    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.lists() })

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) =>
        old?.map((task) =>
          task.id === id
            ? {
                ...task,
                status: done ? 'done' : 'todo',
                completed_at: done ? new Date().toISOString() : null,
              }
            : task
        )
      )

      return { previousTasks }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}
