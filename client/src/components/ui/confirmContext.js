import { createContext } from 'react'

// confirm({ title, body, confirmLabel, tone }) resolves true when the person confirms
export const ConfirmContext = createContext(null)

// Standard wording for deleting one named thing
export const deletePrompt = (noun, name) => ({
  title: `Delete ${noun}?`,
  body: name ? `“${name}” will be deleted. This can't be undone.` : "This can't be undone.",
  confirmLabel: 'Delete',
})
