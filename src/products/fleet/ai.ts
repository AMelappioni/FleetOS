import { useNavigate } from 'react-router-dom'
import type { AIAction, ProductAIContext } from '../../ai/provider'
import type { NotificationItem } from '../../shared/types'
import { TODAY, diffDays, eur, fmtDate } from '../../lib/utils'
import { techs } from './fixtures'
import { selectors, useFleet } from './store'

const w = ['Nessuna', 'Una', 'Due', 'Tre', 'Quattro', 'Cinque']
const wm = ['nessun', 'un', 'due', 'tre', 'quattro', 'cinque']

export function useFleetAI(): { ai: ProductAIContext; notifications: NotificationItem[] } {
  const navigate = useNavigate()
  const st = useFleet()
  const exp = selectors.expiring(st)
  const stopped = selectors.stopped(st)
  const prio = selectors.priorityOrders(st)
  const low = selectors.lowParts(st)

  const showPrio: AIAction = { id: 'prio', label: 'Filtra interventi prioritari', run: () => { navigate('/fleet/officina?filter=priority'); return `Mostro i ${prio.length} interventi prioritari aperti.` } }
  const planExp: AIAction = {
    id: 'plan-exp', label: 'Pianifica le manutenzioni in scadenza', destructive: true,
    confirmText: `Creo un intervento “Revisione periodica” per ${exp.map((v) => v.id).join(', ')} alla data di scadenza, assegnato al tecnico meno carico. Confermi?`,
    run: () => {
      const load = selectors.techLoad(st).sort((a, b) => a.pct - b.pct)[0]
      exp.forEach((v) => st.plan({ vehicleId: v.id, type: 'Revisione periodica', category: 'manutenzione', priority: 'media', techId: load.id, due: v.nextServiceDue < TODAY ? TODAY : v.nextServiceDue, hours: 3 }))
      navigate('/fleet/officina'); return `Pianificate ${exp.length} manutenzioni (tecnico: ${load.name}). Scadenziario aggiornato.`
    },
  }
  const reorder: AIAction = {
    id: 'reorder', label: 'Riordina ricambi sotto scorta', destructive: true,
    confirmText: `Registro il carico di ${low.map((p) => p.name).join(', ')} fino al doppio del minimo. Confermi?`,
    run: () => { low.forEach((p) => st.reorderPart(p.id, p.min * 2 - p.stock)); return `Riordino registrato per ${low.length} ricambi.` },
  }
  const newPlan: AIAction = { id: 'new-plan', label: 'Pianifica manutenzione', run: () => { navigate('/fleet/officina?new=1'); return 'Compila il modulo: vedrai scadenziario e stato del mezzo aggiornarsi.' } }

  const ai: ProductAIContext = {
    headline: () => {
      const parts: string[] = []
      if (exp.length) parts.push(`${w[exp.length] ?? exp.length} manutenzion${exp.length === 1 ? 'e' : 'i'} in scadenza`)
      if (stopped.length) parts.push(`${wm[stopped.length] ?? stopped.length} mezz${stopped.length === 1 ? 'o fermo' : 'i fermi'}`)
      return parts.length ? { text: (() => { const t = parts.join(' e '); return t[0].toUpperCase() + t.slice(1) })(), mood: 'warning' } : { text: 'Tutto in ordine: nessuna manutenzione in scadenza e nessun mezzo fermo.', mood: 'success' }
    },
    quickActions: () => [showPrio, ...(exp.length ? [planExp] : []), newPlan, ...(low.length ? [reorder] : [])],
    rules: [
      { match: /scadenz|manutenz|revision|tagliand/i, reply: () => ({ text: exp.length ? `Manutenzioni in scadenza (entro 10 giorni, senza intervento pianificato):\n${exp.map((v) => `• ${v.id} · ${v.type} · scade il ${fmtDate(v.nextServiceDue)} (${diffDays(v.nextServiceDue, TODAY)} gg)`).join('\n')}` : 'Nessuna manutenzione in scadenza senza intervento pianificato.', actions: exp.length ? [planExp, newPlan] : [newPlan] }) },
      { match: /ferm|guast|fuori servizio/i, reply: () => ({ text: stopped.length ? `Mezzi fermi:\n${stopped.map((v) => `• ${v.id} · ${v.note ?? 'fuori servizio'}`).join('\n')}` : 'Nessun mezzo fermo.', actions: [showPrio] }) },
      { match: /prior|urgent|intervent|officina/i, reply: () => ({ text: prio.length ? `Interventi prioritari aperti:\n${prio.map((o) => `• ${o.id} · ${o.vehicleId} · ${o.type}`).join('\n')}` : 'Nessun intervento prioritario aperto.', actions: [showPrio] }) },
      { match: /ricamb|scort|magazzin/i, reply: () => ({ text: low.length ? `Ricambi sotto scorta:\n${low.map((p) => `• ${p.name}: ${p.stock} (min ${p.min})`).join('\n')}` : 'Tutti i ricambi sono sopra il minimo.', actions: low.length ? [reorder] : [] }) },
      { match: /tecnic|carico/i, reply: () => ({ text: selectors.techLoad(st).map((t) => `• ${t.name}: ${t.hours} h su ${t.weeklyHours} (${Math.round(t.pct)}%)`).join('\n') }) },
      { match: /fattur|ricav|incass/i, reply: () => ({ text: `Fatturato di novembre: ${eur(selectors.revenueMonth(st))} (${st.invoices.filter((i) => i.status === 'scaduta').length} fatture scadute).` }) },
    ],
    fallback: () => ({ text: 'Posso aiutarti con manutenzioni, mezzi fermi, interventi, ricambi e carico tecnici. Prova un’azione rapida.', actions: [showPrio, newPlan] }),
  }

  const notifications: NotificationItem[] = [
    ...exp.map((v) => ({ id: `n-exp-${v.id}-${v.nextServiceDue}`, tone: 'warn' as const, title: `Manutenzione in scadenza: ${v.id}`, body: `Scade il ${fmtDate(v.nextServiceDue)}. Nessun intervento pianificato.`, to: '/fleet/officina?new=1' })),
    ...stopped.map((v) => ({ id: `n-stop-${v.id}`, tone: 'bad' as const, title: `Mezzo fermo: ${v.id}`, body: v.note ?? 'Fuori servizio', to: '/fleet/officina?filter=priority' })),
    ...low.map((p) => ({ id: `n-part-${p.id}-${p.stock}`, tone: 'bad' as const, title: `Ricambio sotto scorta: ${p.name}`, body: `${p.stock} pz, minimo ${p.min}`, to: '/fleet/ricambi' })),
    ...st.invoices.filter((i) => i.status === 'scaduta').map((i) => ({ id: `n-inv-${i.id}`, tone: 'warn' as const, title: `Fattura scaduta ${i.id}`, body: `${i.customer} · ${eur(i.amount)}`, to: '/fleet/fatturazione' })),
  ]
  void techs
  return { ai, notifications }
}
