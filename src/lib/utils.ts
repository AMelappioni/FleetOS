import clsx, { type ClassValue } from 'clsx'

export const cn = (...v: ClassValue[]) => clsx(v)

/** Data "oggi" fissa per tutte le demo: i numeri non cambiano ad ogni render o ad ogni giorno reale. */
export const TODAY = '2026-11-09'

const d = (iso: string) => new Date(iso + 'T12:00:00Z')
export const addDays = (iso: string, n: number) => {
  const x = d(iso)
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
export const diffDays = (a: string, b: string) => Math.round((d(a).getTime() - d(b).getTime()) / 86400000)
export const fmtDate = (iso: string) => d(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
export const fmtDateLong = (iso: string) => d(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
export const fmtDateShort = (iso: string) => d(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
export const eur = (n: number, dec = 0) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: 'always' })
export const num = (n: number) => n.toLocaleString('it-IT', { useGrouping: 'always' })
export const pct = (n: number, dec = 0) => `${n.toLocaleString('it-IT', { minimumFractionDigits: dec, maximumFractionDigits: dec })}%`

export const timeToMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
export const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const sum = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((s, x) => s + f(x), 0)
export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`

/** Hash deterministico (per pseudo-dati riproducibili nelle fixtures). */
export const hash = (n: number) => {
  let x = (n + 1) * 2654435761
  x = (x ^ (x >>> 15)) >>> 0
  return x
}
