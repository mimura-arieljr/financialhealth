import { Link } from 'react-router-dom'
import { deltaTone } from '../../lib/utils'

const TONES = {
  neutral: 'bg-sub text-[#374151]',
  good: 'bg-good-bg text-good',
  alert: 'bg-alert-bg text-alert',
  warn: 'bg-warn-bg text-warn',
  mark: 'bg-mark-bg text-cyan-ink',
  cyan: 'bg-cyan text-ink',
  ink: 'bg-ink text-white',
}

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}

const DOTS = { good: 'bg-good', alert: 'bg-alert', warn: 'bg-warn', cyan: 'bg-cyan-stroke', ink: 'bg-ink', neutral: 'bg-faint' }

// Dot plus text, no pill, so it reads as a fact rather than a button; links when `to` is set
export function Chip({ dot = 'ink', to, children }) {
  const cls = 'inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#374151] whitespace-nowrap'
  const body = <><span className={`w-2 h-2 rounded-full ${DOTS[dot]}`} />{children}</>
  if (to) return <Link to={to} className={`${cls} hover:text-ink hover:underline underline-offset-4`}>{body}</Link>
  return <span className={cls}>{body}</span>
}

// Change pill coloured by meaning: green for good news, red for bad, grey for no change
const DELTA = { good: 'bg-good-bg text-good', bad: 'bg-alert-bg text-alert' }

export function DeltaPill({ pct, goodWhen, suffix, onDark = false, className = '' }) {
  const tone = deltaTone(pct, goodWhen)
  if (!tone) return null
  const arrow = pct > 0 ? '↑ ' : pct < 0 ? '↓ ' : ''
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <span className={`rounded-full px-2 py-0.5 font-bold tnum ${DELTA[tone] ?? (onDark ? 'bg-white/15 text-white' : 'bg-white/70 text-muted')}`}>
        {arrow}{Math.abs(pct)}%
      </span>
      {suffix && <span>{suffix}</span>}
    </span>
  )
}
