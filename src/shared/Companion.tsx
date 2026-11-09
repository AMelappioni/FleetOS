import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import type { CompanionConfig, Mood } from './types'

const clamp = (v: number, a = -1, b = 1) => Math.max(a, Math.min(b, v))

/** Personaggio di riserva (SVG originale) usato solo se l'immagine non è disponibile. */
function FallbackAvatar({ id }: { id: CompanionConfig['id'] }) {
  const c = id === 'lumi' ? ['#c4a1f5', '#f9a8d4'] : id === 'nexo' ? ['#c026d3', '#22d3ee'] : ['#f59e0b', '#38bdf8']
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Avatar assistente">
      <defs><linearGradient id={`fb-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={c[1]} /></linearGradient></defs>
      <circle cx="100" cy="106" r="70" fill={`url(#fb-${id})`} />
      <rect x="52" y="86" width="96" height="50" rx="25" fill="#0b0a1c" />
      <ellipse cx="80" cy="111" rx="9" ry="14" fill="#67e8f9" /><ellipse cx="120" cy="111" rx="9" ry="14" fill="#67e8f9" />
      <path d="M88 138q12 8 24 0" stroke="#67e8f9" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Companion({ config, name, mood, nonce, size = 220, onClick, bare }: {
  config: CompanionConfig; name: string; mood: Mood; nonce: number; size?: number; onClick?: () => void; bare?: boolean
}) {
  const reduce = useReducedMotion()
  const tiltRef = useRef<HTMLDivElement>(null)
  const eyesRef = useRef<SVGGElement>(null)
  const boxRef = useRef<HTMLButtonElement>(null)
  const [blink, setBlink] = useState(false)
  const [failed, setFailed] = useState(false)
  const [poke, setPoke] = useState(0)

  // Tracking del mouse: movimento contenuto e smorzato (lerp), disattivato con prefers-reduced-motion.
  useEffect(() => {
    if (reduce) return
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0
    const onMove = (e: PointerEvent) => {
      const r = boxRef.current?.getBoundingClientRect()
      if (!r) return
      tx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.45))
      ty = clamp((e.clientY - (r.top + r.height * 0.35)) / (window.innerHeight * 0.45))
    }
    const tick = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      if (tiltRef.current) tiltRef.current.style.transform = `perspective(700px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translate(${x * 5}px, ${y * 3}px)`
      if (eyesRef.current && config.eyes) eyesRef.current.style.transform = `translate(${x * config.eyes.travel}px, ${y * config.eyes.travel * 0.65}px)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [reduce, config.eyes])

  // Blink periodico (irregolare ma deterministico).
  useEffect(() => {
    if (reduce || !config.eyes) return
    let t: ReturnType<typeof setTimeout>
    let i = 0
    const loop = () => {
      setBlink(true)
      setTimeout(() => setBlink(false), 140)
      t = setTimeout(loop, 3200 + ((i++ * 1370) % 2600))
    }
    t = setTimeout(loop, 2400)
    return () => clearTimeout(t)
  }, [reduce, config.eyes])

  const glow = mood === 'warning' ? '#fbbf24' : mood === 'success' ? '#4ade80' : config.eyes?.glow
  const anim = reduce ? undefined
    : mood === 'success' ? 'bounce-ok .7s ease'
    : mood === 'warning' ? 'shake-warn .55s ease'
    : poke ? 'wiggle .5s ease' : 'breathe 5.5s ease-in-out infinite'

  const label = `${name}, ${config.role}. ${onClick ? 'Apri la conversazione' : ''}`
  return (
    <button ref={boxRef} type="button" onClick={() => { setPoke((p) => p + 1); onClick?.() }} aria-label={label}
      className={cn('group relative block shrink-0 cursor-pointer rounded-3xl', bare ? '' : '')} style={{ width: size, height: size }}>
      <span aria-hidden className="absolute inset-x-6 bottom-2 h-6 rounded-full blur-xl opacity-60 transition-opacity group-hover:opacity-90" style={{ background: 'radial-gradient(closest-side, var(--accent), transparent)' }} />
      <div key={`${mood}-${nonce}-${poke}`} className="relative h-full w-full" style={{ animation: anim }}>
        <div ref={tiltRef} className="relative h-full w-full will-change-transform" style={{ transformOrigin: '50% 80%' }}>
          {failed ? <FallbackAvatar id={config.id} /> : (
            <>
              <img src={config.image} alt="" draggable={false} onError={() => setFailed(true)} className="h-full w-full select-none object-contain" style={{ objectPosition: config.objectPosition, filter: 'drop-shadow(0 14px 22px rgba(0,0,0,.28))' }} />
              {config.eyes && (
                <svg viewBox="0 0 1024 1024" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                  <defs><filter id={`soft-${config.id}`}><feGaussianBlur stdDeviation="3.5" /></filter><filter id={`glow-${config.id}`}><feGaussianBlur stdDeviation="5" /></filter></defs>
                  {config.eyes.spec.map((e, i) => <ellipse key={`p${i}`} cx={e.cx} cy={e.cy} rx={e.rx * 1.55} ry={e.ry * 1.3} fill={config.eyes!.patch} filter={`url(#soft-${config.id})`} />)}
                  <g ref={eyesRef}>
                    {config.eyes.spec.map((e, i) => (
                      <g key={i} style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: blink ? 'scaleY(.08)' : 'scaleY(1)', transition: 'transform .09s ease' }}>
                        <ellipse cx={e.cx} cy={e.cy} rx={e.rx * 1.15} ry={e.ry * 1.1} fill={glow} opacity=".55" filter={`url(#glow-${config.id})`} />
                        <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={glow} style={{ transition: 'fill .25s' }} />
                        <ellipse cx={e.cx - e.rx * 0.25} cy={e.cy - e.ry * 0.35} rx={e.rx * 0.3} ry={e.ry * 0.28} fill="#fff" opacity=".7" />
                      </g>
                    ))}
                  </g>
                </svg>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  )
}
