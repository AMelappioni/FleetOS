import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'

export function MetricCard({ label, value, delta, deltaLabel, icon: Icon, tint, onClick, hint }: {
  label: string; value: string; delta?: number; deltaLabel?: string; icon: LucideIcon; tint: string; onClick?: () => void; hint?: string
}) {
  const reduce = useReducedMotion()
  const Tag = onClick ? 'button' : 'div'
  return (
    <motion.div initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <Tag onClick={onClick} className={cn('card glass relative block h-full w-full overflow-hidden p-4 text-left', onClick && 'cursor-pointer transition-transform hover:-translate-y-0.5')}>
        <span aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: tint }} />
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${tint} 22%, transparent)`, color: tint }}><Icon size={22} aria-hidden /></span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-muted">{label}</div>
            <div className="text-2xl font-extrabold leading-tight tracking-tight">{value}</div>
          </div>
        </div>
        <div className="mt-2 flex min-h-5 items-center gap-2 text-xs">
          {delta !== undefined && (
            <span className={cn('inline-flex items-center gap-1 font-bold', delta >= 0 ? 'text-ok' : 'text-bad')}>
              {delta >= 0 ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}{delta >= 0 ? '+' : ''}{delta}%
              <span className="sr-only"> rispetto al mese scorso</span>
            </span>
          )}
          {(deltaLabel || hint) && <span className="text-muted">{deltaLabel ?? hint}</span>}
        </div>
      </Tag>
    </motion.div>
  )
}
