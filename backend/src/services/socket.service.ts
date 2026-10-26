import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { env } from '../config/env'
import { markRead, sendMessage, setIo, userRoom } from './chat.service'
import { verifyToken } from './token.service'

// Canal en tiempo real: cada persona entra a su sala privada con su JWT (handshake.auth.token) y recibe
// los mensajes nuevos y las confirmaciones de lectura. También puede enviar y marcar leído por el socket.
export function attachSocket(server: HttpServer): Server {
  const io = new Server(server, { cors: { origin: env.clientUrl } })
  setIo(io)

  io.use((socket, next) => {
    try {
      const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : ''
      socket.data.userId = verifyToken(token).sub
      next()
    } catch {
      next(new Error('Sesión inválida o expirada'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    void socket.join(userRoom(userId))

    socket.on('message:send', async (payload: { conversationId?: string; text?: string }, ack?: (result: unknown) => void) => {
      const result = await sendMessage(String(payload?.conversationId ?? ''), userId, payload?.text)
      ack?.(result.ok ? { ok: true, message: result.value } : { ok: false, message: result.message })
    })
    socket.on('messages:read', async (payload: { conversationId?: string }, ack?: (result: unknown) => void) => {
      const result = await markRead(String(payload?.conversationId ?? ''), userId)
      ack?.(result.ok ? { ok: true } : { ok: false, message: result.message })
    })
  })
  return io
}
