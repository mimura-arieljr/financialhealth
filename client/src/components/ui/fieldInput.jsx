export function FieldInput({ label, type = 'text', value, onChange, placeholder, required, min, max, step }) {
  return (
    <div className="min-w-0">
      {label && <label className="block text-xs text-neutral-400 mb-1.5">{label}</label>}
      <div className="w-full overflow-hidden bg-neutral-800 border border-neutral-700 rounded-lg focus-within:border-accent-500 focus-within:ring-1 focus-within:ring-accent-500/50 transition-colors">
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required} min={min} max={max} step={step}
          className="w-full bg-transparent border-0 px-3 py-2 text-base md:text-sm text-white placeholder-neutral-600 focus:outline-none" />
      </div>
    </div>
  )
}