import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import type { Types } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import { Offer } from '../models/Offer'
import { Session } from '../models/Session'
import { User } from '../models/User'
import { formatWhen, notify, userName } from '../services/notify.service'
import { availableSlots } from '../services/schedule.service'
import { toSessionViews } from './sessions.controller'
import type { SessionDoc } from './sessions.controller'

const MIN_MS = 60_000

// Reagendar clases a domicilio: el estudiante lo solicita con un motivo, el tutor propone otro horario
// (o lo rechaza) y el estudiante acepta o rechaza la propuesta.

async function loadSession(req: Request<{ id: string }>, res: Response, who: 'student' | 'tutor') {
  const session = isValidObjectId(req.params.id) ? await Session.findById(req.params.id) : null
  const userId = req.auth?.sub
  const owner = who === 'student' ? session?.student : session?.tutor
  if (!session || String(owner) !== userId) {
    res.status(404).json({ message: 'Clase no encontrada' })
    return null
  }
  if (session.status !== 'scheduled') {
    res.status(409).json({ message: 'Esta clase ya no está programada.' })
    return null
  }
  return session
}

async function respond(res: Response, session: InstanceType<typeof Session>, status = 200) {
  const [view] = await toSessionViews([session as unknown as SessionDoc])
  res.status(status).json({ session: view })
}

type SessionLike = InstanceType<typeof Session>

// ¿Se puede mover la clase a este horario? Con franjas definidas, debe estar entre los horarios compatibles;
// sin franjas (oferta antigua) basta con que no se cruce con otras clases.
async function canMoveTo(session: SessionLike, start: Date): Promise<boolean> {
  const enrollment = await Enrollment.findById(session.enrollment)
  if (!enrollment) return false
  const [offer, tutor, student] = await Promise.all([Offer.findById(enrollment.offer), User.findById(session.tutor), User.findById(session.student)])
  if (!tutor || !student) return false

  const slots = await availableSlots(enrollment as never, offer, tutor, student, start.getTime(), start.getTime(), { checkStudent: true, ignoreSessionId: session._id as Types.ObjectId })
  if (slots !== null) return slots.some((slot) => slot.getTime() === start.getTime())

  const end = start.getTime() + session.durationMin * MIN_MS
  const nearby = await Session.find({ status: 'scheduled', _id: { $ne: session._id }, $or: [{ tutor: session.tutor }, { student: session.student }], start: { $gte: new Date(start.getTime() - 240 * MIN_MS), $lt: new Date(end) } })
  return !nearby.some((other) => other.start.getTime() + other.durationMin * MIN_MS > start.getTime())
}

// Estudiante: pide reagendar una clase a domicilio indicando el motivo
export async function requestReschedule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await loadSession(req, res, 'student')
  if (!session) return
  const enrollment = await Enrollment.findById(session.enrollment)
  if (enrollment?.mode !== 'student_home') {
    res.status(403).json({ message: 'Solo las clases a domicilio se reagendan con solicitud. En las demás, el tutor define los horarios.' })
    return
  }
  if (session.start.getTime() <= Date.now()) {
    res.status(409).json({ message: 'La clase ya comenzó: no se puede reagendar.' })
    return
  }
  if (session.reschedule && ['requested', 'proposed'].includes(session.reschedule.status)) {
    res.status(409).json({ message: 'Esta clase ya tiene una solicitud de reagendar en curso.' })
    return
  }
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
  if (reason.length < 5 || reason.length > 300) {
    res.status(400).json({ message: 'Cuéntale al tutor el motivo (entre 5 y 300 caracteres).' })
    return
  }

  session.reschedule = { status: 'requested', reason, requestedAt: new Date() }
  await session.save()
  await notify({ user: session.tutor, type: 'reschedule_requested', title: 'Solicitud para reagendar', message: `${await userName(session.student)} pide mover la clase del ${formatWhen(session.start)}: «${reason}»`, link: '/agenda' })
  await respond(res, session, 201)
}

// Tutor: horarios en que puede mover la clase según su agenda (franjas, choques y traslado)
export async function rescheduleSlots(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await loadSession(req, res, 'tutor')
  if (!session) return
  if (session.reschedule?.status !== 'requested') {
    res.status(409).json({ message: 'Esta clase no tiene una solicitud de reagendar pendiente.' })
    return
  }
  const enrollment = await Enrollment.findById(session.enrollment)
  const [offer, tutor, student] = await Promise.all([Offer.findById(enrollment?.offer), User.findById(session.tutor), User.findById(session.student)])
  if (!enrollment || !tutor || !student) {
    res.status(404).json({ message: 'Clase no encontrada' })
    return
  }
  const now = Date.now()
  const slots = await availableSlots(enrollment as never, offer, tutor, student, now, now + 45 * 86_400_000, { checkStudent: true, ignoreSessionId: session._id as Types.ObjectId })
  res.json({ hasSchedule: slots !== null, durationMin: session.durationMin, slots: (slots ?? []).map((slot) => slot.toISOString()) })
}

// Tutor: propone un nuevo horario para la clase
export async function proposeReschedule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await loadSession(req, res, 'tutor')
  if (!session) return
  if (session.reschedule?.status !== 'requested') {
    res.status(409).json({ message: 'Esta clase no tiene una solicitud de reagendar pendiente.' })
    return
  }
  const start = new Date(typeof req.body?.start === 'string' ? req.body.start : '')
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    res.status(400).json({ message: 'Elige una fecha y hora futuras.' })
    return
  }
  if (start.getTime() === session.start.getTime()) {
    res.status(400).json({ message: 'Propón un horario distinto al actual.' })
    return
  }
  if (!(await canMoveTo(session, start))) {
    res.status(409).json({ message: 'Ese horario no está disponible. Elige uno de los horarios que permite tu agenda.' })
    return
  }
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : ''

  session.reschedule = { status: 'proposed', reason: session.reschedule.reason, requestedAt: session.reschedule.requestedAt, proposedStart: start, tutorNote: note || undefined }
  await session.save()
  await notify({ user: session.student, type: 'reschedule_proposed', title: 'Nuevo horario propuesto', message: `${await userName(session.tutor)} propone mover tu clase al ${formatWhen(start)}. Acéptalo o recházalo.`, link: '/agenda' })
  await respond(res, session)
}

// Tutor: no puede reagendar; la clase se mantiene y el estudiante ve el motivo
export async function declineReschedule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await loadSession(req, res, 'tutor')
  if (!session) return
  if (session.reschedule?.status !== 'requested') {
    res.status(409).json({ message: 'Esta clase no tiene una solicitud de reagendar pendiente.' })
    return
  }
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : ''
  if (note.length < 5 || note.length > 300) {
    res.status(400).json({ message: 'Indica brevemente por qué no es posible (entre 5 y 300 caracteres).' })
    return
  }

  session.reschedule = { status: 'declined', reason: session.reschedule.reason, requestedAt: session.reschedule.requestedAt, tutorNote: note }
  await session.save()
  await notify({ user: session.student, type: 'reschedule_declined', title: 'No se pudo reagendar', message: `${await userName(session.tutor)} mantiene tu clase del ${formatWhen(session.start)}: «${note}»`, link: '/agenda' })
  await respond(res, session)
}

// Estudiante: acepta o rechaza el horario que propuso el tutor
export async function respondReschedule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await loadSession(req, res, 'student')
  if (!session) return
  const reschedule = session.reschedule
  if (reschedule?.status !== 'proposed' || !reschedule.proposedStart) {
    res.status(409).json({ message: 'Esta clase no tiene una propuesta de horario pendiente.' })
    return
  }
  if (typeof req.body?.accept !== 'boolean') {
    res.status(400).json({ message: 'Indica si aceptas o rechazas la propuesta.' })
    return
  }

  if (!req.body.accept) {
    session.reschedule = { status: 'rejected', reason: reschedule.reason, requestedAt: reschedule.requestedAt, proposedStart: reschedule.proposedStart, tutorNote: reschedule.tutorNote }
    await session.save()
    await notify({ user: session.tutor, type: 'reschedule_rejected', title: 'Propuesta rechazada', message: `${await userName(session.student)} rechazó el horario propuesto para el ${formatWhen(reschedule.proposedStart)}.`, link: '/agenda' })
    await respond(res, session)
    return
  }

  // Entre la propuesta y la respuesta la agenda pudo cambiar: se revisa de nuevo
  if (reschedule.proposedStart.getTime() <= Date.now() || !(await canMoveTo(session, reschedule.proposedStart))) {
    session.reschedule = { status: 'requested', reason: reschedule.reason, requestedAt: reschedule.requestedAt }
    await session.save()
    res.status(409).json({ message: 'Ese horario ya no está disponible. El tutor deberá proponer otro.' })
    return
  }
  session.start = reschedule.proposedStart
  session.rescheduleCount = (session.rescheduleCount ?? 0) + 1
  session.reschedule = undefined
  await session.save()
  await notify({ user: session.tutor, type: 'reschedule_accepted', title: 'Clase reagendada', message: `${await userName(session.student)} aceptó: la clase quedó para el ${formatWhen(session.start)}.`, link: '/agenda' })
  await respond(res, session)
}
