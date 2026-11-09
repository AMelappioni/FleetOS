import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { usePrefs } from './prefs'
import type { NotificationItem } from './types'

export function Notifications({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false)
  const read = usePrefs((s) => s.readNotifs)
  const markRead = usePrefs((s) => s.markRead)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const unread = items.filter((i) => !read.includes(i.id)).length
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])
  const dot = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', info: 'var(--accent)' }
  return (
    <div className="relative" ref={ref}>
      <button className="btn btn-ghost relative !p-2.5" onClick={() => setOpen((o) => !o)} aria-label={`Notifiche, ${unread} da leggere`} aria-expanded={open} aria-haspopup="true">
        <Bell size={18} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--bad)] px-1 text-[11px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="card pop-in absolute right-0 z-40 mt-2 w-[min(92vw,380px)] p-2">
          <div className="flex items-center justify-between px-3 py-2"><b>Notifiche</b>
            <button className="btn btn-ghost btn-sm" onClick={() => markRead(items.map((i) => i.id))}><CheckCheck size={14} />Segna lette</button></div>
          <ul className="max-h-80 overflow-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button className={cn('flex w-full gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface2', read.includes(n.id) && 'opacity-60')} onClick={() => { markRead([n.id]); setOpen(false); if (n.to) navigate(n.to) }}>
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot[n.tone] }} aria-hidden />
                  <span><span className="block text-sm font-bold">{n.title}</span><span className="block text-xs text-muted">{n.body}</span></span>
                </button>
              </li>
            ))}
            {!items.length && <li className="p-4 text-sm text-muted">Nessuna notifica: tutto in ordine.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
