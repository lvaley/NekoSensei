import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Notification } from '../models/Notification'

function view(item: InstanceType<typeof Notification>) {
  return { id: String(item._id), type: item.type, title: item.title, message: item.message, link: item.link, read: item.read, createdAt: item.createdAt }
}

// Últimos avisos del usuario y cuántos están sin leer
export async function listNotifications(req: Request, res: Response): Promise<void> {
  const [items, unread] = await Promise.all([Notification.find({ user: req.auth?.sub }).sort({ createdAt: -1 }).limit(30), Notification.countDocuments({ user: req.auth?.sub, read: false })])
  res.json({ notifications: items.map(view), unread })
}

export async function markNotificationRead(req: Request<{ id: string }>, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Notificación no encontrada' })
    return
  }
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.auth?.sub }, { $set: { read: true } }, { new: true })
  if (!item) {
    res.status(404).json({ message: 'Notificación no encontrada' })
    return
  }
  res.json({ notification: view(item) })
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  await Notification.updateMany({ user: req.auth?.sub, read: false }, { $set: { read: true } })
  res.json({ unread: 0 })
}
