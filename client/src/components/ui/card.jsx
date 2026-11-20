export function Card({ title, subtitle, action, className = '', children }) {
  return (
    <section className={`bg-card rounded-card p-5 min-w-0 ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

// Inner grey panel inside a card
export function Panel({ className = '', children }) {
  return <div className={`bg-sub rounded-panel p-3 ${className}`}>{children}</div>
}
