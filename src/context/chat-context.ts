import { createContext } from 'react'
import type { Socket } from 'socket.io-client'

export interface ChatContextValue {
  // Canal en tiempo real (null si no hay sesión de estudiante o tutor)
  socket: Socket | null
  // Mensajes sin leer entre todas las conversaciones
  unread: number
  refreshUnread: () => void
}

export const ChatContext = createContext<ChatContextValue>({ socket: null, unread: 0, refreshUnread: () => undefined })
