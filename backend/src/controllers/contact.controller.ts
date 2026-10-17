import type { Request, Response } from 'express'
import { CONTACT_SUBJECTS, ContactMessage } from '../models/ContactMessage'
import type { ContactSubject } from '../models/ContactMessage'

interface ContactBody {
  name?: unknown
  email?: unknown
  subject?: unknown
  message?: unknown
  website?: unknown // campo señuelo: las personas no lo ven, los bots suelen llenarlo
}

type FieldErrors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateContact(body: ContactBody): { errors: FieldErrors; data?: { name: string; email: string; subject: ContactSubject; message: string } } {
  const name = asText(body.name)
  const email = asText(body.email)
  const subject = asText(body.subject)
  const message = asText(body.message)
  const errors: FieldErrors = {}

  if (name.length < 2 || name.length > 80) errors.name = 'Escribe tu nombre (entre 2 y 80 caracteres).'
  if (!EMAIL_REGEX.test(email) || email.length > 120) errors.email = 'Escribe un correo electrónico válido.'
  if (!CONTACT_SUBJECTS.includes(subject as ContactSubject)) errors.subject = 'Selecciona un motivo de contacto.'
  if (message.length < 10 || message.length > 2000) errors.message = 'El mensaje debe tener entre 10 y 2000 caracteres.'

  if (Object.keys(errors).length > 0) return { errors }
  return { errors, data: { name, email, subject: subject as ContactSubject, message } }
}

export async function createContactMessage(req: Request<unknown, unknown, ContactBody>, res: Response): Promise<void> {
  const body = req.body ?? {}

  // Si el campo señuelo viene lleno, se responde con éxito sin guardar nada
  if (asText(body.website) !== '') {
    res.status(201).json({ message: 'Mensaje enviado' })
    return
  }

  const { errors, data } = validateContact(body)
  if (!data) {
    res.status(400).json({ message: 'Revisa los datos del formulario.', errors })
    return
  }

  await ContactMessage.create(data)
  res.status(201).json({ message: 'Mensaje enviado' })
}
