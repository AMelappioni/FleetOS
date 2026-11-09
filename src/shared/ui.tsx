import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import { useToasts } from './toast'

export function useFocusTrap(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('input,select,textarea,button,[href],[tabindex]:not([tabindex="-1"])') ?? []).filter((x) => !x.hasAttribute('disabled'))
    const t = setTimeout(() => {
      const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables().find((x) => !x.dataset.close)
      first?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab') {
        const f = focusables()
        if (!f.length) return
        const a = f[0], z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [open, onClose])
  return ref
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useFocusTrap(open, onClose)
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}>
          <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title}
            className={cn('card relative w-full max-h-[90vh] overflow-auto p-6', wide ? 'max-w-2xl' : 'max-w-lg')}
            initial={{ y: reduce ? 0 : 14, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: reduce ? 0 : 8, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button data-close="1" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Chiudi"><X size={16} /></button>
            </div>
            {children}
            {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Drawer({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useFocusTrap(open, onClose)
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
          <motion.aside ref={ref} role="dialog" aria-modal="true" aria-label={title}
            className="card absolute right-0 top-0 flex h-full w-full max-w-md flex-col rounded-none rounded-l-3xl"
            initial={{ x: reduce ? 0 : 60 }} animate={{ x: 0 }} exit={{ x: reduce ? 0 : 40 }} transition={{ duration: 0.25 }}>
            <header className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="text-sm text-muted">{subtitle}</p>}</div>
              <button data-close="1" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Chiudi dettaglio"><X size={16} /></button>
            </header>
            <div className="flex-1 overflow-auto p-5">{children}</div>
            {footer && <footer className="flex flex-wrap gap-2 border-t border-line p-4">{footer}</footer>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute'
export const Badge = ({ tone = 'mute', children }: { tone?: Tone; children: ReactNode }) => <span className={cn('badge', `badge-${tone}`)}>{children}</span>

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="text-sm text-muted">{subtitle}</p>}</div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  )
}

export function Toolbar({ search, onSearch, placeholder = 'Cerca…', children }: { search: string; onSearch: (v: string) => void; placeholder?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input className="input max-w-xs" type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {children}
    </div>
  )
}

export function Chips<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}{o.count !== undefined && <span className="opacity-80">· {o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field">{label}{children}</label>
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('card p-5', className)}>
      {(title || action) && <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-bold">{title}</h2>{action}</div>}
      {children}
    </section>
  )
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton', className)} aria-hidden />

export function EmptyState({ text }: { text: string }) {
  return <div className="grid place-items-center rounded-2xl border border-dashed border-line p-8 text-sm text-muted">{text}</div>
}

export function Toaster() {
  const { items, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] grid -translate-x-1/2 gap-2" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="card pop-in pointer-events-auto flex items-center gap-3 px-4 py-3 text-sm font-semibold" style={{ borderColor: t.tone === 'ok' ? 'var(--ok)' : t.tone === 'warn' ? 'var(--warn)' : t.tone === 'bad' ? 'var(--bad)' : 'var(--accent)' }}>
          <span>{t.text}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => dismiss(t.id)} aria-label="Chiudi notifica"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
