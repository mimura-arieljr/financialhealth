import { IconButton } from './button'
import { EditIcon, TrashIcon } from './icons'

// Edit and delete that appear on row hover (desktop); mobile rows open the editor on tap instead
export function RowActions({ name, onEdit, onDelete, deleting = false }) {
  return (
    <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
      <IconButton label={`Edit ${name}`} size="w-8 h-8" variant="white" onClick={onEdit}><EditIcon className="w-3.5 h-3.5" /></IconButton>
      <IconButton label={`Delete ${name}`} size="w-8 h-8" variant="white" className="text-alert" disabled={deleting} onClick={onDelete}><TrashIcon className="w-3.5 h-3.5" /></IconButton>
    </div>
  )
}
