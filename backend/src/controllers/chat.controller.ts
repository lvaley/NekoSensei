import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Conversation } from '../models/Conversation'
import { Enrollment } from '../models/Enrollment'
import { Message } from '../models/Message'
import { User } from '../models/User'
import { loadConversation, markRead, messageView, sendMessage } from '../services/chat.service'

const PAGE = 50

// Mis conversaciones: la otra persona, el último mensaje y cuántos mensajes tengo sin leer
export async function listConversations(req: Request, res: Response): Promise<void> {
  const me = req.auth?.sub as string
  const conversations = await Conversation.find({ $or: [{ student: me }, { tutor: me }], lastMessageAt: { $ne: null } }).sort({ lastMessageAt: -1 }).limit(100)
  const otherIds = conversations.map((item) => (String(item.student) === me ? item.tutor : item.student))
  const users = await User.find({ _id: { $in: otherIds } })
  const byId = new Map(users.map((user) => [String(user._id), user]))
  const unread = await Message.find({ conversation: { $in: conversations.map((item) => item._id) }, sender: { $ne: me }, readAt: null }).select('conversation')
  const unreadBy = new Map<string, number>()
  for (const message of unread) unreadBy.set(String(message.conversation), (unreadBy.get(String(message.conversation)) ?? 0) + 1)

  res.json({
    conversations: conversations.map((item, index) => {
      const other = byId.get(String(otherIds[index]))
      return { id: String(item._id), other: { id: String(otherIds[index]), name: other?.name ?? 'Usuario', picture: other?.picture }, lastText: item.lastText, lastMessageAt: item.lastMessageAt, unread: unreadBy.get(String(item._id)) ?? 0 }
    }),
  })
}

// Total de mensajes sin leer (globito del menú)
export async function unreadCount(req: Request, res: Response): Promise<void> {
  const me = req.auth?.sub as string
  const mine = await Conversation.find({ $or: [{ student: me }, { tutor: me }] }).select('_id')
  const count = await Message.countDocuments({ conversation: { $in: mine.map((item) => item._id) }, sender: { $ne: me }, readAt: null })
  res.json({ count })
}

// Abre (o crea) la conversación con otra persona. El estudiante puede escribirle a cualquier tutor aprobado
// (para resolver dudas antes de inscribirse); el tutor solo a estudiantes que tengan o hayan tenido un curso con él.
export async function openConversation(req: Request, res: Response): Promise<void> {
  const me = req.auth?.sub as string
  const targetId = typeof req.body?.userId === 'string' ? req.body.userId : ''
  const target = isValidObjectId(targetId) && targetId !== me ? await User.findById(targetId) : null
  const asStudent = req.auth?.role === 'student'

  let allowed = false
  if (target && asStudent) allowed = target.role === 'tutor' && target.tutorProfile?.status === 'approved'
  else if (target && req.auth?.role === 'tutor') allowed = target.role === 'student' && !!(await Enrollment.exists({ tutor: me, student: target._id }))
  if (!target || !allowed) {
    res.status(404).json({ message: 'No puedes escribirle a esta persona.' })
    return
  }

  const pair = asStudent ? { student: me, tutor: target._id } : { student: target._id, tutor: me }
  const conversation = (await Conversation.findOne(pair)) ?? (await Conversation.create(pair))
  res.json({ id: String(conversation._id), other: { id: String(target._id), name: target.name, picture: target.picture } })
}

// Datos de una conversación (con quién es), también si todavía no tiene mensajes
export async function getConversation(req: Request<{ id: string }>, res: Response): Promise<void> {
  const me = req.auth?.sub as string
  const conversation = await loadConversation(req.params.id, me)
  if (!conversation) {
    res.status(404).json({ message: 'Conversación no encontrada' })
    return
  }
  const otherId = String(conversation.student) === me ? conversation.tutor : conversation.student
  const other = await User.findById(otherId)
  res.json({ id: String(conversation._id), other: { id: String(otherId), name: other?.name ?? 'Usuario', picture: other?.picture } })
}

// Mensajes de una conversación (los más recientes; ?before=<fecha ISO> trae los anteriores)
export async function listMessages(req: Request<{ id: string }>, res: Response): Promise<void> {
  const conversation = await loadConversation(req.params.id, req.auth?.sub as string)
  if (!conversation) {
    res.status(404).json({ message: 'Conversación no encontrada' })
    return
  }
  const before = typeof req.query.before === 'string' && !Number.isNaN(Date.parse(req.query.before)) ? new Date(req.query.before) : null
  const found = await Message.find({ conversation: conversation._id, ...(before ? { createdAt: { $lt: before } } : {}) })
    .sort({ createdAt: -1 })
    .limit(PAGE + 1)
  const page = found.slice(0, PAGE).reverse()
  res.json({ messages: page.map(messageView), hasMore: found.length > PAGE })
}

export async function postMessage(req: Request<{ id: string }>, res: Response): Promise<void> {
  const result = await sendMessage(req.params.id, req.auth?.sub as string, req.body?.text)
  if (!result.ok) {
    res.status(result.status).json({ message: result.message })
    return
  }
  res.status(201).json({ message: result.value })
}

export async function readConversation(req: Request<{ id: string }>, res: Response): Promise<void> {
  const result = await markRead(req.params.id, req.auth?.sub as string)
  if (!result.ok) {
    res.status(result.status).json({ message: result.message })
    return
  }
  res.json(result.value)
}
