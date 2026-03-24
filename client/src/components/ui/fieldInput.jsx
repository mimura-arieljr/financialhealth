export function FieldInput({ label, type = 'text', value, onChange, placeholder, required, min, max, step }) {
  return (
    <div>
      {label && <label className="block text-xs text-neutral-400 mb-1.5">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} min={min} max={max} step={step}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors" />
    </div>
  )
}