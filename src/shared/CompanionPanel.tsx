import { motion, useReducedMotion } from 'framer-motion'
import { Send, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { activeProvider, type AIAction, type ProductAIContext } from '../ai/provider'
import { Drawer } from './ui'
import { useMood } from './prefs'
import { toast } from './toast'

interface Msg { id: number; from: 'ai' | 'user'; text: string; actions?: AIAction[]; pending?: AIAction; done?: string[] }

export function CompanionPanel({ open, onClose, name, role, ai }: { open: boolean; onClose: () => void; name: string; role: string; ai: ProductAIContext }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const idRef = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)
  const react = useMood((s) => s.react)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ id: idRef.current++, from: 'ai', text: ai.headline().text, actions: ai.quickActions() }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' }) }, [msgs, reduce])

  const add = (m: Omit<Msg, 'id'>) => setMsgs((s) => [...s, { ...m, id: idRef.current++ }])

  const exec = (msgId: number, a: AIAction, confirmed = false) => {
    if (a.destructive && !confirmed) {
      setMsgs((s) => s.map((m) => (m.id === msgId ? { ...m, pending: a } : m)))
      return
    }
    const out = a.run()
    setMsgs((s) => s.map((m) => (m.id === msgId ? { ...m, pending: undefined, done: [...(m.done ?? []), a.id] } : m)))
    add({ from: 'ai', text: out || 'Fatto.' })
    react('success')
    toast(out || `${a.label}: eseguito`, 'ok')
  }

  const send = async (raw: string) => {
    const t = raw.trim()
    if (!t || busy) return
    setText('')
    add({ from: 'user', text: t })
    setBusy(true)
    react('idle')
    const r = await activeProvider.respond(t, ai)
    setBusy(false)
    add({ from: 'ai', text: r.text, actions: r.actions })
    if (r.mood) react(r.mood)
  }

  return (
    <Drawer open={open} onClose={onClose} title={`Chiedi a ${name}`} subtitle={role}
      footer={
        <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); send(text) }}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Scrivi a ${name}…`} aria-label={`Messaggio per ${name}`} data-autofocus />
          <button className="btn btn-primary" type="submit" aria-label="Invia" disabled={busy}><Send size={16} /></button>
        </form>
      }>
      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-line bg-surface2 p-3 text-xs text-muted">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
        <span><b className="text-ink">Simulazione locale.</b> Nessun modello AI è collegato: {name} risponde con regole deterministiche sui dati demo. Le azioni irreversibili chiedono sempre conferma.</span>
      </div>
      <div className="grid gap-3" aria-live="polite">
        {msgs.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={m.from === 'user' ? 'justify-self-end' : 'justify-self-start'} style={{ maxWidth: '92%' }}>
            <div className={m.from === 'user' ? 'rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm font-medium text-[var(--accent-fg)]' : 'rounded-2xl rounded-bl-md border border-line bg-surface2 px-3.5 py-2.5 text-sm'}>
              {m.from === 'ai' && <span className="mb-1 flex items-center gap-1 text-xs font-bold text-accent"><Sparkles size={12} aria-hidden />{name}</span>}
              <p className="whitespace-pre-line">{m.text}</p>
            </div>
            {m.actions && m.actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.actions.map((a) => (
                  <button key={a.id} className="btn btn-sm" disabled={m.done?.includes(a.id) || !!m.pending} onClick={() => exec(m.id, a)}>
                    {m.done?.includes(a.id) ? '✓ ' : ''}{a.label}
                  </button>
                ))}
              </div>
            )}
            {m.pending && (
              <div className="mt-2 rounded-2xl border border-[var(--warn)] bg-surface2 p-3 text-sm" role="alertdialog" aria-label="Conferma azione">
                <p className="mb-2 font-semibold">{m.pending.confirmText ?? `Confermi “${m.pending.label}”?`}</p>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => exec(m.id, m.pending!, true)}>Conferma</button>
                  <button className="btn btn-sm" onClick={() => setMsgs((s) => s.map((x) => (x.id === m.id ? { ...x, pending: undefined } : x)))}>Annulla</button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {busy && <div className="skeleton h-9 w-40" aria-label={`${name} sta scrivendo`} />}
        <div ref={endRef} />
      </div>
    </Drawer>
  )
}
