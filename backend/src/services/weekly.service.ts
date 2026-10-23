import type { Types } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import type { WeeklySlot } from '../models/Enrollment'
import type { IOffer } from '../models/Offer'
import { Session } from '../models/Session'
import { User } from '../models/User'
import type { IUser } from '../models/User'
import { STEP_MIN, TZ_OFFSET_MIN, toMinutes, travelMinutes } from './schedule.service'

const MIN_MS = 60_000
const DAY_MS = 86_400_000
const MIN_LEAD_MS = 2 * 3_600_000
type Point = { lat: number; lng: number } | null | undefined

export const DAY_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
export const pad = (n: number) => String(n).padStart(2, '0')
export const hhmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

// ── Fechas en hora de Guatemala (yyyy-mm-dd) ──
const parseDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}
export const isDateString = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDate(value))
const formatDate = (utcMidnight: number) => {
  const d = new Date(utcMidnight)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
export const addDays = (value: string, days: number) => formatDate(parseDate(value) + days * DAY_MS)
// Fecha local de un instante
export const localDate = (ms: number) => formatDate(Math.floor((ms + TZ_OFFSET_MIN * MIN_MS) / DAY_MS) * DAY_MS)
export const todayLocal = () => localDate(Date.now())
const weekdayOf = (value: string) => new Date(parseDate(value)).getUTCDay()
// Milisegundos UTC en que empieza (00:00 en Guatemala) un día local
const localMidnightMs = (value: string) => parseDate(value) - TZ_OFFSET_MIN * MIN_MS

// Primer día igual o posterior a startDate que cae en ese día de la semana
const firstOnOrAfter = (startDate: string, day: number) => addDays(startDate, (day - weekdayOf(startDate) + 7) % 7)

// Inicios (ms UTC) de todas las clases del bloque: cada horario fijo, durante `weeks` semanas
export function occurrences(slots: WeeklySlot[], weeks: number, startDate: string): number[] {
  const result: number[] = []
  for (const slot of slots) {
    const base = localMidnightMs(firstOnOrAfter(startDate, slot.day)) + toMinutes(slot.start) * MIN_MS
    for (let w = 0; w < weeks; w++) result.push(base + w * 7 * DAY_MS)
  }
  return result.sort((a, b) => a - b)
}

// Si el bloque ya no puede empezar el día elegido (pasó la hora de la primera clase), se corre al siguiente día posible
export function effectiveStartDate(slots: WeeklySlot[], startDate: string, nowMs = Date.now()): string {
  let current = startDate
  for (let i = 0; i < 14; i++) {
    const firsts = slots.map((slot) => localMidnightMs(firstOnOrAfter(current, slot.day)) + toMinutes(slot.start) * MIN_MS)
    if (firsts.every((start) => start >= nowMs + MIN_LEAD_MS)) return current
    current = addDays(current, 1)
  }
  return current
}

interface Pattern {
  slots: WeeklySlot[]
  duration: number
  where: Point
}

export interface WeeklyChecker {
  isFree: (day: number, startMin: number) => boolean
}

// Prepara la revisión de choques para un bloque: contra las clases ya agendadas (en todas las semanas del bloque)
// y contra los horarios fijos de otras solicitudes en curso (pendientes o por pagar), que "apartan" su espacio.
export async function buildChecker(args: { tutor: IUser & { _id: Types.ObjectId }; student: IUser & { _id: Types.ObjectId }; mode: string; duration: number; weeks: number; startDate: string; excludeEnrollment?: Types.ObjectId }): Promise<WeeklyChecker> {
  const { tutor, student, mode, duration, weeks, startDate, excludeEnrollment } = args
  const from = new Date(localMidnightMs(startDate) - DAY_MS)
  const to = new Date(localMidnightMs(startDate) + (weeks * 7 + 8) * DAY_MS)
  const range = { $gte: from, $lte: to }
  const holding = ['pending', 'awaiting_payment']
  const tutorSessionFilter: Record<string, unknown> = { tutor: tutor._id, status: 'scheduled', start: range }
  const studentSessionFilter: Record<string, unknown> = { student: student._id, status: 'scheduled', start: range }
  const tutorHoldFilter: Record<string, unknown> = { tutor: tutor._id, status: { $in: holding }, 'weeklySlots.0': { $exists: true } }
  const studentHoldFilter: Record<string, unknown> = { student: student._id, tutor: { $ne: tutor._id }, status: { $in: holding }, 'weeklySlots.0': { $exists: true } }
  if (excludeEnrollment) {
    tutorSessionFilter.enrollment = { $ne: excludeEnrollment }
    studentSessionFilter.enrollment = { $ne: excludeEnrollment }
    tutorHoldFilter._id = { $ne: excludeEnrollment }
    studentHoldFilter._id = { $ne: excludeEnrollment }
  }

  const tutorSessions = await Session.find(tutorSessionFilter)
  const studentSessions = await Session.find(studentSessionFilter)
  const sessionEnrollments = await Enrollment.find({ _id: { $in: tutorSessions.map((item) => item.enrollment) } })
  const modeById = new Map(sessionEnrollments.map((item) => [String(item._id), item.mode]))

  const tutorHolds = await Enrollment.find(tutorHoldFilter)
  const studentHolds = await Enrollment.find(studentHoldFilter)

  const userIds = [...tutorSessions.map((item) => item.student), ...tutorHolds.map((item) => item.student)]
  const users = await User.find({ _id: { $in: userIds } })
  const addressById = new Map(users.map((user) => [String(user._id), user.address as Point]))

  const tutorBase: Point = tutor.address
  const here: Point = mode === 'student_home' ? student.address : tutorBase
  const busy = tutorSessions.map((item) => ({ start: item.start.getTime(), end: item.start.getTime() + item.durationMin * MIN_MS, where: modeById.get(String(item.enrollment)) === 'student_home' ? addressById.get(String(item.student)) : tutorBase }))
  const tutorPatterns: Pattern[] = tutorHolds.map((item) => ({ slots: item.weeklySlots, duration: item.sessionDurationMin ?? 60, where: item.mode === 'student_home' ? addressById.get(String(item.student)) : tutorBase }))
  const studentPatterns: Pattern[] = studentHolds.map((item) => ({ slots: item.weeklySlots, duration: item.sessionDurationMin ?? 60, where: undefined }))

  const isFree = (day: number, startMin: number) => {
    const endMin = startMin + duration
    for (const pattern of tutorPatterns) {
      for (const slot of pattern.slots) {
        if (slot.day !== day) continue
        const otherStart = toMinutes(slot.start)
        const otherEnd = otherStart + pattern.duration
        if (startMin < otherEnd + travelMinutes(pattern.where, here) && otherStart < endMin + travelMinutes(here, pattern.where)) return false
      }
    }
    for (const pattern of studentPatterns) {
      for (const slot of pattern.slots) {
        if (slot.day !== day) continue
        const otherStart = toMinutes(slot.start)
        if (startMin < otherStart + pattern.duration && otherStart < endMin) return false
      }
    }
    for (const start of occurrences([{ day, start: hhmm(startMin) }], weeks, startDate)) {
      const end = start + duration * MIN_MS
      if (busy.some((other) => start < other.end + travelMinutes(other.where, here) * MIN_MS && other.start < end + travelMinutes(here, other.where) * MIN_MS)) return false
      if (studentSessions.some((other) => start < other.start.getTime() + other.durationMin * MIN_MS && other.start.getTime() < end)) return false
    }
    return true
  }
  return { isFree }
}

// Horas de inicio libres por día de la semana, dentro de las franjas del tutor
export function availableWeeklyStarts(offer: IOffer, duration: number, checker: WeeklyChecker): Array<{ day: number; starts: string[] }> {
  const days: Array<{ day: number; starts: string[] }> = []
  for (let day = 0; day < 7; day++) {
    const starts: string[] = []
    for (const window of offer.availability.filter((item) => item.day === day)) {
      for (let t = toMinutes(window.start); t + duration <= toMinutes(window.end); t += STEP_MIN) if (checker.isFree(day, t)) starts.push(hhmm(t))
    }
    if (starts.length > 0) days.push({ day, starts })
  }
  return days
}

// Valida los horarios fijos que elige el estudiante: cantidad, formato, dentro de las franjas del tutor,
// sin solaparse entre sí y sin choques
export function validateWeeklySlots(raw: unknown, offer: IOffer, duration: number, count: number, checker: WeeklyChecker): { slots: WeeklySlot[]; error?: string } {
  const fail = (error: string) => ({ slots: [], error })
  if (!Array.isArray(raw) || raw.length !== count) return fail(`Elige exactamente ${count} ${count === 1 ? 'horario fijo' : 'horarios fijos'} por semana.`)
  const slots: WeeklySlot[] = []
  for (const item of raw as Array<Record<string, unknown>>) {
    const day = Number(item?.day)
    const start = typeof item?.start === 'string' ? item.start : ''
    if (!Number.isInteger(day) || day < 0 || day > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || toMinutes(start) % STEP_MIN !== 0) return fail('Revisa los horarios: día y hora en bloques de 15 minutos.')
    const startMin = toMinutes(start)
    if (!offer.availability.some((window) => window.day === day && startMin >= toMinutes(window.start) && startMin + duration <= toMinutes(window.end))) {
      return fail(`El ${DAY_LONG[day]} a las ${start} no está dentro de los horarios del curso.`)
    }
    slots.push({ day, start })
  }
  slots.sort((a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start))
  for (let i = 1; i < slots.length; i++) {
    const previous = slots[i - 1]
    const current = slots[i]
    if (previous && current && current.day === previous.day && toMinutes(current.start) < toMinutes(previous.start) + duration) return fail('Tus horarios fijos se solapan entre sí.')
  }
  for (const slot of slots) {
    if (!checker.isFree(slot.day, toMinutes(slot.start))) return fail(`El ${DAY_LONG[slot.day]} a las ${slot.start} ya no está disponible. Elige otro horario.`)
  }
  return { slots }
}
