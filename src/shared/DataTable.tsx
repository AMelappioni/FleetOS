import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import { EmptyState } from './ui'

export interface Column<T> {
  key: string
  header: string
  render?: (r: T) => ReactNode
  sort?: (r: T) => string | number
  align?: 'left' | 'right' | 'center'
  hideBelow?: 'md' | 'lg'
}

export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty = 'Nessun risultato', initialSort, caption }: {
  rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; empty?: string; initialSort?: { key: string; dir: 'asc' | 'desc' }; caption: string
}) {
  const [sort, setSort] = useState(initialSort ?? null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sort) return rows
    const f = col.sort
    return [...rows].sort((a, b) => {
      const x = f(a), y = f(b)
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'it')
      return sort.dir === 'asc' ? r : -r
    })
  }, [rows, sort, columns])
  if (!rows.length) return <EmptyState text={empty} />
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key
              return (
                <th key={c.key} scope="col" aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.hideBelow === 'md' && 'hidden md:table-cell', c.hideBelow === 'lg' && 'hidden lg:table-cell')}>
                  {c.sort ? (
                    <button className="inline-flex items-center gap-1 font-bold uppercase" onClick={() => setSort(active && sort!.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' })}>
                      {c.header}
                      {active ? (sort!.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} className="opacity-50" />}
                    </button>
                  ) : c.header}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} className={cn(onRowClick && 'clickable')} tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(r) } } : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.hideBelow === 'md' && 'hidden md:table-cell', c.hideBelow === 'lg' && 'hidden lg:table-cell')}>
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
