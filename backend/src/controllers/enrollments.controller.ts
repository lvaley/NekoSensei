import { notify, userName } from '../services/notify.service'
import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import type { Types } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import type { EnrollmentStatus, IEnrollment } from '../models/Enrollment'
import { Category } from '../models/Category'
import { Offer, TEACHING_MODES } from '../models/Offer'
import type { TeachingMode } from '../models/Offer'
import { Session } from '../models/Session'
import { distanceKm, round } from '../services/geo.service'
import { availableSlots } from '../services/schedule.service'
import { seatsTakenIn } from '../services/seats.service'
import { PAYMENT_WINDOW_MS, expireOverdue } from '../services/payments.service'
import { planQuote } from '../services/pricing.service'
import { addDays, buildChecker, isDateString, localDate, todayLocal, validateWeeklySlots } from '../services/weekly.service'
import { User } from '../models/User'
import type { IUser } from '../models/User'

type Doc<T> = T & { _id: Types.ObjectId }
type EnrollmentDoc = Doc<IEnrollment>

interface PersonView {
  id: string
  name: string
  picture?: string
}

const person = (user: Doc<IUser> | undefined, id: unknown): PersonView => ({ id: String(id), name: user?.name ?? 'Usuario', picture: user?.picture })

// Formato que ven el estudiante y el tutor de una inscripción
export async function toEnrollmentViews(enrollments: EnrollmentDoc[]) {
  const userIds = [...new Set(enrollments.flatMap((enrollment) => [String(enrollment.student), String(enrollment.tutor)]))]
  const users = await User.find({ _id: { $in: userIds } })
  const byId = new Map(users.map((user) => [String(user._id), user as unknown as Doc<IUser>]))
  const upcoming = await Session.find({ enrollment: { $in: enrollments.map((enrollment) => enrollment._id) }, status: 'scheduled', start: { $gte: new Date() } })
  const counted = await Session.find({ enrollment: { $in: enrollments.map((enrollment) => enrollment._id) }, status: { $in: ['scheduled', 'completed'] } })
  const scheduledBy = new Map<string, number>()
  const completedBy = new Map<string, number>()
  for (const session of counted) {
    const key = String(session.enrollment)
    scheduledBy.set(key, (scheduledBy.get(key) ?? 0) + 1)
    if (session.status === 'completed') completedBy.set(key, (completedBy.get(key) ?? 0) + 1)
  }
  // El enlace de la reunión solo se entrega en inscripciones activas virtuales
  const offers = await Offer.find({ _id: { $in: enrollments.filter((item) => item.status === 'active' && item.mode === 'virtual').map((item) => item.offer) } })
  const linkByOffer = new Map(offers.map((offer) => [String(offer._id), offer.meetingUrl || null]))
  const nextByEnrollment = new Map<string, Date>()
  for (const session of upcoming) {
    const key = String(session.enrollment)
    const current = nextByEnrollment.get(key)
    if (!current || session.start < current) nextByEnrollment.set(key, session.start)
  }

  return enrollments.map((enrollment) => ({
    id: String(enrollment._id),
    status: enrollment.status,
    mode: enrollment.mode,
    note: enrollment.note,
    decisionNote: enrollment.decisionNote,
    createdAt: enrollment.createdAt,
    offer: {
      id: String(enrollment.offer),
      title: enrollment.offerTitle,
      category: enrollment.categoryName,
      hourlyRate: enrollment.hourlyRate,
      level: enrollment.level ?? 'basic',
      classType: enrollment.classType ?? 'individual',
      maxStudents: enrollment.maxStudents ?? 1,
      totalSessions: enrollment.totalSessions ?? 1,
      sessionDurationMin: enrollment.sessionDurationMin ?? 60,
      weeks: enrollment.weeks ?? null,
      sessionsPerWeek: enrollment.sessionsPerWeek ?? null,
    },
    // Plan contratado: semanas, clases por semana y horarios fijos (null en cursos sin plan)
    plan: enrollment.weeks ? { weeks: enrollment.weeks, sessionsPerWeek: enrollment.sessionsPerWeek ?? 1, weeklySlots: enrollment.weeklySlots.map((slot) => ({ day: slot.day, start: slot.start })), startDate: enrollment.startDate ?? null, cycle: enrollment.cycle ?? 1 } : null,
    // Cobro pendiente (pago inicial tras la aceptación, o renovación)
    charge: enrollment.charge ? { kind: enrollment.charge.kind, classes: enrollment.charge.classes, travel: enrollment.charge.travel, total: enrollment.charge.total, dueAt: enrollment.charge.dueAt, startDate: enrollment.charge.startDate } : null,
    // Se puede renovar cuando el curso es por planes, está activo, no hay cobro abierto y queda a lo sumo una semana de clases
    canRenew: enrollment.status === 'active' && !!enrollment.weeks && !enrollment.charge && (enrollment.totalSessions ?? 0) - (completedBy.get(String(enrollment._id)) ?? 0) <= (enrollment.sessionsPerWeek ?? 1),
    // Clases ya agendadas o realizadas (no cuentan las canceladas) y cuántas se realizaron
    sessionsUsed: scheduledBy.get(String(enrollment._id)) ?? 0,
    sessionsCompleted: completedBy.get(String(enrollment._id)) ?? 0,
    tutor: person(byId.get(String(enrollment.tutor)), enrollment.tutor),
    student: person(byId.get(String(enrollment.student)), enrollment.student),
    nextSession: nextByEnrollment.get(String(enrollment._id)) ?? null,
    meetingUrl: enrollment.status === 'active' && enrollment.mode === 'virtual' ? (linkByOffer.get(String(enrollment.offer)) ?? null) : null,
  }))
}

// El estudiante solicita un curso; queda pendiente hasta que el tutor responda
export async function createEnrollment(req: Request, res: Response): Promise<void> {
  await expireOverdue()
  const offerId = typeof req.body?.offerId === 'string' ? req.body.offerId : ''
  const mode = req.body?.mode as TeachingMode
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : ''

  const student = await User.findById(req.auth?.sub)
  if (!student?.onboardingCompleted) {
    res.status(403).json({ message: 'Completa tu perfil antes de solicitar un curso.' })
    return
  }

  const offer = isValidObjectId(offerId) ? await Offer.findOne({ _id: offerId, active: true }) : null
  const tutor = offer ? await User.findOne({ _id: offer.tutor, role: 'tutor', 'tutorProfile.status': 'approved' }) : null
  if (!offer || !tutor) {
    res.status(404).json({ message: 'Este curso ya no está disponible.' })
    return
  }
  if (!TEACHING_MODES.includes(mode) || !offer.modes.includes(mode)) {
    res.status(400).json({ message: 'Elige una de las modalidades que ofrece el curso.' })
    return
  }
  // A domicilio: la casa del estudiante debe estar dentro de la zona de cobertura del curso
  if (mode === 'student_home') {
    if (!student.address || !tutor.address) {
      res.status(400).json({ message: 'Necesitamos tu dirección para calcular la cobertura a domicilio.' })
      return
    }
    const km = distanceKm(student.address, tutor.address)
    if (km > offer.maxTravelKm) {
      res.status(400).json({ message: `Tu dirección está a ${round(km, 1)} km del tutor, fuera de su zona de cobertura a domicilio (${offer.maxTravelKm} km). Elige otra modalidad.` })
      return
    }
  }
  const duplicated = await Enrollment.exists({ student: student._id, offer: offer._id, status: { $in: ['pending', 'awaiting_payment', 'active'] } })
  if (duplicated) {
    res.status(409).json({ message: 'Ya tienes una solicitud o inscripción activa en este curso.' })
    return
  }

  // Clase grupal: no se aceptan solicitudes cuando ya no quedan cupos
  if (offer.classType === 'group' && (await seatsTakenIn(offer._id)) >= offer.maxStudents) {
    res.status(409).json({ message: 'Este grupo ya no tiene cupos disponibles.' })
    return
  }

  // Cursos con plan individuales: el estudiante elige los días y horas fijos de cada semana y la fecha de inicio
  let weeklySlots: Array<{ day: number; start: string }> = []
  let startDate: string | undefined
  const hasPlan = !!offer.weeks && !!offer.sessionsPerWeek
  if (hasPlan && offer.classType !== 'group' && offer.availability.length > 0) {
    startDate = req.body?.startDate
    const today = todayLocal()
    if (!isDateString(startDate) || startDate < today || startDate > addDays(today, 60)) {
      res.status(400).json({ message: 'Elige la fecha en que quieres empezar (dentro de los próximos 60 días).' })
      return
    }
    const duration = offer.sessionDurationMin ?? 60
    const checker = await buildChecker({ tutor: tutor as never, student: student as never, mode, duration, weeks: offer.weeks as number, startDate })
    const checked = validateWeeklySlots(req.body?.weeklySlots, offer, duration, offer.sessionsPerWeek as number, checker)
    if (checked.error) {
      res.status(400).json({ message: checked.error })
      return
    }
    weeklySlots = checked.slots
  }

  const category = await Category.findById(offer.category)
  const enrollment = await Enrollment.create({
    student: student._id,
    tutor: tutor._id,
    offer: offer._id,
    offerTitle: offer.title,
    categoryName: category?.name ?? '',
    hourlyRate: offer.hourlyRate,
    level: offer.level ?? 'basic',
    classType: offer.classType ?? 'individual',
    maxStudents: offer.maxStudents ?? 1,
    totalSessions: offer.totalSessions ?? 1,
    sessionDurationMin: offer.sessionDurationMin ?? 60,
    weeks: offer.weeks,
    sessionsPerWeek: offer.sessionsPerWeek,
    weeklySlots,
    startDate,
    mode,
    note: note || undefined,
  })
  await notify({ user: tutor._id, type: 'enrollment_requested', title: 'Nueva solicitud de inscripción', message: `${student.name} quiere inscribirse en «${offer.title}».`, link: '/mis-estudiantes' })
  const [view] = await toEnrollmentViews([enrollment as unknown as EnrollmentDoc])
  res.status(201).json({ enrollment: view })
}

// Inscripciones propias: como estudiante o como tutor, según el rol de la sesión
export async function listEnrollments(req: Request, res: Response): Promise<void> {
  await expireOverdue()
  const field = req.auth?.role === 'tutor' ? 'tutor' : 'student'
  const enrollments = await Enrollment.find({ [field]: req.auth?.sub }).sort({ updatedAt: -1 }).limit(300)
  res.json({ enrollments: await toEnrollmentViews(enrollments as unknown as EnrollmentDoc[]) })
}

async function loadOwn(req: Request<{ id: string }>, res: Response, who: 'tutor' | 'any') {
  const enrollment = isValidObjectId(req.params.id) ? await Enrollment.findById(req.params.id) : null
  const userId = req.auth?.sub
  const isTutor = enrollment && String(enrollment.tutor) === userId
  const isStudent = enrollment && String(enrollment.student) === userId
  if (!enrollment || !(isTutor || (who === 'any' && isStudent))) {
    res.status(404).json({ message: 'Inscripción no encontrada' })
    return null
  }
  return enrollment
}

function transition(allowed: EnrollmentStatus[], current: EnrollmentStatus, res: Response): boolean {
  if (allowed.includes(current)) return true
  res.status(409).json({ message: 'Esa acción no está disponible en el estado actual de la inscripción.' })
  return false
}

// El tutor acepta o rechaza una solicitud pendiente
export async function decideEnrollment(req: Request<{ id: string }>, res: Response): Promise<void> {
  await expireOverdue()
  const enrollment = await loadOwn(req, res, 'tutor')
  if (!enrollment || !transition(['pending'], enrollment.status, res)) return

  const decision = req.body?.decision
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : ''
  if (decision !== 'accept' && decision !== 'reject') {
    res.status(400).json({ message: 'La decisión debe ser "accept" o "reject".' })
    return
  }
  if (decision === 'reject' && note.length < 5) {
    res.status(400).json({ message: 'Indica brevemente el motivo del rechazo.' })
    return
  }

  // Aceptar a un estudiante ocupa un cupo del grupo: se verifica que aún haya
  if (decision === 'accept' && enrollment.classType === 'group') {
    const offer = await Offer.findById(enrollment.offer)
    const max = offer?.maxStudents ?? enrollment.maxStudents
    if ((await seatsTakenIn(enrollment.offer)) >= max) {
      res.status(409).json({ message: `El grupo ya está completo (${max} cupos). Rechaza la solicitud o amplía los cupos del curso.` })
      return
    }
  }

  // Aceptar no activa el curso: el estudiante tiene que pagar primero (el precio queda fijado en este momento)
  if (decision === 'accept') {
    const [offer, tutorUser, studentUser] = await Promise.all([Offer.findById(enrollment.offer), User.findById(enrollment.tutor), User.findById(enrollment.student)])
    const quote = planQuote({ hourlyRate: enrollment.hourlyRate, sessions: enrollment.totalSessions ?? 1, durationMin: enrollment.sessionDurationMin ?? 60, mode: enrollment.mode, offer, tutor: tutorUser, student: studentUser })
    enrollment.charge = { kind: 'initial', ...quote, dueAt: new Date(Date.now() + PAYMENT_WINDOW_MS), startDate: enrollment.startDate ?? localDate(Date.now() + 86_400_000) }
  }
  enrollment.status = decision === 'accept' ? 'awaiting_payment' : 'rejected'
  enrollment.decisionNote = note || undefined
  enrollment.decidedAt = new Date()
  await enrollment.save()
  await notify(
    decision === 'accept'
      ? { user: enrollment.student, type: 'payment_required', title: 'Tu solicitud fue aceptada: falta el pago', message: `Paga «${enrollment.offerTitle}» (${enrollment.charge ? `Q${enrollment.charge.total}` : ''}) en las próximas 48 horas para activar tus clases.`, link: '/mis-cursos' }
      : { user: enrollment.student, type: 'enrollment_rejected', title: 'Solicitud rechazada', message: `Tu solicitud en «${enrollment.offerTitle}» fue rechazada: ${note}`, link: '/mis-cursos' },
  )
  const [view] = await toEnrollmentViews([enrollment as unknown as EnrollmentDoc])
  res.json({ enrollment: view })
}

// Al cancelar o finalizar, las clases futuras pendientes se cancelan
async function closeEnrollment(req: Request<{ id: string }>, res: Response, status: 'cancelled' | 'finished', who: 'tutor' | 'any'): Promise<void> {
  const enrollment = await loadOwn(req, res, who)
  if (!enrollment || !transition(status === 'finished' ? ['active'] : ['pending', 'awaiting_payment', 'active'], enrollment.status, res)) return

  // Un estudiante inscrito debe completar el curso: solo puede retirar su solicitud mientras está pendiente
  if (status === 'cancelled' && enrollment.status === 'active' && String(enrollment.student) === req.auth?.sub) {
    res.status(403).json({ message: 'Ya estás inscrito: debes completar todas las clases del curso.' })
    return
  }

  enrollment.status = status
  // Cancelar libera también un cobro abierto (pago o renovación sin pagar)
  enrollment.charge = undefined
  await enrollment.save()
  await Session.updateMany({ enrollment: enrollment._id, status: 'scheduled', start: { $gte: new Date() } }, { $set: { status: 'cancelled' } })
  if (status === 'cancelled') {
    const byStudent = String(enrollment.student) === req.auth?.sub
    const who = await userName(req.auth?.sub ?? '')
    await notify(byStudent
      ? { user: enrollment.tutor, type: 'enrollment_cancelled', title: 'Solicitud cancelada', message: `${who} canceló su solicitud en «${enrollment.offerTitle}».`, link: '/mis-estudiantes' }
      : { user: enrollment.student, type: 'enrollment_cancelled', title: 'Inscripción cancelada', message: `${who} canceló tu inscripción en «${enrollment.offerTitle}».`, link: '/mis-cursos' })
  }
  const [view] = await toEnrollmentViews([enrollment as unknown as EnrollmentDoc])
  res.json({ enrollment: view })
}

export const cancelEnrollment = (req: Request<{ id: string }>, res: Response) => closeEnrollment(req, res, 'cancelled', 'any')
export const finishEnrollment = (req: Request<{ id: string }>, res: Response) => closeEnrollment(req, res, 'finished', 'tutor')

// Horarios en que se puede agendar una clase de esta inscripción: dentro de las franjas del tutor,
// sin choques y con tiempo de traslado suficiente. Sin franjas definidas (oferta antigua) no hay restricción.
export async function listSlots(req: Request<{ id: string }>, res: Response): Promise<void> {
  const enrollment = await loadOwn(req, res, 'any')
  if (!enrollment) return
  if (enrollment.status !== 'active') {
    res.status(409).json({ message: 'Solo puedes agendar clases en inscripciones activas.' })
    return
  }

  const [offer, tutor, student] = await Promise.all([Offer.findById(enrollment.offer), User.findById(enrollment.tutor), User.findById(enrollment.student)])
  if (!tutor || !student) {
    res.status(404).json({ message: 'Inscripción no encontrada' })
    return
  }
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 60)
  const now = Date.now()
  const slots = await availableSlots(enrollment as unknown as EnrollmentDoc, offer, tutor, student, now, now + days * 86_400_000, { checkStudent: enrollment.classType !== 'group' })
  res.json({ hasSchedule: slots !== null, durationMin: enrollment.sessionDurationMin ?? 60, slots: (slots ?? []).map((slot) => slot.toISOString()) })
}
