export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse motion-reduce:animate-none bg-sub rounded-row ${className}`} />
}
