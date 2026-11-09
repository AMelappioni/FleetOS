import { CalendarRange, ChartPie, Cog, FileText, LayoutDashboard, LifeBuoy, Receipt, Truck, Users, Wrench } from 'lucide-react'
import type { ProductConfig } from '../../shared/types'

export const fleetConfig: ProductConfig = {
  id: 'fleet',
  name: 'FleetOS',
  tagline: 'Muovi il tuo business',
  basePath: '/fleet',
  themeClass: 't-fleet',
  version: '0.1.0',
  logo: (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden>
      <defs><linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor="#ea580c" /></linearGradient></defs>
      <rect width="40" height="40" rx="12" fill="url(#lf)" />
      <path d="M11 29V12h4v13h6M21 29h8M25 29V17h4" stroke="#0a1216" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  companion: {
    id: 'bolt',
    defaultName: 'Bolt',
    role: 'Assistente di flotta e officina',
    image: '/companions/bolt.png',
    objectPosition: 'center top',
    eyes: { spec: [{ cx: 466, cy: 306, rx: 21, ry: 44 }, { cx: 594, cy: 303, rx: 21, ry: 44 }], patch: '#08080c', glow: '#38bdf8', travel: 14 },
  },
  nav: [
    { path: '', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/flotta', label: 'Flotta', icon: Truck },
    { path: '/noleggi', label: 'Noleggi', icon: CalendarRange },
    { path: '/assistenza', label: 'Assistenza', icon: LifeBuoy },
    { path: '/officina', label: 'Officina', icon: Wrench },
    { path: '/ricambi', label: 'Ricambi', icon: Cog },
    { path: '/clienti', label: 'Clienti', icon: Users },
    { path: '/contratti', label: 'Contratti', icon: FileText },
    { path: '/fatturazione', label: 'Fatturazione', icon: Receipt },
    { path: '/analisi', label: 'Analisi', icon: ChartPie },
  ],
}
