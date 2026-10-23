import type { Types } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import type { IEnrollment } from '../models/Enrollment'
import type { AvailabilityWindow, IOffer } from '../models/Offer'
import { Session } from '../models/Session'
import { User } from '../models/User'
import type { IUser } from '../models/User'
import { distanceKm } from './geo.service'

// Guatemala no usa horario de verano: UTC-6 todo el año
export const TZ_OFFSET_MIN = -360
export const STEP_MIN = 15
export const MAX_WINDOWS = 28
// Una clase no se puede agendar con menos de 2 horas de anticipación
const MIN_LEAD_MS = 2 * 3_600_000
const MIN_MS = 60_000
const DAY_MS = 86_400_000
// Traslado estimado: ~30 km/h en ciudad → 2 minutos por km, en bloques de 15 minutos
const MINUTES_PER_KM = 2

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
export const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

// Valida las franjas que envía el tutor: formato, múltiplos de 15 min, sin solaparse y con espacio para una clase
export function validateWindows(raw: unknown, sessionDurationMin: number): { windows: AvailabilityWindow[]; error?: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { windows: [], error: 'Agrega al menos un día y horario en que impartes el curso.' }
  if (raw.length > MAX_WINDOWS) return { windows: [], error: `Máximo ${MAX_WINDOWS} franjas horarias.` }

  const windows: AvailabilityWindow[] = []
  for (const item of raw as Array<Record<string, unknown>>) {
    const day = Number(item?.day)
    const start = typeof item?.start === 'string' ? item.start : ''
    const end = typeof item?.end === 'string' ? item.end : ''
    if (!Number.isInteger(day) || day < 0 || day > 6 || !TIME.test(start) || !TIME.test(end)) return { windows: [], error: 'Revisa los días y horas: usa el formato de 24 horas (HH:MM).' }
    if (toMinutes(start) % STEP_MIN !== 0 || toMinutes(end) % STEP_MIN !== 0) return { windows: [], error: 'Las horas deben ser en bloques de 15 minutos.' }
    if (toMinutes(end) - toMinutes(start) < sessionDurationMin) return { windows: [], error: `Cada franja debe durar al menos lo que una clase (${sessionDurationMin} minutos).` }
    windows.push({ day, start, end })
  }

  const sorted = [...windows].sort((a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start))
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1]
    const current = sorted[i]
    if (previous && current && current.day === previous.day && toMinutes(current.start) < toMinutes(previous.end)) return { windows: [], error: 'Hay franjas del mismo día que se solapan.' }
  }
  return { windows: sorted }
}

// Minutos de traslado entre dos ubicaciones (0 si no se conoce alguna o es el mismo lugar)
type Point = { lat: number; lng: number } | null | undefined
export function travelMinutes(a: Point, b: Point): number {
  if (!a || !b) return 0
  const km = distanceKm(a, b)
  if (km < 0.05) return 0
  return Math.ceil((km * MINUTES_PER_KM) / STEP_MIN) * STEP_MIN
}

interface Busy {
  start: number
  end: number
  where: Point
}

type Doc<T> = T & { _id: Types.ObjectId }

// Horarios (inicio de clase) disponibles para una inscripción entre dos instantes.
// Devuelve null si la oferta no tiene franjas definidas (ofertas antiguas: sin restricción).
export async function availableSlots(
  enrollment: Doc<IEnrollment>,
  offer: IOffer | null,
  tutor: IUser,
  student: IUser,
  fromMs: number,
  toMs: number,
  options: { checkStudent: boolean; ignoreSessionId?: Types.ObjectId } = { checkStudent: true },
): Promise<Date[] | null> {
  if (!offer || offer.availability.length === 0) return null
  const duration = enrollment.sessionDurationMin ?? 60

  // Clases ya programadas del tutor (con dónde ocurren) y del estudiante, con margen de un día
  const range = { $gte: new Date(fromMs - DAY_MS), $lte: new Date(toMs + DAY_MS) }
  // Al reagendar, la propia clase no cuenta como ocupada
  const notSelf = options.ignoreSessionId ? { _id: { $ne: options.ignoreSessionId } } : {}
  const tutorSessions = await Session.find({ tutor: enrollment.tutor, status: 'scheduled', start: range, ...notSelf })
  const studentSessions = options.checkStudent ? await Session.find({ student: enrollment.student, status: 'scheduled', start: range, ...notSelf }) : []
  const enrollments = await Enrollment.find({ _id: { $in: tutorSessions.map((session) => session.enrollment) } })
  const modeById = new Map(enrollments.map((item) => [String(item._id), item.mode]))
  const studentUsers = await User.find({ _id: { $in: tutorSessions.map((session) => session.student) } })
  const addressById = new Map(studentUsers.map((user) => [String(user._id), user.address as Point]))

  // Dónde se da cada clase: a domicilio en la casa del estudiante, el resto en la base del tutor
  const tutorBase: Point = tutor.address
  const busy: Busy[] = tutorSessions.map((session) => ({
    start: session.start.getTime(),
    end: session.start.getTime() + session.durationMin * MIN_MS,
    where: modeById.get(String(session.enrollment)) === 'student_home' ? addressById.get(String(session.student)) : tutorBase,
  }))
  const here: Point = enrollment.mode === 'student_home' ? student.address : tutorBase

  const slots: Date[] = []
  const earliest = Math.max(fromMs, Date.now() + MIN_LEAD_MS)
  const latest = Math.min(toMs, Date.now() + 180 * DAY_MS)
  // Medianoche local de hoy (en milisegundos UTC)
  const shiftedNow = new Date(Date.now() + TZ_OFFSET_MIN * MIN_MS)
  const todayMid = Date.UTC(shiftedNow.getUTCFullYear(), shiftedNow.getUTCMonth(), shiftedNow.getUTCDate())

  for (let i = 0; i <= 181; i++) {
    const dayMid = todayMid + i * DAY_MS
    const weekday = new Date(dayMid).getUTCDay()
    for (const window of offer.availability.filter((item) => item.day === weekday)) {
      for (let t = toMinutes(window.start); t + duration <= toMinutes(window.end); t += STEP_MIN) {
        const start = dayMid - TZ_OFFSET_MIN * MIN_MS + t * MIN_MS
        const end = start + duration * MIN_MS
        if (start < earliest || start > latest) continue

        // Choque con otra clase del tutor, dejando el tiempo de traslado entre una ubicación y otra
        const tutorClash = busy.some((other) => start < other.end + travelMinutes(other.where, here) * MIN_MS && other.start < end + travelMinutes(here, other.where) * MIN_MS)
        if (tutorClash) continue
        if (studentSessions.some((other) => start < other.start.getTime() + other.durationMin * MIN_MS && other.start.getTime() < end)) continue
        slots.push(new Date(start))
      }
    }
  }
  return slots
}
