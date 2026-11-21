// Twin-orbit loader; the dots take the text colour (cyan by default)
export function Spinner({ size = 'w-3 h-3', tone = 'text-cyan-stroke', label = 'Loading' }) {
  return (
    <span role="status" className={`relative inline-block aspect-square rounded-full bg-current ${size} ${tone}`}>
      <span aria-hidden="true" className="twin-orbit absolute inset-0 rounded-full bg-current" />
      <span aria-hidden="true" className="twin-orbit twin-orbit-late absolute inset-0 rounded-full bg-current" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

// Centred spinner for a page or a card that is still loading
export function Loading({ className = 'py-16' }) {
  return <div className={`grid place-items-center ${className}`}><Spinner /></div>
}
