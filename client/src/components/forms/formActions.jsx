import { Button } from '../ui/button'
import { TrashIcon, CheckIcon } from '../ui/icons'

// Footer shared by the add/edit forms; Delete shows only when editing
export function FormActions({ onClose, saving, saved = false, submitLabel, onDelete }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      {onDelete && (
        <Button variant="dangerLight" onClick={onDelete} icon={<TrashIcon />}>
          Delete
        </Button>
      )}
      <Button variant="light" onClick={onClose} disabled={saved} className="ml-auto">Cancel</Button>
      <Button type="submit" variant={saved ? 'good' : 'ink'} disabled={saving || saved} aria-live="polite"
        icon={saved && <CheckIcon className="w-4 h-4 motion-pop" />}>
        {saved ? 'Saved' : saving ? 'Saving...' : submitLabel}
      </Button>
    </div>
  )
}

// Label plus helper text on the left, a control on the right
export function ToggleRow({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-sub rounded-row px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
