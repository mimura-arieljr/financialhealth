export function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-ink ${checked ? 'bg-cyan' : 'bg-line'}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4 bg-ink' : 'bg-card'}`} />
    </button>
  )
}
