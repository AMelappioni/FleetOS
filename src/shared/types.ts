import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type Mood = 'idle' | 'success' | 'warning' | 'think'

export interface NavItem { path: string; label: string; icon: LucideIcon }

export interface EyeSpec { cx: number; cy: number; rx: number; ry: number }
export interface CompanionConfig {
  id: 'lumi' | 'nexo' | 'bolt'
  defaultName: string
  role: string
  image: string
  /** Occhi da animare (coordinate in uno spazio 1024x1024 sull'immagine). Assente = solo parallasse. */
  eyes?: { spec: EyeSpec[]; patch: string; glow: string; travel: number }
  /** Posizione dell'immagine nel riquadro hero */
  objectPosition: string
}

export interface ProductConfig {
  id: 'beauty' | 'collect' | 'fleet'
  name: string
  tagline: string
  basePath: string
  themeClass: string
  nav: NavItem[]
  companion: CompanionConfig
  version: string
  logo: ReactNode
}

export interface NotificationItem { id: string; tone: 'ok' | 'warn' | 'bad' | 'info'; title: string; body: string; to?: string }
