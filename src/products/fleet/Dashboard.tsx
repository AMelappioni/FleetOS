import { CalendarCheck, Cog, Euro, Truck, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaTrend, Donut, Legend } from '../../shared/Charts'
import { MetricCard } from '../../shared/MetricCard'
import { Badge, Chips, Panel, Skeleton } from '../../shared/ui'
import { TODAY, diffDays, eur, fmtDate, pct } from '../../lib/utils'
import { YardMap } from './Pages'
import { selectors, useFleet } from './store'

export default function Dashboard() {
  const st = useFleet()
  const navigate = useNavigate()
  const [range, setRange] = useState<'3' | '6'>('6')
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 380); return () => clearTimeout(t) }, [])
  const c = selectors.counts(st)
  const exp = selectors.expiring(st)
  const upcoming = [...st.vehicles].filter((v) => v.status !== 'fuori_servizio').sort((a, b) => a.nextServiceDue.localeCompare(b.nextServiceDue)).slice(0, 6)
  const load = selectors.techLoad(st)
  const low = selectors.lowParts(st)
  const util = selectors.utilSeries(st)
  const profit = selectors.profitByType(st)
  const nextOrders = selectors.openOrders(st).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4)

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Mezzi operativi" value={`${selectors.operative(st)} / ${c.total}`} icon={Truck} tint="#f59e0b" hint={`${c.available} disponibili`} onClick={() => navigate('/fleet/flotta')} />
        <MetricCard label="Noleggi attivi" value={String(selectors.activeContracts(st).length)} icon={CalendarCheck} tint="#38bdf8" hint={`utilizzo ${pct(selectors.utilization(st), 1)}`} onClick={() => navigate('/fleet/noleggi')} />
        <MetricCard label="Interventi aperti" value={String(selectors.openOrders(st).length)} icon={Wrench} tint="#34d399" hint={`${selectors.priorityOrders(st).length} prioritari`} onClick={() => navigate('/fleet/officina')} />
        <MetricCard label="Ricambi critici" value={String(low.length)} icon={Cog} tint="#fb7185" hint={`sotto scorta · ${st.parts.length} codici`} onClick={() => navigate('/fleet/ricambi')} />
        <MetricCard label="Fatturato mese" value={eur(selectors.revenueMonth(st))} icon={Euro} tint="#a78bfa" hint={`${st.invoices.filter((i) => i.status === 'scaduta').length} scadute`} onClick={() => navigate('/fleet/fatturazione')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-4" title="Stato flotta">
          <div className="grid grid-cols-[150px_1fr] items-center gap-3">
            <Donut height={150} data={[{ name: 'A noleggio', value: c.rented, color: '#38bdf8' }, { name: 'Disponibili', value: c.available, color: '#34d399' }, { name: 'In manutenzione', value: c.maint, color: '#fbbf24' }, { name: 'Fuori servizio', value: c.out, color: '#f87171' }]} center={<div><div className="text-2xl font-extrabold">{pct((selectors.operative(st) / c.total) * 100)}</div><div className="text-[11px] text-muted">operativa</div></div>} />
            <Legend items={[{ name: 'A noleggio', value: c.rented, color: '#38bdf8' }, { name: 'Disponibili', value: c.available, color: '#34d399' }, { name: 'In manutenzione', value: c.maint, color: '#fbbf24' }, { name: 'Fuori servizio', value: c.out, color: '#f87171' }]} />
          </div>
        </Panel>
        <Panel className="lg:col-span-4" title="Scadenziario manutenzioni" action={<button className="btn btn-sm" onClick={() => navigate('/fleet/officina?new=1')}>Pianifica</button>}>
          <ul className="grid gap-2">
            {upcoming.map((v) => {
              const o = st.orders.find((x) => x.vehicleId === v.id && x.status !== 'completato')
              const d = diffDays(v.nextServiceDue, TODAY)
              return (
                <li key={v.id} className="flex items-center justify-between gap-2 text-sm"><span><b>{fmtDate(o?.due ?? v.nextServiceDue)}</b> · {v.id}<span className="block text-xs text-muted">{o ? o.type : v.type}</span></span>
                  {o ? <Badge tone={o.status === 'in_corso' ? 'info' : 'ok'}>{o.status === 'in_corso' ? 'In corso' : 'Pianificata'}</Badge> : <Badge tone={d <= 10 ? 'warn' : 'mute'}>{d <= 10 ? `Scade tra ${d} gg` : 'Da pianificare'}</Badge>}</li>
              )
            })}
          </ul>
          {exp.length > 0 && <p className="mt-3 text-xs text-warn">{exp.length} scadenze entro 10 giorni senza intervento pianificato.</p>}
        </Panel>
        <Panel className="lg:col-span-4" title="Carico tecnici (settimana)">
          <ul className="grid gap-3">{load.map((t) => (
            <li key={t.id} className="text-sm"><div className="mb-1 flex justify-between"><b>{t.name} <span className="font-normal text-muted">· {t.skill}</span></b><span className="tabular-nums">{t.hours}/{t.weeklyHours} h</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={Math.round(t.pct)} aria-valuemax={100} aria-label={`Carico ${t.name}`}><div className="h-full rounded-full" style={{ width: `${Math.min(100, t.pct)}%`, background: t.pct > 85 ? 'var(--bad)' : t.pct > 65 ? 'var(--warn)' : 'var(--ok)' }} /></div></li>))}</ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-5" title="Utilizzo flotta" action={<Chips label="Intervallo" value={range} onChange={setRange} options={[{ value: '3', label: '3 mesi' }, { value: '6', label: '6 mesi' }]} />}>
          {loading ? <Skeleton className="h-[200px]" /> : <AreaTrend height={200} data={util.slice(range === '3' ? -3 : 0).map((u) => ({ m: u.m, Utilizzo: u.v }))} xKey="m" yKey="Utilizzo" valueFmt={(n) => `${n}%`} />}
          <p className="mt-1 text-xs text-muted">Novembre = mezzi a noleggio / totale flotta ({c.rented}/{c.total}).</p>
        </Panel>
        <Panel className="lg:col-span-4" title="Redditività per tipologia (mese)">
          <ul className="grid gap-2 text-sm">{profit.map((p) => <li key={p.type} className="flex justify-between gap-2"><span>{p.type}</span><b className={p.Margine >= 0 ? 'text-ok' : 'text-bad'}>{p.Margine >= 0 ? '+' : ''}{eur(p.Margine)}</b></li>)}</ul>
          <p className="mt-2 text-xs text-muted">Canoni dei contratti attivi meno costo mensile di gestione dei mezzi.</p>
        </Panel>
        <Panel className="lg:col-span-3" title="Prossimi interventi" action={<button className="btn btn-sm" onClick={() => navigate('/fleet/officina')}>Tutti</button>}>
          <ul className="grid gap-2 text-sm">{nextOrders.map((o) => <li key={o.id}><b>{fmtDate(o.due)}</b> · {o.type}<span className="block text-xs text-muted">{o.vehicleId} · {o.priority}</span></li>)}</ul>
        </Panel>
      </div>

      <Panel title="Piazzale · schema simulato (non geolocalizzato)"><YardMap /></Panel>
    </div>
  )
}
