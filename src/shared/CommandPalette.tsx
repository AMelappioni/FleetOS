import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AIAction } from '../ai/provider'
import { Modal } from './ui'
import type { NavItem } from './types'
import { useMood } from './prefs'
import { toast } from './toast'

export function CommandPalette({ open, onClose, nav, basePath, actions }: { open: boolean; onClose: () => void; nav: NavItem[]; basePath: string; actions: AIAction[] }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const navigate = useNavigate()
  const react = useMood((s) => s.react)
  const items = useMemo(() => {
    const all = [
      ...nav.map((n) => ({ id: n.path, label: `Vai a ${n.label}`, kind: 'Navigazione', run: () => navigate(`${basePath}${n.path}`) })),
      ...actions.map((a) => ({ id: a.id, label: a.label, kind: 'Azione rapida', run: () => { const o = a.run(); toast(o || a.label); react('success') } })),
    ]
    const s = q.trim().toLowerCase()
    return s ? all.filter((i) => i.label.toLowerCase().includes(s)) : all
  }, [q, nav, actions, basePath, navigate, react])
  useEffect(() => { setIdx(0) }, [q])
  useEffect(() => { if (!open) setQ('') }, [open])
  const go = (i: number) => { const it = items[i]; if (!it) return; onClose(); it.run() }
  return (
    <Modal open={open} onClose={onClose} title="Cerca comandi e pagine">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-muted" aria-hidden />
        <input className="input pl-9" placeholder="Digita per cercare… (↑↓ per scegliere, Invio per aprire)" value={q} data-autofocus onChange={(e) => setQ(e.target.value)} aria-label="Cerca"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
            if (e.key === 'Enter') go(idx)
          }} />
      </div>
      <ul className="mt-3 max-h-72 overflow-auto" role="listbox">
        {items.map((it, i) => (
          <li key={it.id + it.kind} role="option" aria-selected={i === idx}>
            <button className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-surface2" style={i === idx ? { background: 'var(--surface2)', outline: '1px solid var(--accent)' } : undefined} onClick={() => go(i)} onMouseEnter={() => setIdx(i)}>
              <span>{it.label}</span><span className="text-xs text-muted">{it.kind}</span>
            </button>
          </li>
        ))}
        {!items.length && <li className="p-3 text-sm text-muted">Nessun risultato</li>}
      </ul>
    </Modal>
  )
}
