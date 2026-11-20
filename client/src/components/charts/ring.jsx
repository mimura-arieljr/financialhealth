// Savings-rate ring: cyan arc for the value, ink tick at the target
export function Ring({ value, target = 20, size = 160, children }) {
  const stroke = 14
  const r = (size - stroke) / 2
  const c = size / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value ?? 0))
  const angle = ((target / 100) * 360 - 90) * (Math.PI / 180)
  const tick = (d) => [c + Math.cos(angle) * d, c + Math.sin(angle) * d]
  const [x1, y1] = tick(r - stroke / 2 - 3)
  const [x2, y2] = tick(r + stroke / 2 + 3)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={value === null || value === undefined ? 'No savings data' : `Saving ${value}% of income, target ${target}%`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#F4F6F8" strokeWidth={stroke} />
        {pct > 0 && (
          <circle cx={c} cy={c} r={r} fill="none" stroke="#00E5F2" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${(circ * pct) / 100} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
        )}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0E1116" strokeWidth={2.5} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
