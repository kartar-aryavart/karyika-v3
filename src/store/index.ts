'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Toast, TaskView } from '@/types'
import type { Lang } from '@/lib/i18n'

interface AppStore {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  toggleSidebar: () => void
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  lang: Lang
  setLang: (l: Lang) => void
  cmdOpen: boolean
  setCmdOpen: (v: boolean) => void
  taskView: TaskView
  setTaskView: (v: TaskView) => void
  toasts: Toast[]
  addToast: (msg: string, type?: Toast['type']) => void
  removeToast: (id: number) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      theme: 'dark',
      setTheme: (th) => {
        set({ theme: th })
        if (typeof document !== 'undefined')
          document.documentElement.setAttribute('data-theme', th)
      },

      lang: 'hinglish',
      setLang: (l) => set({ lang: l }),

      cmdOpen: false,
      setCmdOpen: (v) => set({ cmdOpen: v }),

      taskView: 'list',
      setTaskView: (v) => set({ taskView: v }),

      toasts: [],
      addToast: (msg, type = 'info') => {
        const id = Date.now()
        set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }))
        setTimeout(() => get().removeToast(id), 3500)
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((to) => to.id !== id) })),
    }),
    {
      name: 'karyika-store',
      partialize: (s) => ({ theme: s.theme, taskView: s.taskView, lang: s.lang }),
    }
  )
)
