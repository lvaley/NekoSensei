import type { Server } from 'socket.io'
import type { Types } from 'mongoose'
import { Conversation } from '../models/Conversation'
import { MAX_MESSAGE, Message } from '../models/Message'

// Servidor de sockets (se asigna al arrancar). Sin él, los mensajes siguen funcionando por HTTP y no hay avisos en vivo.
let io: Server | null = null
export const setIo = (server: Server | null) => {
  io = server
}

export const userRoom = (id: Types.ObjectId | string) => `user:${String(id)}`
export const emitToUser = (id: Types.ObjectId | string, event: string, payload: unknown) => {
  io?.to(userRoom(id)).emit(event, payload)
}

export const messageView = (message: { _id: unknown; conversation: unknown; sender: unknown; text: string; readAt: Date | null; createdAt: Date }) => ({
  id: String(message._id),
  conversationId: String(message.conversation),
  senderId: String(message.sender),
  text: message.text,
  readAt: message.readAt,
  createdAt: message.createdAt,
})

export type ChatResult<T> = { ok: true; value: T } | { ok: false; status: number; message: string }

// La conversación solo la ven sus dos participantes
export async function loadConversation(id: string, userId: string) {
  const conversation = /^[a-f0-9]{24}$/i.test(id) ? await Conversation.findById(id) : null
  if (!conversation || (String(conversation.student) !== userId && String(conversation.tutor) !== userId)) return null
  return conversation
}

// Guarda un mensaje y lo envía en vivo a las dos personas (HTTP y sockets usan esta misma función)
export async function sendMessage(conversationId: string, userId: string, rawText: unknown): Promise<ChatResult<ReturnType<typeof messageView>>> {
  const conversation = await loadConversation(conversationId, userId)
  if (!conversation) return { ok: false, status: 404, message: 'Conversación no encontrada' }
  const text = typeof rawText === 'string' ? rawText.trim() : ''
  if (text.length === 0) return { ok: false, status: 400, message: 'Escribe un mensaje.' }
  if (text.length > MAX_MESSAGE) return { ok: false, status: 400, message: `El mensaje no puede superar ${MAX_MESSAGE} caracteres.` }

  const message = await Message.create({ conversation: conversation._id, sender: userId, text })
  conversation.lastText = text.slice(0, 120)
  conversation.lastMessageAt = message.createdAt
  await conversation.save()

  const view = messageView(message)
  emitToUser(conversation.student, 'message:new', view)
  emitToUser(conversation.tutor, 'message:new', view)
  return { ok: true, value: view }
}

// Marca como leídos los mensajes que la otra persona le envió y se lo avisa en vivo
export async function markRead(conversationId: string, userId: string): Promise<ChatResult<{ read: number }>> {
  const conversation = await loadConversation(conversationId, userId)
  if (!conversation) return { ok: false, status: 404, message: 'Conversación no encontrada' }
  const readAt = new Date()
  const result = await Message.updateMany({ conversation: conversation._id, sender: { $ne: userId }, readAt: null }, { $set: { readAt } })
  const read = result.modifiedCount ?? 0
  if (read > 0) {
    const other = String(conversation.student) === userId ? conversation.tutor : conversation.student
    emitToUser(other, 'messages:read', { conversationId: String(conversation._id), readAt })
  }
  return { ok: true, value: { read } }
}
