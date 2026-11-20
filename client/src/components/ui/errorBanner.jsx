export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="text-alert text-xs font-medium bg-alert-bg rounded-row px-3 py-2 mt-3">
      {message}
    </p>
  )
}
