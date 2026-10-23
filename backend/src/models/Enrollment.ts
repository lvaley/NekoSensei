import { model, Schema, Types } from 'mongoose'
import { CLASS_TYPES, COURSE_LEVELS, TEACHING_MODES } from './Offer'
import type { ClassType, CourseLevel, TeachingMode } from './Offer'

// Una inscripción es la suscripción de un estudiante a un curso de un tutor:
// nace "pendiente", el tutor la acepta (activa) o rechaza, y termina cancelada o finalizada.
// pending: espera al tutor · awaiting_payment: el tutor aceptó y falta pagar · active: pagada · expired: no se pagó a tiempo
export const ENROLLMENT_STATUSES = ['pending', 'awaiting_payment', 'active', 'rejected', 'cancelled', 'finished', 'expired'] as const
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number]

// Día de la semana (0 = domingo) y hora de inicio fijos de una clase recurrente
export interface WeeklySlot {
  day: number
  start: string
}

// Cobro pendiente: el primer pago del bloque (tras aceptar el tutor) o una renovación
export interface ICharge {
  kind: 'initial' | 'renewal'
  classes: number
  travel: number
  total: number
  dueAt: Date
  // Día (yyyy-mm-dd, hora de Guatemala) desde el que se generan las clases del bloque
  startDate: string
}

export interface IEnrollment {
  student: Types.ObjectId
  tutor: Types.ObjectId
  offer: Types.ObjectId
  // Copia de los datos del curso al momento de solicitarlo (si el tutor edita o borra la oferta, el historial no cambia)
  offerTitle: string
  categoryName: string
  hourlyRate: number
  level: CourseLevel
  classType: ClassType
  maxStudents: number
  totalSessions: number
  sessionDurationMin: number
  // Plan contratado (ofertas con plan): semanas y clases por semana de cada bloque, y horarios fijos del estudiante
  weeks?: number
  sessionsPerWeek?: number
  weeklySlots: WeeklySlot[]
  startDate?: string
  // Número de bloque (1 = el primero; sube con cada renovación)
  cycle: number
  charge?: ICharge
  paidAt?: Date
  mode: TeachingMode
  note?: string
  status: EnrollmentStatus
  decisionNote?: string
  decidedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const weeklySlotSchema = new Schema<WeeklySlot>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  },
  { _id: false },
)

const chargeSchema = new Schema<ICharge>(
  {
    kind: { type: String, enum: ['initial', 'renewal'], required: true },
    classes: { type: Number, required: true },
    travel: { type: Number, required: true },
    total: { type: Number, required: true },
    dueAt: { type: Date, required: true },
    startDate: { type: String, required: true },
  },
  { _id: false },
)

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offer: { type: Schema.Types.ObjectId, ref: 'Offer', required: true },
    offerTitle: { type: String, required: true },
    categoryName: { type: String, default: '' },
    hourlyRate: { type: Number, required: true },
    level: { type: String, enum: COURSE_LEVELS, default: 'basic' },
    classType: { type: String, enum: CLASS_TYPES, default: 'individual' },
    maxStudents: { type: Number, default: 1 },
    totalSessions: { type: Number, default: 1 },
    sessionDurationMin: { type: Number, default: 60 },
    weeks: { type: Number },
    sessionsPerWeek: { type: Number },
    weeklySlots: { type: [weeklySlotSchema], default: [] },
    startDate: { type: String },
    cycle: { type: Number, default: 1 },
    charge: { type: chargeSchema },
    paidAt: { type: Date },
    mode: { type: String, enum: TEACHING_MODES, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ENROLLMENT_STATUSES, default: 'pending' },
    decisionNote: { type: String, trim: true, maxlength: 500 },
    decidedAt: { type: Date },
  },
  { timestamps: true },
)

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema)
