import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BarsChart, Donut, Legend } from '../../shared/Charts'
import { DataTable, type Column } from '../../shared/DataTable'
import { useMood } from '../../shared/prefs'
import { toast } from '../../shared/toast'
import { Badge, Chips, Drawer, Field, Modal, PageHeader, Panel, Toolbar, type Tone } from '../../shared/ui'
import { TODAY, addDays, diffDays, eur, fmtDate, pct } from '../../lib/utils'
import { techs, type Contract, type Invoice, type Part, type Priority, type Vehicle, type VStatus, type WorkOrder } from './fixtures'
import { isOpen, selectors, useFleet } from './store'

export const statusLabel: Record<VStatus, string> = { disponibile: 'Disponibile', a_noleggio: 'A noleggio', in_manutenzione: 'In manutenzione', fuori_servizio: 'Fuori servizio' }
export const statusTone: Record<VStatus, Tone> = { disponibile: 'ok', a_noleggio: 'info', in_manutenzione: 'warn', fuori_servizio: 'bad' }
const prioTone: Record<Priority, Tone> = { alta: 'bad', media: 'warn', bassa: 'mute' }
const tech = (id: string) => techs.find((t) => t.id === id)?.name ?? id

/* ------------------------------ Piazzale (schema non geografico) ------------------------------ */
export function YardMap({ onPick }: { onPick?: (v: Vehicle) => void }) {
  const st = useFleet()
  const col = { disponibile: '#34d399', a_noleggio: '#38bdf8', in_manutenzione: '#fbbf24', fuori_servizio: '#f87171' }
  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11" role="list" aria-label="Schema piazzale con i mezzi">
        {st.vehicles.map((v) => (
          <button key={v.id} role="listitem" onClick={() => onPick?.(v)} className="rounded-xl border p-2 text-center text-xs font-bold transition-transform hover:-translate-y-0.5" style={{ borderColor: col[v.status], background: `color-mix(in srgb, ${col[v.status]} 14%, var(--surface))` }} aria-label={`${v.id}, ${statusLabel[v.status]}`}>
            <span className="block">{v.id.replace('FL-', '')}</span><span className="block text-[10px] font-semibold opacity-80">{statusLabel[v.status].split(' ').pop()}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Posizioni dimostrative per stato, non derivate da GPS.</p>
    </div>
  )
}

/* ------------------------------ Modal Pianifica manutenzione ------------------------------ */
export function PlanModal({ open, onClose, vehicleId, category = 'manutenzione' }: { open: boolean; onClose: () => void; vehicleId?: string; category?: WorkOrder['category'] }) {
  const st = useFleet()
  const react = useMood((s) => s.react)
  const [f, setF] = useState({ vehicleId: vehicleId ?? selectors.expiring(st)[0]?.id ?? st.vehicles[0].id, type: category === 'assistenza' ? 'Riparazione' : 'Revisione periodica', priority: 'media' as Priority, techId: 't1', due: addDays(TODAY, 3), hours: 3, notes: '', startNow: false })
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setErr(''); if (vehicleId) setF((s) => ({ ...s, vehicleId })) } }, [open, vehicleId])
  const v = st.vehicles.find((x) => x.id === f.vehicleId)
  const types = category === 'assistenza' ? ['Riparazione', 'Diagnosi guasto', 'Sostituzione ricambio'] : ['Revisione periodica', 'Tagliando 500 h', 'Cambio batteria', 'Controllo sicurezza', 'Controllo freni']
  return (
    <Modal open={open} onClose={onClose} wide title={category === 'assistenza' ? 'Nuova richiesta di assistenza' : 'Pianifica manutenzione'}
      footer={<><button className="btn" onClick={onClose}>Annulla</button><button className="btn btn-primary" onClick={() => {
        const r = st.plan({ ...f, category, notes: f.notes || undefined })
        if (!r.ok) { setErr(r.error!); react('warning'); return }
        react('success'); toast(r.error ? `Intervento ${r.id} pianificato. ${r.error}` : `Intervento ${r.id} ${f.startNow ? 'avviato: mezzo in manutenzione' : 'pianificato: scadenziario aggiornato'}`, r.error ? 'warn' : 'ok'); onClose()
      }}>{category === 'assistenza' ? 'Crea richiesta' : 'Pianifica intervento'}</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mezzo"><select className="input" value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })} data-autofocus>{st.vehicles.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.type} · {statusLabel[x.status]}</option>)}</select></Field>
        <Field label="Tipo di intervento"><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Data"><input className="input" type="date" min={TODAY} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
        <Field label="Ore stimate"><input className="input" type="number" min={1} value={f.hours} onChange={(e) => setF({ ...f, hours: Math.max(1, Number(e.target.value)) })} /></Field>
        <Field label="Tecnico"><select className="input" value={f.techId} onChange={(e) => setF({ ...f, techId: e.target.value })}>{techs.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.skill}</option>)}</select></Field>
        <Field label="Priorità"><select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}><option value="alta">Alta</option><option value="media">Media</option><option value="bassa">Bassa</option></select></Field>
        <Field label="Note"><input className="input sm:col-span-2" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Facoltative" /></Field>
      </div>
      {v && <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.startNow} onChange={(e) => setF({ ...f, startNow: e.target.checked })} />Avvia subito (il mezzo risulta in manutenzione{v.status === 'a_noleggio' ? ' — non possibile: è a noleggio' : ''})</label>}
      {err && <p role="alert" className="mt-3 rounded-xl border border-[var(--bad)] p-3 text-sm text-bad">{err}</p>}
    </Modal>
  )
}

/* ------------------------------ Flotta ------------------------------ */
export function Flotta() {
  const st = useFleet()
  const [q, setQ] = useState(''), [sf, setSf] = useState<'all' | VStatus>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [plan, setPlan] = useState(false)
  const rows = st.vehicles.filter((v) => (sf === 'all' || v.status === sf) && (v.id + v.type).toLowerCase().includes(q.toLowerCase()))
  const sel = st.vehicles.find((v) => v.id === open)
  const c = selectors.counts(st)
  const cols: Column<Vehicle>[] = [
    { key: 'id', header: 'Matricola', sort: (v) => v.id, render: (v) => <b>{v.id}</b> },
    { key: 'type', header: 'Tipologia', sort: (v) => v.type },
    { key: 'st', header: 'Stato', sort: (v) => v.status, render: (v) => <Badge tone={statusTone[v.status]}>{statusLabel[v.status]}</Badge> },
    { key: 'h', header: 'Ore', sort: (v) => v.hours, align: 'right', render: (v) => v.hours.toLocaleString('it-IT'), hideBelow: 'md' },
    { key: 'due', header: 'Prossima manutenzione', sort: (v) => v.nextServiceDue, render: (v) => { const d = diffDays(v.nextServiceDue, TODAY); return <span className={d <= 10 ? 'font-bold text-warn' : ''}>{fmtDate(v.nextServiceDue)}</span> } },
    { key: 'cust', header: 'Cliente', hideBelow: 'lg', render: (v) => st.contracts.find((x) => x.vehicleId === v.id && x.status === 'attivo')?.customer ?? '—' },
  ]
  return (
    <>
      <PageHeader title="Flotta" subtitle={`${c.total} mezzi · ${c.rented} a noleggio · ${c.available} disponibili`} actions={<button className="btn btn-primary" onClick={() => setPlan(true)}><Plus size={16} />Pianifica manutenzione</button>} />
      <Panel title="Piazzale · schema simulato" className="mb-4"><YardMap onPick={(v) => setOpen(v.id)} /></Panel>
      <Toolbar search={q} onSearch={setQ} placeholder="Cerca matricola o tipologia"><Chips label="Stato mezzo" value={sf} onChange={setSf} options={[{ value: 'all', label: 'Tutti', count: c.total }, { value: 'disponibile', label: 'Disponibili', count: c.available }, { value: 'a_noleggio', label: 'A noleggio', count: c.rented }, { value: 'in_manutenzione', label: 'Manutenzione', count: c.maint }, { value: 'fuori_servizio', label: 'Fermi', count: c.out }]} /></Toolbar>
      <Panel><DataTable caption="Tabella matricole" rows={rows} rowKey={(v) => v.id} columns={cols} onRowClick={(v) => setOpen(v.id)} initialSort={{ key: 'id', dir: 'asc' }} /></Panel>
      <Drawer open={!!sel} onClose={() => setOpen(null)} title={sel?.id ?? ''} subtitle={sel ? `${sel.type} · ${sel.year}` : ''} footer={sel && <button className="btn btn-primary" onClick={() => setPlan(true)}>Pianifica manutenzione</button>}>
        {sel && (
          <div className="grid gap-4 text-sm">
            <div className="flex flex-wrap gap-2"><Badge tone={statusTone[sel.status]}>{statusLabel[sel.status]}</Badge><Badge>{sel.hours.toLocaleString('it-IT')} h</Badge></div>
            {sel.note && <p className="rounded-xl border border-[var(--bad)] p-3 text-bad">{sel.note}</p>}
            <p>Prossima manutenzione: <b>{fmtDate(sel.nextServiceDue)}</b> ({diffDays(sel.nextServiceDue, TODAY)} gg)</p>
            <div><h3 className="mb-1 font-bold">Contratto</h3>{st.contracts.filter((x) => x.vehicleId === sel.id && x.status === 'attivo').map((c) => <p key={c.id}>{c.customer} · fino al {fmtDate(c.end)} · {eur(c.monthlyFee)}/mese</p>)}{!st.contracts.some((x) => x.vehicleId === sel.id && x.status === 'attivo') && <p className="text-muted">Nessun noleggio attivo.</p>}</div>
            <div><h3 className="mb-1 font-bold">Interventi</h3><ul className="grid gap-1">{st.orders.filter((o) => o.vehicleId === sel.id).map((o) => <li key={o.id} className="flex justify-between gap-2"><span>{fmtDate(o.due)} · {o.type}</span><Badge tone={o.status === 'completato' ? 'ok' : o.status === 'in_corso' ? 'info' : 'mute'}>{o.status.replace('_', ' ')}</Badge></li>)}{!st.orders.some((o) => o.vehicleId === sel.id) && <li className="text-muted">Nessun intervento registrato.</li>}</ul></div>
          </div>
        )}
      </Drawer>
      <PlanModal open={plan} onClose={() => setPlan(false)} vehicleId={open ?? undefined} />
    </>
  )
}

/* ------------------------------ Noleggi ------------------------------ */
export function Noleggi() {
  const st = useFleet()
  const react = useMood((s) => s.react)
  const [close, setClose] = useState<Contract | null>(null)
  const rows = st.contracts
  return (
    <>
      <PageHeader title="Noleggi" subtitle={`${selectors.activeContracts(st).length} noleggi attivi · canoni ${eur(selectors.activeContracts(st).reduce((s, c) => s + c.monthlyFee, 0))}/mese`} />
      <Panel><DataTable caption="Noleggi" rows={rows} rowKey={(c) => c.id} initialSort={{ key: 'end', dir: 'asc' }} columns={[
        { key: 'id', header: 'Contratto', sort: (c) => c.id },
        { key: 'cu', header: 'Cliente', sort: (c) => c.customer, render: (c) => <b>{c.customer}</b> },
        { key: 'v', header: 'Mezzo', sort: (c) => c.vehicleId, render: (c) => `${c.vehicleId} · ${st.vehicles.find((v) => v.id === c.vehicleId)?.type}`, hideBelow: 'md' },
        { key: 'end', header: 'Scadenza', sort: (c) => c.end, render: (c) => fmtDate(c.end) },
        { key: 'fee', header: 'Canone', sort: (c) => c.monthlyFee, align: 'right', render: (c) => eur(c.monthlyFee) },
        { key: 'st', header: 'Stato', render: (c) => <Badge tone={c.status === 'attivo' ? 'info' : 'mute'}>{c.status}</Badge> },
        { key: 'a', header: '', align: 'right', render: (c) => c.status === 'attivo' ? <button className="btn btn-sm" onClick={() => setClose(c)}>Chiudi noleggio</button> : null },
      ]} /></Panel>
      <Modal open={!!close} onClose={() => setClose(null)} title="Chiudere il noleggio?" footer={<><button className="btn" onClick={() => setClose(null)}>Annulla</button><button className="btn btn-primary" onClick={() => { st.closeContract(close!.id); react('success'); toast(`${close!.vehicleId} riconsegnato: ora disponibile`); setClose(null) }}>Conferma riconsegna</button></>}>
        <p className="text-sm">{close?.customer} riconsegna {close?.vehicleId}. Il mezzo tornerà disponibile e gli indicatori della flotta si aggiorneranno.</p>
      </Modal>
    </>
  )
}

/* ------------------------------ Ordini di lavoro (Officina / Assistenza) ------------------------------ */
function OrderCard({ o }: { o: WorkOrder }) {
  const st = useFleet()
  const react = useMood((s) => s.react)
  return (
    <div className="card p-3 text-sm">
      <div className="flex items-start justify-between gap-2"><b>{o.vehicleId} · {o.type}</b><Badge tone={prioTone[o.priority]}>{o.priority}</Badge></div>
      <p className="text-xs text-muted">{o.id} · {fmtDate(o.due)} · {tech(o.techId)} · {o.hours} h</p>
      {o.notes && <p className="mt-1 text-xs">{o.notes}</p>}
      <div className="mt-2 flex gap-2">
        {o.status === 'pianificato' && <button className="btn btn-sm" onClick={() => { const r = st.startOrder(o.id); if (r.ok) { react('success'); toast(`${o.vehicleId}: intervento avviato, mezzo in manutenzione`) } else { react('warning'); toast(r.error!, 'warn') } }}>Avvia</button>}
        {o.status === 'in_corso' && <button className="btn btn-primary btn-sm" onClick={() => { st.completeOrder(o.id); react('success'); toast(`${o.vehicleId}: intervento completato, mezzo di nuovo disponibile`) }}>Completa</button>}
      </div>
    </div>
  )
}

export function Officina() {
  const st = useFleet()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filter') ?? 'all') as 'all' | 'priority'
  const [plan, setPlan] = useState(params.get('new') === '1')
  const list = st.orders.filter((o) => filter === 'all' || (o.priority === 'alta' && isOpen(o)))
  const exp = selectors.expiring(st)
  return (
    <>
      <PageHeader title="Officina" subtitle="Interventi, scadenziario e carico tecnici" actions={<button className="btn btn-primary" onClick={() => setPlan(true)}><Plus size={16} />Pianifica manutenzione</button>} />
      <div className="mb-4"><Chips label="Filtro interventi" value={filter} onChange={(v) => setParams(v === 'all' ? {} : { filter: v })} options={[{ value: 'all', label: 'Tutti', count: st.orders.length }, { value: 'priority', label: 'Prioritari aperti', count: selectors.priorityOrders(st).length }]} /></div>
      {exp.length > 0 && <div className="card mb-4 border-[var(--warn)] p-4 text-sm" role="status"><b className="text-warn">Scadenze senza intervento:</b> {exp.map((v) => `${v.id} (${fmtDate(v.nextServiceDue)})`).join(', ')}</div>}
      <div className="grid gap-4 xl:grid-cols-3">
        {(['pianificato', 'in_corso', 'completato'] as const).map((s) => (
          <section key={s} aria-label={s}><h2 className="mb-2 flex items-center gap-2 font-bold capitalize">{s.replace('_', ' ')}<Badge>{list.filter((o) => o.status === s).length}</Badge></h2>
            <div className="grid gap-3">{list.filter((o) => o.status === s).sort((a, b) => a.due.localeCompare(b.due)).map((o) => <OrderCard key={o.id} o={o} />)}{!list.some((o) => o.status === s) && <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">Nessun intervento</p>}</div></section>
        ))}
      </div>
      <Panel title="Carico tecnici (settimana corrente)" className="mt-4"><ul className="grid gap-3 md:grid-cols-2">{selectors.techLoad(st).map((t) => <li key={t.id} className="text-sm"><div className="mb-1 flex justify-between"><b>{t.name}</b><span>{t.hours}/{t.weeklyHours} h · {Math.round(t.pct)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full" style={{ width: `${Math.min(100, t.pct)}%`, background: t.pct > 85 ? 'var(--bad)' : t.pct > 65 ? 'var(--warn)' : 'var(--ok)' }} /></div></li>)}</ul></Panel>
      <PlanModal open={plan} onClose={() => { setPlan(false); if (params.get('new')) setParams({}, { replace: true }) }} />
    </>
  )
}

export function Assistenza() {
  const st = useFleet()
  const [plan, setPlan] = useState(false)
  const rows = st.orders.filter((o) => o.category === 'assistenza')
  return (
    <>
      <PageHeader title="Assistenza" subtitle="Richieste dei clienti e interventi su guasto" actions={<button className="btn btn-primary" onClick={() => setPlan(true)}><Plus size={16} />Nuova richiesta</button>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((o) => <OrderCard key={o.id} o={o} />)}</div>
      <PlanModal open={plan} onClose={() => setPlan(false)} category="assistenza" />
    </>
  )
}

/* ------------------------------ Ricambi ------------------------------ */
export function Ricambi() {
  const st = useFleet()
  const react = useMood((s) => s.react)
  const [only, setOnly] = useState<'all' | 'low'>('all')
  const rows = st.parts.filter((p) => only === 'all' || p.stock < p.min)
  const cols: Column<Part>[] = [
    { key: 'name', header: 'Ricambio', sort: (p) => p.name, render: (p) => <span><b>{p.name}</b><span className="block text-xs text-muted">{p.code} · {p.supplier}</span></span> },
    { key: 'stock', header: 'Giacenza', sort: (p) => p.stock, align: 'right', render: (p) => <Badge tone={p.stock < p.min ? 'bad' : 'ok'}>{p.stock}</Badge> },
    { key: 'min', header: 'Minimo', align: 'right', sort: (p) => p.min },
    { key: 'val', header: 'Valore', align: 'right', sort: (p) => p.stock * p.cost, render: (p) => eur(p.stock * p.cost), hideBelow: 'md' },
    { key: 'a', header: '', align: 'right', render: (p) => <button className="btn btn-sm" onClick={() => { st.reorderPart(p.id, Math.max(p.min * 2 - p.stock, 2)); react('success'); toast(`Carico registrato: ${p.name}`) }}>Riordina</button> },
  ]
  return (
    <>
      <PageHeader title="Ricambi" subtitle={`${selectors.lowParts(st).length} sotto scorta · valore ${eur(st.parts.reduce((s, p) => s + p.stock * p.cost, 0))}`} />
      <div className="mb-4"><Chips label="Filtro" value={only} onChange={setOnly} options={[{ value: 'all', label: 'Tutti', count: st.parts.length }, { value: 'low', label: 'Sotto scorta', count: selectors.lowParts(st).length }]} /></div>
      <Panel><DataTable caption="Ricambi" rows={rows} rowKey={(p) => p.id} columns={cols} /></Panel>
    </>
  )
}

/* ------------------------------ Clienti ------------------------------ */
export function ClientiFleet() {
  const st = useFleet()
  const [q, setQ] = useState('')
  const names = [...new Set(st.contracts.map((c) => c.customer))]
  const rows = names.filter((n) => n.toLowerCase().includes(q.toLowerCase())).map((n) => ({ name: n, active: st.contracts.filter((c) => c.customer === n && c.status === 'attivo'), billed: st.invoices.filter((i) => i.customer === n).reduce((s, i) => s + i.amount, 0), open: st.invoices.filter((i) => i.customer === n && i.status !== 'pagata').reduce((s, i) => s + i.amount, 0) }))
  return (
    <>
      <PageHeader title="Clienti" subtitle={`${names.length} aziende`} />
      <Toolbar search={q} onSearch={setQ} placeholder="Cerca azienda" />
      <Panel><DataTable caption="Clienti" rows={rows} rowKey={(r) => r.name} columns={[
        { key: 'n', header: 'Azienda', sort: (r) => r.name, render: (r) => <b>{r.name}</b> },
        { key: 'm', header: 'Mezzi attivi', sort: (r) => r.active.length, align: 'right', render: (r) => r.active.map((c) => c.vehicleId).join(', ') || '—' },
        { key: 'b', header: 'Fatturato nov.', sort: (r) => r.billed, align: 'right', render: (r) => eur(r.billed) },
        { key: 'o', header: 'Da incassare', sort: (r) => r.open, align: 'right', render: (r) => r.open ? <Badge tone="warn">{eur(r.open)}</Badge> : <Badge tone="ok">In regola</Badge> },
      ]} /></Panel>
    </>
  )
}

/* ------------------------------ Contratti ------------------------------ */
export function Contratti() {
  const st = useFleet()
  const react = useMood((s) => s.react)
  const rows = selectors.activeContracts(st)
  return (
    <>
      <PageHeader title="Contratti" subtitle="Scadenze e rinnovi dei noleggi attivi" />
      <Panel><DataTable caption="Scadenze contratti" rows={rows} rowKey={(c) => c.id} initialSort={{ key: 'end', dir: 'asc' }} columns={[
        { key: 'cu', header: 'Cliente', sort: (c) => c.customer, render: (c) => <b>{c.customer}</b> },
        { key: 'id', header: 'Contratto', hideBelow: 'md', sort: (c) => c.id },
        { key: 'end', header: 'Scadenza', sort: (c) => c.end, render: (c) => fmtDate(c.end) },
        { key: 'left', header: 'Residuo', sort: (c) => diffDays(c.end, TODAY), render: (c) => { const d = diffDays(c.end, TODAY); return <Badge tone={d <= 30 ? 'warn' : 'mute'}>{d} gg</Badge> } },
        { key: 'fee', header: 'Canone', align: 'right', sort: (c) => c.monthlyFee, render: (c) => eur(c.monthlyFee) },
        { key: 'a', header: '', align: 'right', render: (c) => <button className="btn btn-sm" onClick={() => { st.renewContract(c.id); react('success'); toast(`${c.customer}: rinnovato di 6 mesi (fino al ${fmtDate(addDays(c.end, 182))})`) }}>Rinnova +6 mesi</button> },
      ]} /></Panel>
    </>
  )
}

/* ------------------------------ Fatturazione ------------------------------ */
export function Fatturazione() {
  const st = useFleet()
  const react = useMood((s) => s.react)
  const [f, setF] = useState<'all' | Invoice['status']>('all')
  const rows = st.invoices.filter((i) => f === 'all' || i.status === f)
  const tone: Record<Invoice['status'], Tone> = { pagata: 'ok', emessa: 'info', scaduta: 'bad' }
  const open = st.invoices.filter((i) => i.status !== 'pagata').reduce((s, i) => s + i.amount, 0)
  return (
    <>
      <PageHeader title="Fatturazione" subtitle={`Fatturato novembre ${eur(selectors.revenueMonth(st))} · da incassare ${eur(open)}`} />
      <div className="mb-4"><Chips label="Stato fattura" value={f} onChange={setF} options={[{ value: 'all', label: 'Tutte', count: st.invoices.length }, { value: 'emessa', label: 'Emesse', count: st.invoices.filter((i) => i.status === 'emessa').length }, { value: 'scaduta', label: 'Scadute', count: st.invoices.filter((i) => i.status === 'scaduta').length }, { value: 'pagata', label: 'Pagate', count: st.invoices.filter((i) => i.status === 'pagata').length }]} /></div>
      <Panel><DataTable caption="Fatture" rows={rows} rowKey={(i) => i.id} initialSort={{ key: 'id', dir: 'desc' }} columns={[
        { key: 'id', header: 'Fattura', sort: (i) => i.id }, { key: 'cu', header: 'Cliente', sort: (i) => i.customer },
        { key: 'k', header: 'Tipo', hideBelow: 'md', render: (i) => <Badge>{i.kind}</Badge> },
        { key: 'due', header: 'Scadenza', sort: (i) => i.due, render: (i) => fmtDate(i.due), hideBelow: 'md' },
        { key: 'amt', header: 'Importo', sort: (i) => i.amount, align: 'right', render: (i) => eur(i.amount) },
        { key: 'st', header: 'Stato', render: (i) => <Badge tone={tone[i.status]}>{i.status}</Badge> },
        { key: 'a', header: '', align: 'right', render: (i) => i.status !== 'pagata' ? <button className="btn btn-sm" onClick={() => { st.markPaid(i.id); react('success'); toast(`${i.id} segnata come pagata`) }}>Segna pagata</button> : null },
      ]} /></Panel>
    </>
  )
}

/* ------------------------------ Analisi ------------------------------ */
export function Analisi() {
  const st = useFleet()
  const nav = useNavigate()
  const c = selectors.counts(st)
  return (
    <>
      <PageHeader title="Analisi" subtitle="Utilizzo, ricavi e redditività calcolati dai dati demo" actions={<button className="btn btn-sm" onClick={() => nav('/fleet/officina')}>Vai all'officina</button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Ricavi mensili"><BarsChart data={selectors.revSeries(st).map((r) => ({ m: r.m, Ricavi: r.v }))} xKey="m" series={[{ key: 'Ricavi', name: 'Ricavi', color: 'var(--accent)' }]} valueFmt={eur} /></Panel>
        <Panel title="Redditività per tipologia (mese)"><BarsChart data={selectors.profitByType(st).map((p) => ({ t: p.type.split(' ')[0], Ricavi: p.Ricavi, Costi: p.Costi }))} xKey="t" series={[{ key: 'Ricavi', name: 'Ricavi', color: '#38bdf8' }, { key: 'Costi', name: 'Costi', color: '#f87171' }]} valueFmt={eur} /></Panel>
        <Panel title="Stato flotta"><div className="grid grid-cols-[170px_1fr] items-center gap-4"><Donut height={170} data={[{ name: 'A noleggio', value: c.rented, color: '#38bdf8' }, { name: 'Disponibili', value: c.available, color: '#34d399' }, { name: 'In manutenzione', value: c.maint, color: '#fbbf24' }, { name: 'Fuori servizio', value: c.out, color: '#f87171' }]} /><Legend items={[{ name: 'A noleggio', value: c.rented, color: '#38bdf8' }, { name: 'Disponibili', value: c.available, color: '#34d399' }, { name: 'In manutenzione', value: c.maint, color: '#fbbf24' }, { name: 'Fuori servizio', value: c.out, color: '#f87171' }]} /></div></Panel>
        <Panel title="Indicatori"><dl className="grid grid-cols-2 gap-3 text-center"><div className="rounded-xl border border-line bg-surface2 p-4"><dt className="text-xs text-muted">Utilizzo</dt><dd className="text-2xl font-extrabold">{pct(selectors.utilization(st), 1)}</dd></div><div className="rounded-xl border border-line bg-surface2 p-4"><dt className="text-xs text-muted">Disponibilità operativa</dt><dd className="text-2xl font-extrabold">{pct((selectors.operative(st) / c.total) * 100, 1)}</dd></div></dl></Panel>
      </div>
    </>
  )
}
