import type { Types } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import type { IEnrollment } from '../models/Enrollment'
import { Payment } from '../models/Payment'
import { Session } from '../models/Session'
import { User } from '../models/User'
import { notify } from './notify.service'
import { travelMinutes } from './schedule.service'
import { effectiveStartDate, occurrences } from './weekly.service'

const MIN_MS = 60_000
const DAY_MS = 86_400_000
const MIN_LEAD_MS = 2 * 3_600_000
// Plazo para pagar después de que el tutor acepta (y para pagar una renovación)
export const PAYMENT_WINDOW_MS = 48 * 3_600_000

// Las solicitudes aceptadas que no se pagan a tiempo vencen y liberan sus horarios y su cupo.
// Se revisa al consultar o pagar, sin necesidad de un proceso aparte.
export async function expireOverdue(): Promise<void> {
  const now = new Date()
  const overdue = await Enrollment.find({ status: 'awaiting_payment', 'charge.dueAt': { $lt: now } })
  for (const enrollment of overdue) {
    enrollment.status = 'expired'
    enrollment.charge = undefined
    await enrollment.save()
    await notify(
      { user: enrollment.student, type: 'payment_expired', title: 'Plazo de pago vencido', message: `No se pagó a tiempo «${enrollment.offerTitle}»: la solicitud venció. Puedes solicitarla de nuevo.`, link: '/mis-cursos' },
      { user: enrollment.tutor, type: 'payment_expired', title: 'Solicitud vencida', message: `La solicitud en «${enrollment.offerTitle}» venció porque no se pagó a tiempo. Tus horarios quedaron libres.`, link: '/mis-estudiantes' },
    )
  }
  // Una renovación sin pagar simplemente se descarta: el curso sigue activo
  await Enrollment.updateMany({ status: 'active', 'charge.kind': 'renewal', 'charge.dueAt': { $lt: now } }, { $unset: { charge: 1 } })
}

export interface CardCheck {
  ok: boolean
  status?: number
  message?: string
  brand?: string
  last4?: string
}

// Simulación de rechazos: cualquier tarjeta con formato válido se aprueba, salvo las que terminan en
// 0002 (rechazada por el banco), 9995 (fondos insuficientes) o 0069 (tarjeta vencida o bloqueada).
// El número completo y el CVV no se guardan.
const DECLINES: Record<string, string> = {
  '0002': 'Tu banco rechazó el pago. Intenta con otra tarjeta o comunícate con tu banco.',
  '9995': 'Fondos insuficientes en la tarjeta. Intenta con otra tarjeta.',
  '0069': 'La tarjeta está bloqueada o vencida. Usa otra tarjeta.',
}
export function checkCard(body: Record<string, unknown> | undefined): CardCheck {
  const digits = typeof body?.cardNumber === 'string' ? body.cardNumber.replace(/[\s-]/g, '') : ''
  const holder = typeof body?.holder === 'string' ? body.holder.trim() : ''
  const expiry = typeof body?.expiry === 'string' ? body.expiry.trim() : ''
  const cvv = typeof body?.cvv === 'string' ? body.cvv.trim() : ''

  if (!/^\d{13,19}$/.test(digits)) return { ok: false, status: 400, message: 'Escribe un número de tarjeta válido (13 a 19 dígitos).' }
  if (holder.length < 3 || holder.length > 60) return { ok: false, status: 400, message: 'Escribe el nombre que aparece en la tarjeta.' }
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry)
  if (!match) return { ok: false, status: 400, message: 'La fecha de vencimiento debe tener el formato MM/AA.' }
  const lastValidDay = Date.UTC(2000 + Number(match[2]), Number(match[1]), 0, 23, 59, 59)
  if (lastValidDay < Date.now()) return { ok: false, status: 400, message: 'La tarjeta está vencida.' }
  if (!/^\d{3,4}$/.test(cvv)) return { ok: false, status: 400, message: 'El código de seguridad (CVV) debe tener 3 o 4 dígitos.' }

  const brand = digits.startsWith('4') ? 'Visa' : /^(5[1-5]|2[2-7])/.test(digits) ? 'Mastercard' : /^3[47]/.test(digits) ? 'American Express' : 'Tarjeta'
  const last4 = digits.slice(-4)
  const reason = DECLINES[last4]
  if (reason) return { ok: false, status: 402, message: reason, brand, last4 }
  return { ok: true, brand, last4 }
}

type EnrollmentDoc = IEnrollment & { _id: Types.ObjectId }
type Point = { lat: number; lng: number } | null | undefined

// Crea las clases de un bloque pagado (una por cada horario fijo y semana). Si alguna choca con otra clase
// que se agendó mientras tanto, se omite: la inscripción no pierde el cupo y se puede agendar una reposición.
export async function generateBlock(enrollment: EnrollmentDoc, startDate: string): Promise<{ created: number; skipped: number }> {
  if (enrollment.weeklySlots.length === 0 || !enrollment.weeks) return { created: 0, skipped: 0 }
  const [tutor, student] = await Promise.all([User.findById(enrollment.tutor), User.findById(enrollment.student)])
  if (!tutor || !student) return { created: 0, skipped: 0 }

  const duration = enrollment.sessionDurationMin ?? 60
  const starts = occurrences(enrollment.weeklySlots, enrollment.weeks, effectiveStartDate(enrollment.weeklySlots, startDate))
  const first = starts[0]
  const last = starts[starts.length - 1]
  if (first === undefined || last === undefined) return { created: 0, skipped: 0 }

  const range = { $gte: new Date(first - DAY_MS), $lte: new Date(last + DAY_MS) }
  const tutorSessions = await Session.find({ tutor: enrollment.tutor, status: 'scheduled', start: range })
  const studentSessions = await Session.find({ student: enrollment.student, status: 'scheduled', start: range })
  const enrollments = await Enrollment.find({ _id: { $in: tutorSessions.map((item) => item.enrollment) } })
  const modeById = new Map(enrollments.map((item) => [String(item._id), item.mode]))
  const users = await User.find({ _id: { $in: tutorSessions.map((item) => item.student) } })
  const addressById = new Map(users.map((user) => [String(user._id), user.address as Point]))

  const tutorBase: Point = tutor.address
  const here: Point = enrollment.mode === 'student_home' ? student.address : tutorBase
  const busy = tutorSessions.map((item) => ({ start: item.start.getTime(), end: item.start.getTime() + item.durationMin * MIN_MS, where: modeById.get(String(item.enrollment)) === 'student_home' ? addressById.get(String(item.student)) : tutorBase }))
  const mine = studentSessions.map((item) => ({ start: item.start.getTime(), end: item.start.getTime() + item.durationMin * MIN_MS }))

  // No se crean más clases que las que incluye el curso
  const used = await Session.countDocuments({ enrollment: enrollment._id, status: { $in: ['scheduled', 'completed'] } })
  let room = Math.max(0, (enrollment.totalSessions ?? 0) - used)

  let created = 0
  let skipped = 0
  for (const start of starts) {
    const end = start + duration * MIN_MS
    const clash =
      start < Date.now() + MIN_LEAD_MS ||
      busy.some((other) => start < other.end + travelMinutes(other.where, here) * MIN_MS && other.start < end + travelMinutes(here, other.where) * MIN_MS) ||
      mine.some((other) => start < other.end && other.start < end)
    if (clash || room <= 0) {
      skipped++
      continue
    }
    await Session.create({ enrollment: enrollment._id, offer: enrollment.offer, tutor: enrollment.tutor, student: enrollment.student, start: new Date(start), durationMin: duration, createdBy: enrollment.student })
    busy.push({ start, end, where: here })
    mine.push({ start, end })
    room--
    created++
  }
  return { created, skipped }
}

const round2 = (value: number) => Math.round(value * 100) / 100

// Cuando el tutor cancela un curso ya pagado, el estudiante recibe de vuelta la parte del último bloque
// pagado que no se llegó a dar (clases no realizadas ÷ clases del bloque). Devuelve el monto reembolsado.
export async function refundCancelledBlock(enrollment: { _id: Types.ObjectId; cycle?: number; weeks?: number; sessionsPerWeek?: number; totalSessions?: number }): Promise<number> {
  const payment = await Payment.findOne({ enrollment: enrollment._id, status: 'paid' }).sort({ cycle: -1, createdAt: -1 })
  if (!payment || (payment.refundedAmount ?? 0) > 0 || payment.sessions <= 0) return 0
  const perBlock = enrollment.weeks ? enrollment.weeks * (enrollment.sessionsPerWeek ?? 1) : (enrollment.totalSessions ?? payment.sessions)
  const completed = await Session.countDocuments({ enrollment: enrollment._id, status: 'completed' })
  const doneInBlock = Math.min(payment.sessions, Math.max(0, completed - (payment.cycle - 1) * perBlock))
  const remaining = payment.sessions - doneInBlock
  if (remaining <= 0) return 0
  const amount = round2((payment.amount * remaining) / payment.sessions)
  payment.refundedAmount = amount
  payment.refundedAt = new Date()
  await payment.save()
  return amount
}
