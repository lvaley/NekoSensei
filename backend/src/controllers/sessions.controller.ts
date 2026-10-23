import { formatWhen, notify, userName } from '../services/notify.service'
import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import type { Types } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import { Offer } from '../models/Offer'
import { Session } from '../models/Session'
import type { ISession } from '../models/Session'
import { User } from '../models/User'
import { availableSlots } from '../services/schedule.service'

const MAX_DAYS_AHEAD = 180
const MIN_MS = 60_000

export type SessionDoc = ISession & { _id: Types.ObjectId }

// Las clases grupales existen como una sesión por estudiante (misma oferta, inicio y duración)
const groupKey = (session: SessionDoc) => (session.offer ? `${session.offer}|${session.start.getTime()}|${session.durationMin}|${session.status}` : null)

async function groupMates(session: SessionDoc): Promise<SessionDoc[]> {
  if (!session.offer) return [session]
  const mates = await Session.find({ offer: session.offer, start: session.start, durationMin: session.durationMin, status: session.status })
  return mates as unknown as SessionDoc[]
}

async function isGroupSession(session: SessionDoc): Promise<boolean> {
  const enrollment = await Enrollment.findById(session.enrollment)
  return enrollment?.classType === 'group'
}

// En la agenda del tutor, una clase grupal se muestra una sola vez con la lista de estudiantes
function collapseGroups(sessions: SessionDoc[]): { docs: SessionDoc[]; members: Map<string, SessionDoc[]> } {
  const members = new Map<string, SessionDoc[]>()
  const docs: SessionDoc[] = []
  const first = new Map<string, SessionDoc>()
  for (const session of sessions) {
    const key = groupKey(session)
    if (key && first.has(key)) {
      members.get(String(first.get(key)?._id))?.push(session)
      continue
    }
    if (key) first.set(key, session)
    members.set(String(session._id), [session])
    docs.push(session)
  }
  return { docs, members }
}

export async function toSessionViews(sessions: SessionDoc[], members?: Map<string, SessionDoc[]>) {
  const enrollments = await Enrollment.find({ _id: { $in: sessions.map((session) => session.enrollment) } })
  const enrollmentById = new Map(enrollments.map((enrollment) => [String(enrollment._id), enrollment]))
  const offers = await Offer.find({ _id: { $in: enrollments.map((item) => item.offer) } })
  const linkByOffer = new Map(offers.map((offer) => [String(offer._id), offer.meetingUrl || null]))
  const everyone = members ? [...members.values()].flat() : sessions
  const users = await User.find({ _id: { $in: everyone.flatMap((session) => [session.tutor, session.student]) } })
  const userById = new Map(users.map((user) => [String(user._id), user]))

  return sessions.map((session) => {
    const enrollment = enrollmentById.get(String(session.enrollment))
    const tutor = userById.get(String(session.tutor))
    const student = userById.get(String(session.student))
    return {
      id: String(session._id),
      enrollmentId: String(session.enrollment),
      title: enrollment?.offerTitle ?? 'Clase',
      mode: enrollment?.mode,
      start: session.start,
      end: new Date(session.start.getTime() + session.durationMin * MIN_MS),
      durationMin: session.durationMin,
      status: session.status,
      note: session.note,
      tutor: { id: String(session.tutor), name: tutor?.name ?? 'Tutor' },
      student: { id: String(session.student), name: student?.name ?? 'Estudiante' },
      classType: enrollment?.classType ?? 'individual',
      rescheduleCount: session.rescheduleCount ?? 0,
      reschedule: session.reschedule
        ? { status: session.reschedule.status, reason: session.reschedule.reason, requestedAt: session.reschedule.requestedAt, proposedStart: session.reschedule.proposedStart ?? null, tutorNote: session.reschedule.tutorNote ?? null }
        : null,
      // Enlace de la reunión: solo de clases virtuales aún programadas
      meetingUrl: enrollment && enrollment.mode === 'virtual' && session.status === 'scheduled' ? (linkByOffer.get(String(enrollment.offer)) ?? null) : null,
      // Solo para el tutor en clases grupales: todos los estudiantes que asisten
      students: enrollment?.classType === 'group' && members ? (members.get(String(session._id)) ?? []).map((item) => ({ id: String(item.student), name: userById.get(String(item.student))?.name ?? 'Estudiante' })) : undefined,
    }
  })
}

// Clases propias entre dos fechas (?from=&to=, ISO). Por defecto, desde hace 30 días hasta dentro de 90.
export async function listSessions(req: Request, res: Response): Promise<void> {
  const field = req.auth?.role === 'tutor' ? 'tutor' : 'student'
  const now = Date.now()
  const from = new Date(typeof req.query.from === 'string' ? req.query.from : now - 30 * 86_400_000)
  const to = new Date(typeof req.query.to === 'string' ? req.query.to : now + 90 * 86_400_000)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    res.status(400).json({ message: 'Rango de fechas inválido.' })
    return
  }

  const sessions = await Session.find({ [field]: req.auth?.sub, start: { $gte: from, $lte: to } }).sort({ start: 1 }).limit(500)
  if (field === 'tutor') {
    const { docs, members } = collapseGroups(sessions as unknown as SessionDoc[])
    res.json({ sessions: await toSessionViews(docs, members) })
    return
  }
  res.json({ sessions: await toSessionViews(sessions as unknown as SessionDoc[]) })
}

// Tutor o estudiante agendan una clase dentro de una inscripción activa; no se permiten choques de horario
export async function createSession(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = req.auth?.sub
  const enrollment = isValidObjectId(req.params.id) ? await Enrollment.findById(req.params.id) : null
  if (!enrollment || (String(enrollment.tutor) !== userId && String(enrollment.student) !== userId)) {
    res.status(404).json({ message: 'Inscripción no encontrada' })
    return
  }
  if (enrollment.status !== 'active') {
    res.status(409).json({ message: 'Solo puedes agendar clases en inscripciones activas.' })
    return
  }

  const start = new Date(typeof req.body?.start === 'string' ? req.body.start : '')
  // Con franjas definidas por el tutor, cada clase dura lo que dura el curso
  const offer = await Offer.findById(enrollment.offer)
  const scheduled = (offer?.availability.length ?? 0) > 0
  const durationMin = scheduled ? (enrollment.sessionDurationMin ?? 60) : Number(req.body?.durationMin)
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : ''
  const now = Date.now()

  if (Number.isNaN(start.getTime()) || start.getTime() <= now) {
    res.status(400).json({ message: 'Elige una fecha y hora futuras.' })
    return
  }
  if (start.getTime() > now + MAX_DAYS_AHEAD * 86_400_000) {
    res.status(400).json({ message: `Solo puedes agendar hasta con ${MAX_DAYS_AHEAD} días de anticipación.` })
    return
  }
  if (!Number.isInteger(durationMin) || durationMin < 30 || durationMin > 240 || durationMin % 15 !== 0) {
    res.status(400).json({ message: 'La duración debe ser de 30 a 240 minutos, en bloques de 15.' })
    return
  }

  // Virtual y en casa del tutor: agenda el tutor; el estudiante solo ve sus clases
  if (enrollment.mode !== 'student_home' && String(enrollment.student) === userId) {
    res.status(403).json({ message: 'En las clases virtuales y en casa del tutor, el tutor es quien agenda los horarios.' })
    return
  }
  const isGroup = enrollment.classType === 'group'
  if (isGroup && String(enrollment.tutor) !== userId) {
    res.status(403).json({ message: 'En las clases grupales solo el tutor agenda los horarios.' })
    return
  }

  // A domicilio, el estudiante es quien elige la fecha y la hora
  if (enrollment.mode === 'student_home' && String(enrollment.student) !== userId) {
    res.status(403).json({ message: 'En las clases a domicilio el estudiante elige la fecha y la hora.' })
    return
  }
  // El horario debe estar entre los que ofrece el tutor (franjas, sin choques y con tiempo de traslado)
  if (scheduled) {
    const [tutorUser, studentUser] = await Promise.all([User.findById(enrollment.tutor), User.findById(enrollment.student)])
    const slots = tutorUser && studentUser ? await availableSlots(enrollment as never, offer, tutorUser, studentUser, start.getTime(), start.getTime(), { checkStudent: !isGroup }) : []
    if (!slots?.some((slot) => slot.getTime() === start.getTime())) {
      res.status(409).json({ message: 'Ese horario no está disponible. Elige uno de los horarios que ofrece el tutor.' })
      return
    }
  }

  // Individual: solo esta inscripción. Grupal: todos los estudiantes activos del grupo, a la misma hora.
  const targets = isGroup ? await Enrollment.find({ offer: enrollment.offer, status: 'active' }) : [enrollment]
  const end = new Date(start.getTime() + durationMin * MIN_MS)
  const overlaps = (other: { start: Date; durationMin: number }) => other.start.getTime() + other.durationMin * MIN_MS > start.getTime()
  const window = { $gte: new Date(start.getTime() - 240 * MIN_MS), $lt: end }

  // Choque del tutor (se revisa una sola vez, es el mismo para todo el grupo)
  const tutorClash = (await Session.find({ status: 'scheduled', tutor: enrollment.tutor, start: window })).some(overlaps)

  const created: SessionDoc[] = []
  const skipped: Array<{ student: Types.ObjectId; reason: string }> = []
  for (const target of targets) {
    // El curso incluye un número fijo de clases: las canceladas no cuentan
    const used = await Session.countDocuments({ enrollment: target._id, status: { $in: ['scheduled', 'completed'] } })
    const total = target.totalSessions ?? 1
    if (used >= total) {
      skipped.push({ student: target.student, reason: `Ya agendaste las ${total} clases que incluye este curso.` })
      continue
    }
    const studentClash = (await Session.find({ status: 'scheduled', student: target.student, start: window })).some(overlaps)
    if (tutorClash || studentClash) {
      skipped.push({ student: target.student, reason: 'Ese horario se cruza con otra clase ya agendada. Elige otro horario.' })
      continue
    }
    const session = await Session.create({ enrollment: target._id, offer: target.offer, tutor: target.tutor, student: target.student, start, durationMin, note: note || undefined, createdBy: userId })
    created.push(session as unknown as SessionDoc)
  }

  if (created.length === 0) {
    // Mismo mensaje que antes para clases individuales
    res.status(409).json({ message: tutorClash && !isGroup ? 'Ese horario se cruza con otra clase ya agendada. Elige otro horario.' : (skipped[0]?.reason ?? 'No se pudo agendar la clase.') })
    return
  }

  // Avisa a la otra parte: el tutor agenda para los estudiantes; en las clases a domicilio agenda el estudiante
  const whenText = formatWhen(start)
  const creatorName = await userName(userId ?? '')
  await notify(
    ...(String(enrollment.tutor) === userId
      ? created.map((item) => ({ user: item.student, type: 'session_scheduled' as const, title: 'Clase agendada', message: `${creatorName} agendó «${enrollment.offerTitle}» para el ${whenText}.`, link: '/agenda' }))
      : [{ user: enrollment.tutor, type: 'session_scheduled' as const, title: 'Clase agendada', message: `${creatorName} agendó «${enrollment.offerTitle}» para el ${whenText}.`, link: '/agenda' }]),
  )

  const own = created.find((item) => String(item.enrollment) === String(enrollment._id)) ?? (created[0] as SessionDoc)
  const members = new Map([[String(own._id), created]])
  const [view] = await toSessionViews([own], members)
  let skippedNames: string[] = []
  if (skipped.length > 0) {
    const users = await User.find({ _id: { $in: skipped.map((item) => item.student) } })
    skippedNames = users.map((user) => user.name)
  }
  res.status(201).json({ session: view, groupSize: isGroup ? created.length : undefined, skipped: skippedNames })
}

async function loadParticipantSession(req: Request<{ id: string }>, res: Response) {
  const session = isValidObjectId(req.params.id) ? await Session.findById(req.params.id) : null
  const userId = req.auth?.sub
  if (!session || (String(session.tutor) !== userId && String(session.student) !== userId)) {
    res.status(404).json({ message: 'Clase no encontrada' })
    return null
  }
  if (session.status !== 'scheduled') {
    res.status(409).json({ message: 'Esta clase ya no está programada.' })
    return null
  }
  return session
}

export async function cancelSession(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await loadParticipantSession(req, res)
  if (!session) return
  // Si el tutor cancela una clase grupal, se cancela para todo el grupo; si un estudiante cancela, solo la suya
  const doc = session as unknown as SessionDoc
  const everyone = String(session.tutor) === req.auth?.sub && (await isGroupSession(doc)) ? await groupMates(doc) : [doc]
  await Session.updateMany({ _id: { $in: everyone.map((item) => item._id) } }, { $set: { status: 'cancelled' } })
  session.status = 'cancelled'
  const byTutor = String(session.tutor) === req.auth?.sub
  const canceller = await userName(req.auth?.sub ?? '')
  const whenText = formatWhen(session.start)
  await notify(...(byTutor ? everyone.map((item) => item.student) : [session.tutor]).map((user) => ({ user, type: 'session_cancelled' as const, title: 'Clase cancelada', message: `${canceller} canceló la clase del ${whenText}.`, link: '/agenda' })))
  const [view] = await toSessionViews([doc])
  res.json({ session: view })
}

// Solo el tutor marca una clase como realizada, y únicamente cuando ya empezó
export async function completeSession(req: Request<{ id: string }>, res: Response): Promise<void> {
  const session = await loadParticipantSession(req, res)
  if (!session) return
  if (String(session.tutor) !== req.auth?.sub) {
    res.status(403).json({ message: 'Solo el tutor puede marcar la clase como realizada.' })
    return
  }
  if (session.start.getTime() > Date.now()) {
    res.status(409).json({ message: 'La clase aún no ha comenzado.' })
    return
  }
  // Una clase grupal realizada cuenta para todos los asistentes
  const doc = session as unknown as SessionDoc
  const everyone = (await isGroupSession(doc)) ? await groupMates(doc) : [doc]
  await Session.updateMany({ _id: { $in: everyone.map((item) => item._id) } }, { $set: { status: 'completed' } })
  session.status = 'completed'
  const [view] = await toSessionViews([doc])
  res.json({ session: view })
}
