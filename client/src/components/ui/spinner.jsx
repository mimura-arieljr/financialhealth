// Twin-orbit loader; the dots take the text colour (cyan by default)
export function Spinner({ size = 'w-4 h-4', tone = 'text-cyan-stroke', label = 'Loading' }) {
  return (
    <span role="status" className={`relative inline-block aspect-square rounded-full bg-current ${size} ${tone}`}>
      <span aria-hidden="true" className="twin-orbit absolute inset-0 rounded-full bg-current" />
      <span aria-hidden="true" className="twin-orbit twin-orbit-late absolute inset-0 rounded-full bg-current" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

// Centred spinner for a page or a card that is still loading
export function Loading({ className = 'min-h-[60vh]' }) {
  return <div className={`grid place-items-center ${className}`}><Spinner /></div>
}
