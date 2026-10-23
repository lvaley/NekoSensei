import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import { Offer } from '../models/Offer'
import { Payment } from '../models/Payment'
import { Session } from '../models/Session'
import { User } from '../models/User'
import { notify, userName } from '../services/notify.service'
import { PAYMENT_WINDOW_MS, checkCard, expireOverdue, generateBlock } from '../services/payments.service'
import { planQuote } from '../services/pricing.service'
import { addDays, availableWeeklyStarts, buildChecker, isDateString, localDate, todayLocal } from '../services/weekly.service'
import { toEnrollmentViews } from './enrollments.controller'

type EnrollmentView = Awaited<ReturnType<typeof toEnrollmentViews>>[number]

function paymentView(payment: InstanceType<typeof Payment>, otherName: string) {
  return {
    id: String(payment._id),
    offerTitle: payment.offerTitle,
    enrollmentId: String(payment.enrollment),
    cycle: payment.cycle,
    kind: payment.kind,
    classes: payment.classes,
    travel: payment.travel,
    amount: payment.amount,
    sessions: payment.sessions,
    status: payment.status,
    failureReason: payment.failureReason ?? null,
    card: payment.cardLast4 ? { brand: payment.cardBrand, last4: payment.cardLast4 } : null,
    other: otherName,
    createdAt: payment.createdAt,
  }
}

async function loadMine(req: Request<{ id: string }>, res: Response) {
  const enrollment = isValidObjectId(req.params.id) ? await Enrollment.findById(req.params.id) : null
  if (!enrollment || String(enrollment.student) !== req.auth?.sub) {
    res.status(404).json({ message: 'Inscripción no encontrada' })
    return null
  }
  return enrollment
}

// El estudiante paga el primer bloque tras la aceptación del tutor, o una renovación.
// Al aprobarse, la inscripción pasa a activa y se crean las clases del bloque.
export async function payEnrollment(req: Request<{ id: string }>, res: Response): Promise<void> {
  await expireOverdue()
  const enrollment = await loadMine(req, res)
  if (!enrollment) return
  const charge = enrollment.charge
  const pending = !!charge && ((enrollment.status === 'awaiting_payment' && charge.kind === 'initial') || (enrollment.status === 'active' && charge.kind === 'renewal'))
  if (!charge || !pending) {
    res.status(409).json({ message: 'No hay un pago pendiente en esta inscripción.' })
    return
  }

  const card = checkCard(req.body)
  const base = { enrollment: enrollment._id, student: enrollment.student, tutor: enrollment.tutor, offerTitle: enrollment.offerTitle, kind: charge.kind, classes: charge.classes, travel: charge.travel, amount: charge.total, cardBrand: card.brand ?? '', cardLast4: card.last4 ?? '' }
  const perBlock = enrollment.weeks ? enrollment.weeks * (enrollment.sessionsPerWeek ?? 1) : (enrollment.totalSessions ?? 1)
  const cycle = charge.kind === 'renewal' ? (enrollment.cycle ?? 1) + 1 : (enrollment.cycle ?? 1)

  if (!card.ok) {
    // Un rechazo del "banco" queda registrado; los errores de formato no
    if (card.status === 402) await Payment.create({ ...base, cycle, status: 'failed', failureReason: card.message })
    res.status(card.status ?? 400).json({ message: card.message })
    return
  }

  if (charge.kind === 'renewal') {
    enrollment.totalSessions = (enrollment.totalSessions ?? 0) + perBlock
    enrollment.cycle = cycle
  } else {
    enrollment.status = 'active'
    enrollment.paidAt = new Date()
  }
  const startDate = charge.startDate
  enrollment.charge = undefined
  await enrollment.save()

  const result = await generateBlock(enrollment as never, startDate)
  const payment = await Payment.create({ ...base, cycle, status: 'paid', sessions: perBlock })

  const payer = await userName(enrollment.student)
  const detail = result.created > 0 ? ` Se agendaron ${result.created} ${result.created === 1 ? 'clase' : 'clases'}.` : ''
  const label = charge.kind === 'renewal' ? 'renovó' : 'pagó'
  await notify(
    { user: enrollment.tutor, type: 'payment_received', title: charge.kind === 'renewal' ? 'Bloque renovado' : 'Pago recibido', message: `${payer} ${label} «${enrollment.offerTitle}» (Q${charge.total}).${detail}`, link: '/agenda' },
    { user: enrollment.student, type: 'payment_received', title: 'Pago aprobado', message: `Pagaste Q${charge.total} por «${enrollment.offerTitle}».${detail || ' Tu tutor agendará tus clases.'}`, link: enrollment.weeklySlots.length > 0 ? '/agenda' : '/mis-cursos' },
  )

  const [view] = await toEnrollmentViews([enrollment as never])
  res.json({ enrollment: view as EnrollmentView, payment: paymentView(payment, await userName(enrollment.tutor)), generated: result.created, skipped: result.skipped })
}

// El estudiante renueva su plan (manual): se abre un nuevo cobro por otro bloque, que se paga igual que el primero
export async function renewEnrollment(req: Request<{ id: string }>, res: Response): Promise<void> {
  await expireOverdue()
  const enrollment = await loadMine(req, res)
  if (!enrollment) return
  if (enrollment.status !== 'active' || !enrollment.weeks) {
    res.status(409).json({ message: 'Solo se renuevan los cursos por planes que están activos.' })
    return
  }
  if (enrollment.charge) {
    res.status(409).json({ message: 'Ya tienes un pago pendiente en este curso.' })
    return
  }
  const completed = await Session.countDocuments({ enrollment: enrollment._id, status: 'completed' })
  if ((enrollment.totalSessions ?? 0) - completed > (enrollment.sessionsPerWeek ?? 1)) {
    res.status(409).json({ message: 'Podrás renovar cuando te quede una semana de clases o menos.' })
    return
  }

  const [offer, tutor, student] = await Promise.all([Offer.findById(enrollment.offer), User.findById(enrollment.tutor), User.findById(enrollment.student)])
  const sessions = enrollment.weeks * (enrollment.sessionsPerWeek ?? 1)
  const quote = planQuote({ hourlyRate: enrollment.hourlyRate, sessions, durationMin: enrollment.sessionDurationMin ?? 60, mode: enrollment.mode, offer, tutor, student })
  // El nuevo bloque empieza al día siguiente de la última clase del anterior
  const last = await Session.findOne({ enrollment: enrollment._id, status: { $in: ['scheduled', 'completed'] } }).sort({ start: -1 })
  const startDate = addDays(last ? localDate(last.start.getTime()) : todayLocal(), 1)

  enrollment.charge = { kind: 'renewal', ...quote, dueAt: new Date(Date.now() + PAYMENT_WINDOW_MS), startDate }
  await enrollment.save()
  const [view] = await toEnrollmentViews([enrollment as never])
  res.status(201).json({ enrollment: view })
}

// Historial de pagos: el estudiante ve lo que pagó y el tutor lo que recibió
export async function listPayments(req: Request, res: Response): Promise<void> {
  const asTutor = req.auth?.role === 'tutor'
  const payments = await Payment.find({ [asTutor ? 'tutor' : 'student']: req.auth?.sub }).sort({ createdAt: -1 }).limit(200)
  const users = await User.find({ _id: { $in: payments.map((item) => (asTutor ? item.student : item.tutor)) } })
  const nameById = new Map(users.map((user) => [String(user._id), user.name]))
  res.json({ payments: payments.map((item) => paymentView(item, nameById.get(String(asTutor ? item.student : item.tutor)) ?? 'Usuario')) })
}

// Estudiante: horarios fijos disponibles y precio de un curso, antes de solicitarlo
export async function planSlots(req: Request<{ id: string }>, res: Response): Promise<void> {
  const offer = isValidObjectId(req.params.id) ? await Offer.findOne({ _id: req.params.id, active: true }) : null
  const tutor = offer ? await User.findOne({ _id: offer.tutor, role: 'tutor', 'tutorProfile.status': 'approved' }) : null
  const student = await User.findById(req.auth?.sub)
  if (!offer || !tutor || !student) {
    res.status(404).json({ message: 'Curso no encontrado' })
    return
  }
  const mode = String(req.query.mode ?? '')
  if (!offer.modes.some((item) => item === mode)) {
    res.status(400).json({ message: 'Elige una de las modalidades del curso.' })
    return
  }
  const duration = offer.sessionDurationMin ?? 60
  const sessions = offer.weeks && offer.sessionsPerWeek ? offer.weeks * offer.sessionsPerWeek : (offer.totalSessions ?? 1)
  const quote = planQuote({ hourlyRate: offer.hourlyRate, sessions, durationMin: duration, mode, offer, tutor, student })
  const needsSlots = !!offer.weeks && !!offer.sessionsPerWeek && offer.classType !== 'group' && offer.availability.length > 0

  let days: Array<{ day: number; starts: string[] }> = []
  const today = todayLocal()
  const startDate = isDateString(req.query.startDate) ? req.query.startDate : addDays(today, 1)
  if (needsSlots) {
    if (startDate < today || startDate > addDays(today, 60)) {
      res.status(400).json({ message: 'Elige una fecha de inicio dentro de los próximos 60 días.' })
      return
    }
    if (mode === 'student_home' && !student.address) {
      res.status(400).json({ message: 'Necesitamos tu dirección para calcular los horarios a domicilio.' })
      return
    }
    const checker = await buildChecker({ tutor: tutor as never, student: student as never, mode, duration, weeks: offer.weeks as number, startDate })
    days = availableWeeklyStarts(offer, duration, checker)
  }
  res.json({ needsSlots, weeks: offer.weeks ?? null, sessionsPerWeek: offer.sessionsPerWeek ?? null, durationMin: duration, startDate, days, quote: { ...quote, sessions } })
}
