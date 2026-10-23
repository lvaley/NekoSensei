import { model, Schema, Types } from 'mongoose'

// Clase agendada dentro de una inscripción activa
export const SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

// Solicitud de reagendar una clase a domicilio: la pide el estudiante y la gestiona el tutor
export const RESCHEDULE_STATUSES = ['requested', 'proposed', 'declined', 'rejected'] as const
export type RescheduleStatus = (typeof RESCHEDULE_STATUSES)[number]

export interface IReschedule {
  status: RescheduleStatus
  reason: string
  requestedAt: Date
  // Nuevo horario que propone el tutor (espera la respuesta del estudiante)
  proposedStart?: Date
  // Nota del tutor: motivo del rechazo o comentario de la propuesta
  tutorNote?: string
}

export interface ISession {
  enrollment: Types.ObjectId
  // Oferta del curso: las clases grupales comparten oferta, inicio y duración
  offer?: Types.ObjectId
  tutor: Types.ObjectId
  student: Types.ObjectId
  start: Date
  durationMin: number
  status: SessionStatus
  note?: string
  reschedule?: IReschedule
  rescheduleCount?: number
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const rescheduleSchema = new Schema<IReschedule>(
  {
    status: { type: String, enum: RESCHEDULE_STATUSES, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    requestedAt: { type: Date, required: true },
    proposedStart: { type: Date },
    tutorNote: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false },
)

const sessionSchema = new Schema<ISession>(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    offer: { type: Schema.Types.ObjectId, ref: 'Offer', index: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    start: { type: Date, required: true },
    durationMin: { type: Number, required: true, min: 30, max: 240 },
    status: { type: String, enum: SESSION_STATUSES, default: 'scheduled' },
    note: { type: String, trim: true, maxlength: 300 },
    reschedule: { type: rescheduleSchema },
    rescheduleCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

export const Session = model<ISession>('Session', sessionSchema)
