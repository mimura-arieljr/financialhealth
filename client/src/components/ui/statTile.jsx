export function StatTile({ label, icon, value, hero = false, footer, valueClassName = '', className = '' }) {
  return (
    <div className={`rounded-[18px] p-4 flex flex-col justify-between gap-3 min-h-[128px] min-w-0 ${hero ? 'bg-hero' : 'bg-sub'} ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[13px] font-semibold">
        <span className="truncate">{label}</span>
        {icon && <span className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${hero ? 'bg-white/55' : 'bg-card'}`}>{icon}</span>}
      </div>
      <div className={`text-[22px] lg:text-2xl font-bold tracking-tight tnum truncate ${valueClassName}`}>{value}</div>
      {footer && <div className={`text-xs flex items-center gap-1.5 min-h-5 ${hero ? 'text-[#155E75]' : 'text-muted'}`}>{footer}</div>}
    </div>
  )
}
