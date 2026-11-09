import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ALERT_DAYS, contracts as C, invoices as INV, orders as O, parts as P, revenueHistory, techs, utilizationHistory, vehicles as V, type Contract, type Invoice, type Part, type Priority, type Vehicle, type WorkOrder } from './fixtures'
import { TODAY, addDays, diffDays, sum, uid } from '../../lib/utils'

interface PlanInput { vehicleId: string; type: string; category: WorkOrder['category']; priority: Priority; techId: string; due: string; hours: number; notes?: string; startNow?: boolean }
interface FleetState {
  vehicles: Vehicle[]; contracts: Contract[]; orders: WorkOrder[]; parts: Part[]; invoices: Invoice[]
  plan: (i: PlanInput) => { ok: boolean; error?: string; id?: string }
  startOrder: (id: string) => { ok: boolean; error?: string }
  completeOrder: (id: string) => void
  closeContract: (id: string) => void
  renewContract: (id: string) => void
  reorderPart: (id: string, qty: number) => void
  markPaid: (id: string) => void
  reset: () => void
}
const initial = () => ({ vehicles: V, contracts: C, orders: O, parts: P, invoices: INV })

export const useFleet = create<FleetState>()(
  persist(
    (set, get) => ({
      ...initial(),
      plan: (i) => {
        const st = get()
        const v = st.vehicles.find((x) => x.id === i.vehicleId)
        if (!v) return { ok: false, error: 'Seleziona un mezzo' }
        if (i.due < TODAY) return { ok: false, error: 'La data non può essere nel passato' }
        if (st.orders.some((o) => o.vehicleId === i.vehicleId && o.status !== 'completato' && o.due === i.due && o.type === i.type)) return { ok: false, error: 'Esiste già un intervento identico per questo mezzo e questa data' }
        const id = `INT-${2048 + st.orders.filter((o) => Number(o.id.slice(4)) > 2047).length}`
        set({ orders: [{ id, vehicleId: i.vehicleId, type: i.type, category: i.category, priority: i.priority, techId: i.techId, due: i.due, hours: i.hours, status: 'pianificato', notes: i.notes }, ...st.orders] })
        if (i.startNow) { const r = get().startOrder(id); if (!r.ok) return { ok: true, id, error: r.error } }
        return { ok: true, id }
      },
      startOrder: (id) => {
        const st = get()
        const o = st.orders.find((x) => x.id === id)!
        const v = st.vehicles.find((x) => x.id === o.vehicleId)!
        if (v.status === 'a_noleggio') return { ok: false, error: `${v.id} è a noleggio: attendi la riconsegna prima di fermarlo` }
        set({ orders: st.orders.map((x) => (x.id === id ? { ...x, status: 'in_corso' } : x)), vehicles: st.vehicles.map((x) => (x.id === v.id && x.status === 'disponibile' ? { ...x, status: 'in_manutenzione' } : x)) })
        return { ok: true }
      },
      completeOrder: (id) => {
        const st = get()
        const o = st.orders.find((x) => x.id === id)!
        set({
          orders: st.orders.map((x) => (x.id === id ? { ...x, status: 'completato' } : x)),
          vehicles: st.vehicles.map((x) => (x.id === o.vehicleId ? { ...x, status: x.status === 'in_manutenzione' || x.status === 'fuori_servizio' ? 'disponibile' : x.status, nextServiceDue: addDays(TODAY, 180), note: undefined } : x)),
        })
      },
      closeContract: (id) => set((st) => { const c = st.contracts.find((x) => x.id === id)!; return { contracts: st.contracts.map((x) => (x.id === id ? { ...x, status: 'chiuso' } : x)), vehicles: st.vehicles.map((v) => (v.id === c.vehicleId && v.status === 'a_noleggio' ? { ...v, status: 'disponibile' } : v)) } }),
      renewContract: (id) => set((st) => ({ contracts: st.contracts.map((x) => (x.id === id ? { ...x, end: addDays(x.end, 182) } : x)) })),
      reorderPart: (id, qty) => set((st) => ({ parts: st.parts.map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p)) })),
      markPaid: (id) => set((st) => ({ invoices: st.invoices.map((i) => (i.id === id ? { ...i, status: 'pagata' } : i)) })),
      reset: () => set(initial()),
    }),
    { name: 'amsuite.fleet.v1', version: 1 },
  ),
)

export const isOpen = (o: WorkOrder) => o.status !== 'completato'
export const selectors = {
  counts: (s: FleetState) => ({
    total: s.vehicles.length,
    rented: s.vehicles.filter((v) => v.status === 'a_noleggio').length,
    available: s.vehicles.filter((v) => v.status === 'disponibile').length,
    maint: s.vehicles.filter((v) => v.status === 'in_manutenzione').length,
    out: s.vehicles.filter((v) => v.status === 'fuori_servizio').length,
  }),
  operative: (s: FleetState) => s.vehicles.filter((v) => v.status === 'disponibile' || v.status === 'a_noleggio').length,
  activeContracts: (s: FleetState) => s.contracts.filter((c) => c.status === 'attivo'),
  /** Mezzi con scadenza manutenzione entro ALERT_DAYS, non fermi e senza intervento già aperto. */
  expiring: (s: FleetState) => s.vehicles.filter((v) => (v.status === 'disponibile' || v.status === 'a_noleggio') && diffDays(v.nextServiceDue, TODAY) <= ALERT_DAYS && !s.orders.some((o) => o.vehicleId === v.id && isOpen(o))).sort((a, b) => a.nextServiceDue.localeCompare(b.nextServiceDue)),
  stopped: (s: FleetState) => s.vehicles.filter((v) => v.status === 'fuori_servizio'),
  openOrders: (s: FleetState) => s.orders.filter(isOpen),
  priorityOrders: (s: FleetState) => s.orders.filter((o) => isOpen(o) && o.priority === 'alta'),
  lowParts: (s: FleetState) => s.parts.filter((p) => p.stock < p.min),
  revenueMonth: (s: FleetState) => sum(s.invoices.filter((i) => i.date >= '2026-11-01'), (i) => i.amount),
  utilization: (s: FleetState) => (s.vehicles.length ? (s.vehicles.filter((v) => v.status === 'a_noleggio').length / s.vehicles.length) * 100 : 0),
  utilSeries: (s: FleetState) => [...utilizationHistory, { m: 'Nov', v: Math.round(selectors.utilization(s) * 10) / 10 }],
  revSeries: (s: FleetState) => [...revenueHistory, { m: 'Nov', v: selectors.revenueMonth(s) }],
  techLoad: (s: FleetState) => techs.map((t) => { const h = sum(s.orders.filter((o) => o.techId === t.id && isOpen(o) && diffDays(o.due, TODAY) <= 6), (o) => o.hours); return { ...t, hours: h, pct: (h / t.weeklyHours) * 100 } }),
  profitByType: (s: FleetState) => {
    const types = [...new Set(s.vehicles.map((v) => v.type))]
    return types.map((type) => {
      const rev = sum(s.contracts.filter((c) => c.status === 'attivo' && s.vehicles.find((v) => v.id === c.vehicleId)?.type === type), (c) => c.monthlyFee)
      const cost = sum(s.vehicles.filter((v) => v.type === type), (v) => v.monthlyCost)
      return { type, Ricavi: rev, Costi: cost, Margine: rev - cost }
    })
  },
}
export { uid }
