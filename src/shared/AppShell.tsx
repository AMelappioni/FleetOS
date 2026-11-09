import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Command, FlaskConical, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { ProductAIContext } from '../ai/provider'
import { cn } from '../lib/utils'
import { Companion } from './Companion'
import { CompanionPanel } from './CompanionPanel'
import { CommandPalette } from './CommandPalette'
import { Notifications } from './Notifications'
import { useMood, usePrefs } from './prefs'
import type { NotificationItem, ProductConfig } from './types'
import { Toaster } from './ui'

const STANDALONE = import.meta.env.VITE_STANDALONE === '1'

export function AppShell({ config, ai, notifications, user }: { config: ProductConfig; ai: ProductAIContext; notifications: NotificationItem[]; user: string }) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const [menu, setMenu] = useState(false)
  const [chat, setChat] = useState(false)
  const [cmd, setCmd] = useState(false)
  const names = usePrefs((s) => s.companionNames)
  const dark = usePrefs((s) => s.beautyDark)
  const { mood: pulse, nonce } = useMood()
  const name = names[config.id] || config.companion.defaultName
  const head = ai.headline()
  const mood = pulse !== 'idle' ? pulse : head.mood === 'warning' ? 'idle' : head.mood
  const isHome = pathname === config.basePath || pathname === config.basePath + '/'
  const themeClass = cn(config.themeClass, config.id === 'beauty' && dark && 'dark')

  useEffect(() => { setMenu(false) }, [pathname])
  useEffect(() => { document.title = `${config.name} · Ambiente dimostrativo`; window.scrollTo(0, 0) }, [config.name, pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((o) => !o) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sidebar = (
    <nav aria-label={`Navigazione ${config.name}`} className="flex h-full flex-col gap-1 p-4">
      <NavLink to={config.basePath} end className="mb-5 flex items-center gap-3 px-2 py-1" style={{ color: '#fff' }}>
        {config.logo}
        <span><span className="block text-xl font-extrabold leading-tight tracking-tight">{config.name}</span><span className="block text-xs" style={{ color: 'var(--side-text)' }}>{config.tagline}</span></span>
      </NavLink>
      {config.nav.map((n) => (
        <NavLink key={n.path} to={`${config.basePath}${n.path}`} end={n.path === ''}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors', isActive ? 'text-white' : 'hover:bg-white/5')}
          style={({ isActive }) => ({ background: isActive ? 'var(--side-active)' : undefined, color: isActive ? '#fff' : 'var(--side-text)', boxShadow: isActive ? 'inset 3px 0 0 var(--accent)' : undefined })}>
          <n.icon size={18} aria-hidden />{n.label}
        </NavLink>
      ))}
      <div className="mt-auto rounded-xl border border-white/10 p-3 text-xs" style={{ color: 'var(--side-text)' }}>
        <div className="mb-1 flex items-center gap-1.5 font-bold text-white"><FlaskConical size={13} aria-hidden />Demo · v{config.version}</div>
        Dati simulati, salvati solo in questo browser.
        {!STANDALONE && <NavLink to="/" className="mt-2 block font-semibold underline" style={{ color: '#fff' }}>Cambia verticale</NavLink>}
      </div>
    </nav>
  )

  return (
    <div className={cn(themeClass, 'min-h-screen')}>
      <a href="#main" className="skip-link">Salta al contenuto</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] lg:block" style={{ background: 'var(--side)' }}>{sidebar}</aside>
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenu(false)} />
            <motion.aside className="absolute inset-y-0 left-0 w-[270px] overflow-auto" style={{ background: 'var(--side)' }} initial={{ x: reduce ? 0 : -40 }} animate={{ x: 0 }} exit={{ x: -30 }} transition={{ duration: 0.22 }}>
              <button className="absolute right-3 top-3 btn btn-ghost btn-sm" style={{ color: '#fff' }} onClick={() => setMenu(false)} aria-label="Chiudi menu"><X size={18} /></button>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line px-4 py-2.5 backdrop-blur md:px-6" style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}>
          <button className="btn btn-ghost !p-2.5 lg:hidden" onClick={() => setMenu(true)} aria-label="Apri menu di navigazione" aria-expanded={menu}><Menu size={20} /></button>
          <span className="badge badge-warn hidden sm:inline-flex" role="note"><FlaskConical size={12} aria-hidden />Ambiente dimostrativo · dati simulati</span>
          <span className="badge badge-warn sm:hidden" role="note">Demo · dati simulati</span>
          {!isHome && (
            <div className="mx-auto flex items-center gap-2">
              <Companion config={config.companion} name={name} mood={mood} nonce={nonce} size={52} onClick={() => setChat(true)} />
              <span className="hidden text-sm font-semibold md:block">{name}<span className="block text-xs font-normal text-muted">Clicca per chiedere</span></span>
            </div>
          )}
          <div className={cn('flex items-center gap-1.5', isHome && 'ml-auto')}>
            <button className="btn btn-sm hidden md:inline-flex" onClick={() => setCmd(true)} aria-label="Apri ricerca comandi (Ctrl o Cmd + K)"><Command size={14} />Cerca<kbd className="rounded border border-line px-1 text-[11px] text-muted">⌘K</kbd></button>
            <Notifications items={notifications} />
            <span className="ml-1 hidden items-center gap-2 rounded-full border border-line bg-surface px-2 py-1 text-sm font-semibold sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: config.id === 'beauty' ? '#fff' : 'var(--accent-fg)' }}>{user[0]}</span>{user}
            </span>
          </div>
        </header>

        {isHome && (
          <section aria-label={`Assistente ${name}`} className="relative overflow-hidden" style={{ background: 'var(--hero)' }}>
            <div className="mx-auto flex max-w-[1500px] flex-col items-center px-4 pt-3 md:px-8 lg:flex-row lg:justify-center lg:gap-4">
              <div className="hidden flex-1 lg:block">
                <p className="text-sm font-semibold text-muted">Lunedì 9 novembre 2026</p>
                <h1 className="text-3xl font-extrabold tracking-tight">{config.name}<span className="text-accent">.</span></h1>
                <p className="max-w-xs text-sm text-muted">{config.tagline}</p>
              </div>
              <Companion config={config.companion} name={name} mood={mood} nonce={nonce} size={236} onClick={() => setChat(true)} />
              <div className="flex flex-1 justify-center pb-3 lg:justify-start lg:pb-0">
                <motion.div key={head.text} initial={{ opacity: 0, x: reduce ? 0 : -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                  className="card glass relative max-w-sm px-5 py-4 lg:-ml-2" role="status">
                  <span aria-hidden className="absolute -left-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-line lg:block" style={{ background: 'var(--surface)' }} />
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-accent">{name} · {config.companion.role}</p>
                  <p className="text-[15px] font-semibold leading-snug">{head.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ai.quickActions().slice(0, 1).map((a) => (
                      <button key={a.id} className="btn btn-primary btn-sm" onClick={() => { const o = a.run(); useMood.getState().react('success'); void o }}>{a.label}</button>
                    ))}
                    <button className="btn btn-sm" onClick={() => setChat(true)}>Chiedi a {name}</button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted">Simulazione locale, nessun modello AI collegato.</p>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        <main id="main" tabIndex={-1} className={cn('mx-auto max-w-[1500px] px-4 pb-16 md:px-8', isHome ? 'pt-4' : 'pt-6')}>
          <Outlet />
        </main>
      </div>

      <CompanionPanel open={chat} onClose={() => setChat(false)} name={name} role={config.companion.role} ai={ai} />
      <CommandPalette open={cmd} onClose={() => setCmd(false)} nav={config.nav} basePath={config.basePath} actions={ai.quickActions()} />
      <Toaster />
    </div>
  )
}
