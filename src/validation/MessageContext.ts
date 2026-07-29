import { createContext, useContext } from 'react'
import { defaultMessages, MessageMap } from './messages'

// Render-time access to the map a form resolved. The validators do NOT read
// this - they run outside rendering and take the map from `withMessages` - it
// is here so components that render their own copy of a message use the same
// wording the schema was built with.
export const MessageContext = createContext<MessageMap>(defaultMessages)

export const useMessages = () => useContext(MessageContext)
