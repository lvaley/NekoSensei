import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'
import { api, TOKEN_KEY } from '../services/api'
import type { ChatMessage } from '../types'
import { ChatContext } from './chat-context'

// El socket vive en el mismo servidor que la API (sin el sufijo /api)
const SOCKET_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/api\/?$/, '')

// Mantiene la conexión en tiempo real del estudiante o tutor con sesión y el contador de mensajes sin leer
export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user && (user.role === 'student' || user.role === 'tutor') ? user.id : null
  const [unread, setUnread] = useState(0)

  const socket = useMemo(() => {
    if (!userId) return null
    return io(SOCKET_URL, { autoConnect: false, auth: (callback) => callback({ token: localStorage.getItem(TOKEN_KEY) ?? '' }) })
  }, [userId])

  const refreshUnread = useCallback(() => {
    if (!userId) return
    api
      .get<{ count: number }>('/conversations/unread-count')
      .then((res) => setUnread(res.data.count))
      .catch(() => undefined)
  }, [userId])

  useEffect(() => {
    if (!socket || !userId) return
    const onNew = (message: ChatMessage) => {
      if (message.senderId !== userId) refreshUnread()
    }
    socket.on('message:new', onNew)
    socket.on('connect', refreshUnread)
    socket.connect()
    const first = window.setTimeout(refreshUnread, 0)
    return () => {
      window.clearTimeout(first)
      socket.off('message:new', onNew)
      socket.off('connect', refreshUnread)
      socket.disconnect()
    }
  }, [socket, userId, refreshUnread])

  const value = useMemo(() => ({ socket, unread: userId ? unread : 0, refreshUnread }), [socket, unread, userId, refreshUnread])
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
