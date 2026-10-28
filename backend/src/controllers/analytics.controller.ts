import type { Request, Response } from 'express'
import { env } from '../config/env'
import { Enrollment } from '../models/Enrollment'
import { Payment } from '../models/Payment'
import { Review } from '../models/Review'
import { Session } from '../models/Session'
import { User } from '../models/User'

// Reportería (v0.8). Los meses se miden en hora de Guatemala (UTC−6, sin horario de verano).
const OFFSET_H = 6
const MONTHS = 6
const round2 = (value: number) => Math.round(value * 100) / 100

const pad = (n: number) => String(n).padStart(2, '0')
const monthKey = (year: number, month: number) => `${year}-${pad(month)}`

function currentMonth(): string {
  const now = new Date(Date.now() - OFFSET_H * 3_600_000)
  return monthKey(now.getUTCFullYear(), now.getUTCMonth() + 1)
}

function parseMonth(value: unknown): string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth()
}

// Inicio (incluido) y fin (excluido) de un mes "yyyy-mm" en hora de Guatemala
function rangeOf(key: string): { start: Date; end: Date } {
  const [year = 0, month = 1] = key.split('-').map(Number)
  return { start: new Date(Date.UTC(year, month - 1, 1, OFFSET_H)), end: new Date(Date.UTC(year, month, 1, OFFSET_H)) }
}

// Los últimos MONTHS meses que terminan en `key`, del más antiguo al más reciente
function lastMonths(key: string): string[] {
  const [year = 0, month = 1] = key.split('-').map(Number)
  return Array.from({ length: MONTHS }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (MONTHS - 1 - index), 1))
    return monthKey(date.getUTCFullYear(), date.getUTCMonth() + 1)
  })
}

const keyOf = (date: Date) => {
  const local = new Date(date.getTime() - OFFSET_H * 3_600_000)
  return monthKey(local.getUTCFullYear(), local.getUTCMonth() + 1)
}

interface PaymentLike {
  amount: number
  refundedAmount?: number
  createdAt: Date
}

// Cobrado neto = pagos aprobados − reembolsos. La comisión se calcula sobre lo neto; el tutor recibe el resto.
function money(payments: PaymentLike[]) {
  const gross = payments.reduce((sum, item) => sum + item.amount, 0)
  const refunds = payments.reduce((sum, item) => sum + (item.refundedAmount ?? 0), 0)
  const net = gross - refunds
  const commission = net * env.commissionRate
  return { gross: round2(gross), refunds: round2(refunds), net: round2(net), commission: round2(commission), payout: round2(net - commission) }
}

// Administrador: ingresos y comisión, clases impartidas vs. canceladas, demanda y rankings de tutores
export async function getAdminAnalytics(req: Request, res: Response): Promise<void> {
  const month = parseMonth(req.query.month)
  const months = lastMonths(month)
  const first = rangeOf(months[0] ?? month).start
  const { start, end } = rangeOf(month)

  const [payments, sessions, enrollments, reviews] = await Promise.all([
    Payment.find({ status: 'paid', createdAt: { $gte: first, $lt: end } }),
    Session.find({ status: { $in: ['completed', 'cancelled'] }, start: { $gte: first, $lt: end } }).select('status start'),
    Enrollment.find({ createdAt: { $gte: first, $lt: end } }).select('categoryName offerTitle createdAt'),
    Review.find({}).select('tutor rating'),
  ])

  const series = months.map((key) => {
    const monthPayments = payments.filter((item) => keyOf(item.createdAt) === key)
    const monthSessions = sessions.filter((item) => keyOf(item.start) === key)
    return {
      month: key,
      ...money(monthPayments),
      completed: monthSessions.filter((item) => item.status === 'completed').length,
      cancelled: monthSessions.filter((item) => item.status === 'cancelled').length,
      requests: enrollments.filter((item) => keyOf(item.createdAt) === key).length,
    }
  })
  const selected = series[series.length - 1]

  // Demanda del mes: solicitudes por categoría y cursos más solicitados
  const inMonth = enrollments.filter((item) => item.createdAt >= start && item.createdAt < end)
  const tally = (values: string[]) => {
    const counts = new Map<string, number>()
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }
  const byCategory = tally(inMonth.map((item) => item.categoryName || 'Sin categoría')).slice(0, 8)
  const topCourses = tally(inMonth.map((item) => item.offerTitle)).slice(0, 5)

  // Ranking de tutores por calificación promedio (histórica), con enlace a sus reseñas
  const perTutor = new Map<string, { sum: number; count: number }>()
  for (const review of reviews) {
    const row = perTutor.get(String(review.tutor)) ?? { sum: 0, count: 0 }
    row.sum += review.rating
    row.count += 1
    perTutor.set(String(review.tutor), row)
  }
  const tutors = await User.find({ _id: { $in: [...perTutor.keys()] } }).select('name tutorProfile.status suspended')
  const rows = tutors.map((tutor) => {
    const row = perTutor.get(String(tutor._id)) ?? { sum: 0, count: 0 }
    return {
      id: String(tutor._id),
      name: tutor.name,
      average: Math.round((row.sum / row.count) * 10) / 10,
      reviews: row.count,
      // Las reseñas solo son públicas mientras el tutor está aprobado y activo
      publicProfile: tutor.tutorProfile?.status === 'approved' && !tutor.suspended,
    }
  })
  const best = [...rows].sort((a, b) => b.average - a.average || b.reviews - a.reviews).slice(0, 5)
  const worst = [...rows].sort((a, b) => a.average - b.average || b.reviews - a.reviews).slice(0, 5)

  res.json({ month, commissionRate: env.commissionRate, summary: selected, series, demand: { byCategory, topCourses }, rankings: { best, worst } })
}

// Tutor: lo que ha cobrado, la comisión descontada y sus clases del mes
export async function getTutorEarnings(req: Request, res: Response): Promise<void> {
  const tutorId = req.auth?.sub
  const month = parseMonth(req.query.month)
  const months = lastMonths(month)
  const first = rangeOf(months[0] ?? month).start
  const { start, end } = rangeOf(month)

  const [payments, sessions, allPaid] = await Promise.all([
    Payment.find({ tutor: tutorId, status: 'paid', createdAt: { $gte: first, $lt: end } }),
    Session.find({ tutor: tutorId, status: { $in: ['completed', 'cancelled'] }, start: { $gte: first, $lt: end } }).select('status start'),
    Payment.find({ tutor: tutorId, status: 'paid' }).select('amount refundedAmount student createdAt'),
  ])

  const series = months.map((key) => {
    const monthSessions = sessions.filter((item) => keyOf(item.start) === key)
    return {
      month: key,
      ...money(payments.filter((item) => keyOf(item.createdAt) === key)),
      completed: monthSessions.filter((item) => item.status === 'completed').length,
      cancelled: monthSessions.filter((item) => item.status === 'cancelled').length,
    }
  })

  const inMonth = payments.filter((item) => item.createdAt >= start && item.createdAt < end)
  const perCourse = new Map<string, PaymentLike[]>()
  for (const payment of inMonth) perCourse.set(payment.offerTitle, [...(perCourse.get(payment.offerTitle) ?? []), payment])
  const byCourse = [...perCourse.entries()]
    .map(([title, items]) => ({ title, payments: items.length, ...money(items) }))
    .sort((a, b) => b.payout - a.payout)

  res.json({
    month,
    commissionRate: env.commissionRate,
    summary: series[series.length - 1],
    series,
    byCourse,
    total: { ...money(allPaid), students: new Set(allPaid.map((item) => String(item.student))).size },
  })
}

