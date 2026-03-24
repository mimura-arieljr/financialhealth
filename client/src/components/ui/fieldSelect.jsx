export function FieldSelect({ label, value, onChange, children, required }) {
  return (
    <div>
      {label && <label className="block text-xs text-neutral-400 mb-1.5">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors appearance-none">
        {children}
      </select>
    </div>
  )
}
