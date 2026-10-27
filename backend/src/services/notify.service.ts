import type { Types } from 'mongoose'
import { User } from '../models/User'
import { Notification } from '../models/Notification'
import type { NotificationType } from '../models/Notification'

// Fecha legible en hora de Guatemala: "mié 21 oct, 3:00 p. m."
export function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date)
}

export async function userName(id: Types.ObjectId | string): Promise<string> {
  return (await User.findById(id))?.name ?? 'Alguien'
}

interface NotifyInput {
  user: Types.ObjectId | string
  type: NotificationType
  title: string
  message: string
  link: string
}

// Los avisos son un extra: si fallan al guardarse, la acción principal no debe romperse
export async function notify(...items: NotifyInput[]): Promise<void> {
  try {
    if (items.length > 0) await Notification.insertMany(items)
  } catch (error) {
    console.error('No se pudo guardar la notificación', error)
  }
}

// Avisa a todos los administradores (denuncias, apelaciones, perfiles de tutor por revisar, mensajes de contacto)
export async function notifyAdmins(input: Omit<NotifyInput, 'user'>): Promise<void> {
  const admins = await User.find({ role: 'admin' }).select('_id')
  await notify(...admins.map((admin) => ({ user: admin._id, ...input })))
}
