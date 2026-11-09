import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Mood } from './types'

interface PrefsState {
  companionNames: Record<string, string>
  beautyDark: boolean
  readNotifs: string[]
  setCompanionName: (id: string, name: string) => void
  setBeautyDark: (v: boolean) => void
  markRead: (ids: string[]) => void
  resetPrefs: () => void
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      companionNames: {},
      beautyDark: false,
      readNotifs: [],
      setCompanionName: (id, name) => set((s) => ({ companionNames: { ...s.companionNames, [id]: name.trim() || '' } })),
      setBeautyDark: (v) => set({ beautyDark: v }),
      markRead: (ids) => set((s) => ({ readNotifs: Array.from(new Set([...s.readNotifs, ...ids])) })),
      resetPrefs: () => set({ companionNames: {}, beautyDark: false, readNotifs: [] }),
    }),
    { name: 'amsuite.prefs.v1' },
  ),
)

interface MoodState { mood: Mood; nonce: number; react: (m: Mood) => void }
let timer: ReturnType<typeof setTimeout> | undefined
export const useMood = create<MoodState>((set) => ({
  mood: 'idle',
  nonce: 0,
  react: (mood) => {
    set((s) => ({ mood, nonce: s.nonce + 1 }))
    clearTimeout(timer)
    timer = setTimeout(() => set({ mood: 'idle' }), 2400)
  },
}))
