export function DayGroup({ label, total, children }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="flex items-center justify-between px-1 mb-1.5 text-xs font-semibold text-muted">
        <span>{label}</span>
        <span className="tnum">{total}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}
