const VARIANTS = {
  ink: 'bg-ink text-white hover:bg-ink/85',
  light: 'bg-sub text-ink hover:bg-line',
  cyan: 'bg-cyan text-ink hover:brightness-95',
  white: 'bg-card text-ink hover:bg-sub',
  dangerLight: 'bg-sub text-alert hover:bg-alert-bg',
  dangerWhite: 'bg-card text-alert hover:bg-alert-bg',
}
const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-ink'

export function Button({ variant = 'ink', size = 'md', icon, type = 'button', className = '', children, ...rest }) {
  return (
    <button type={type}
      className={`inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none ${FOCUS} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}>
      {icon}{children}
    </button>
  )
}

// Round icon-only button; `label` is required for screen readers
export function IconButton({ label, variant = 'light', size = 'w-9 h-9', type = 'button', className = '', children, ...rest }) {
  return (
    <button type={type} aria-label={label} title={label}
      className={`inline-grid place-items-center rounded-full shrink-0 transition-colors disabled:opacity-50 ${FOCUS} ${VARIANTS[variant]} ${size} ${className}`}
      {...rest}>
      {children}
    </button>
  )
}
