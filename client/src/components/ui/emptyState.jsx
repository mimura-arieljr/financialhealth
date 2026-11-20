export function EmptyState({ title, body, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center text-center py-10 px-6 ${className}`}>
      <p className="text-sm font-semibold">{title}</p>
      {body && <p className="text-xs text-muted mt-1 max-w-xs leading-relaxed">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
