import { fmt } from '../../lib/utils'

const money = (v) => `${v < 0 ? '−' : ''}₱${fmt(Math.abs(v))}`

export function ChartTooltip({ active, payload, label, format = money }) {
  if (!active || !payload?.length) return null
  const rows = payload.filter(p => p.value !== null && p.value !== undefined)
  if (!rows.length) return null
  return (
    <div className="bg-card rounded-[12px] px-3 py-2 shadow-[0_8px_24px_rgba(14,17,22,0.14)] text-xs min-w-36">
      {label && <p className="text-muted mb-1">{label}</p>}
      {rows.map(p => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-[3px] shrink-0" style={{ background: p.payload?.color || p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tnum">{format(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// Legend for charts with two or more series
export function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
      {items.map(i => (
        <span key={i.name} className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-[3px] ${i.className || ''}`} style={i.color ? { background: i.color } : undefined} />
          {i.name}
        </span>
      ))}
    </div>
  )
}
