import { create } from 'zustand'

export interface ToastItem { id: number; text: string; tone: 'ok' | 'warn' | 'bad' | 'info' }
interface ToastState { items: ToastItem[]; push: (text: string, tone?: ToastItem['tone']) => void; dismiss: (id: number) => void }
let n = 0
export const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (text, tone = 'ok') => {
    const id = ++n
    set((s) => ({ items: [...s.items, { id, text, tone }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 4200)
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))
export const toast = (text: string, tone: ToastItem['tone'] = 'ok') => useToasts.getState().push(text, tone)
