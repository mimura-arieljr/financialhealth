export const FIELD = 'w-full bg-sub rounded-row px-3.5 h-11 text-base lg:text-sm text-ink placeholder:text-faint outline-none border border-transparent focus:border-cyan-ink focus:ring-2 focus:ring-cyan-ink/20 transition-colors'

export function FieldInput({ label, type = 'text', value, onChange, placeholder, required, min, max, step }) {
  return (
    <label className="block min-w-0">
      {label && <span className="block text-xs font-semibold text-muted mb-1.5">{label}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} min={min} max={max} step={step}
        className={FIELD} />
    </label>
  )
}
