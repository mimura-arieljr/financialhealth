import { FIELD } from './fieldInput'

export function FieldSelect({ label, value, onChange, children, required }) {
  return (
    <label className="block min-w-0">
      {label && <span className="block text-xs font-semibold text-muted mb-1.5">{label}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className={`${FIELD} select-chevron`}>
        {children}
      </select>
    </label>
  )
}
