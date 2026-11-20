import { Link, NavLink } from 'react-router-dom'
import { SparkleIcon, GearIcon } from '../ui/icons'
import { ShellSlotTarget } from './shellSlot'

const TABS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/expenses', label: 'Expenses' },
  { to: '/revenues', label: 'Revenues' },
  { to: '/recurring', label: 'Recurring' },
  { to: '/transfers', label: 'Transfers' },
  { to: '/analytics', label: 'Analytics' },
]

const ROUND = 'w-10 h-10 rounded-full grid place-items-center shrink-0 transition-colors'

export function LogoPill() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 bg-card rounded-full pl-1.5 pr-4 max-[379px]:pr-1.5 h-11 font-bold text-[15px] tracking-tight shrink-0">
      <span className="w-8 h-8 rounded-full bg-hero grid place-items-center">
        <img src="/fundora_logo.svg" alt="" className="w-5 h-5" />
      </span>
      <span className="max-[379px]:sr-only">Fundora</span>
    </Link>
  )
}

export function TopBar({ email }) {
  return (
    <header className="max-w-[1320px] mx-auto px-4 lg:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:pt-5 pb-4 lg:pb-6 flex items-center justify-between gap-3">
      <LogoPill />

      <nav aria-label="Main" className="hidden lg:flex bg-card rounded-full p-1.5 gap-0.5">
        {TABS.map(t => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `px-4 h-9 inline-flex items-center rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-ink text-white' : 'text-[#4B5563] hover:text-ink hover:bg-sub'}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="hidden lg:flex items-center gap-2 min-w-0">
        <NavLink to="/ai" aria-label="AI Chat" title="AI Chat"
          className={({ isActive }) => `${ROUND} bg-ink text-cyan ${isActive ? 'ring-2 ring-cyan-ink ring-offset-2 ring-offset-canvas' : 'hover:bg-ink/85'}`}>
          <SparkleIcon className="w-5 h-5" />
        </NavLink>
        <NavLink to="/settings" aria-label="Settings" title="Settings"
          className={({ isActive }) => `${ROUND} ${isActive ? 'bg-ink text-white' : 'bg-card hover:bg-sub'}`}>
          <GearIcon className="w-5 h-5" />
        </NavLink>
        <div className="flex items-center gap-2 bg-card rounded-full pl-1 pr-4 h-10 min-w-0 max-w-[240px]">
          <span className="w-8 h-8 rounded-full bg-mark-bg text-cyan-ink grid place-items-center text-xs font-bold shrink-0">
            {(email || '?').charAt(0).toUpperCase()}
          </span>
          <span className="text-xs text-muted truncate">{email}</span>
        </div>
      </div>

      {/* Mobile: the page's month switcher, or the AI button when the page has none */}
      <div className="lg:hidden flex items-center gap-2 min-w-0">
        <ShellSlotTarget className="peer empty:hidden" />
        <Link to="/ai" aria-label="AI Chat" className={`${ROUND} hidden peer-empty:grid bg-ink text-cyan`}>
          <SparkleIcon className="w-5 h-5" />
        </Link>
      </div>
    </header>
  )
}
