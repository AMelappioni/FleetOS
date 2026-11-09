import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReactNode } from 'react'

const axis = { fontSize: 12, fill: 'var(--muted)' }
const tip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 13 }, labelStyle: { color: 'var(--muted)' }, itemStyle: { color: 'var(--text)' } }
const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}k` : String(v))

export function AreaTrend({ data, xKey, yKey, valueFmt, height = 220 }: { data: Record<string, number | string>[]; xKey: string; yKey: string; valueFmt: (n: number) => string; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Grafico andamento">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey={xKey} tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={fmtK} width={44} />
          <Tooltip {...tip} formatter={(v) => valueFmt(Number(v))} />
          <Area type="monotone" dataKey={yKey} stroke="var(--accent)" strokeWidth={3} fill="url(#gArea)" dot={{ r: 3, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarsChart({ data, xKey, series, valueFmt, height = 220, stacked }: { data: Record<string, number | string>[]; xKey: string; series: { key: string; name: string; color: string }[]; valueFmt: (n: number) => string; height?: number; stacked?: boolean }) {
  return (
    <div style={{ height }} role="img" aria-label="Grafico a barre">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey={xKey} tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={fmtK} width={44} />
          <Tooltip {...tip} cursor={{ fill: 'color-mix(in srgb, var(--accent) 10%, transparent)' }} formatter={(v) => valueFmt(Number(v))} />
          {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[6, 6, 0, 0]} stackId={stacked ? 'a' : undefined} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Donut({ data, center, height = 190 }: { data: { name: string; value: number; color: string }[]; center?: ReactNode; height?: number }) {
  return (
    <div className="relative" style={{ height }} role="img" aria-label={`Grafico a ciambella: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="92%" paddingAngle={2} stroke="none">
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip {...tip} />
        </PieChart>
      </ResponsiveContainer>
      {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  )
}

export const Legend = ({ items }: { items: { name: string; value: string | number; color: string }[] }) => (
  <ul className="grid gap-1.5 text-sm">
    {items.map((i) => (
      <li key={i.name} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} aria-hidden />{i.name}</span><b>{i.value}</b></li>
    ))}
  </ul>
)
