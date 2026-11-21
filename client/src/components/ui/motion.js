import { createContext } from 'react'

// Exit animations run this long before the overlay unmounts
export const EXIT_MS = 180
// How long the Saved tick shows before the modal closes
export const SAVED_MS = 600

// Lets anything inside a modal close it with the exit animation
export const ModalContext = createContext(null)
