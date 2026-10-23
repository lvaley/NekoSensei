import { model, Schema, Types } from 'mongoose'

// Modalidades de clase: virtual, en casa del tutor o en casa del estudiante (esta última puede tener costo de traslado)
export const TEACHING_MODES = ['virtual', 'tutor_home', 'student_home'] as const
export type TeachingMode = (typeof TEACHING_MODES)[number]

// Tipo de clase: individual (1 a 1) o grupal (con cupos limitados)
export const CLASS_TYPES = ['individual', 'group'] as const
export type ClassType = (typeof CLASS_TYPES)[number]
export const MAX_GROUP_SIZE = 20

// Plan de suscripción: el tutor define cuántas semanas dura el bloque y cuántas clases por semana
export const MAX_WEEKS = 26
export const MAX_PER_WEEK = 7

// Nivel del curso: para quién está pensado
export const COURSE_LEVELS = ['basic', 'intermediate', 'advanced'] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]

// Franja semanal en la que el tutor imparte clases de un curso (hora de Guatemala, "HH:MM")
export interface AvailabilityWindow {
  day: number // 0 = domingo … 6 = sábado
  start: string
  end: string
}

export interface IOffer {
  tutor: Types.ObjectId
  title: string
  description: string
  category: Types.ObjectId
  modes: TeachingMode[]
  // Precio por hora de la clase (en quetzales)
  hourlyRate: number
  level: CourseLevel
  // Enlace de la reunión (Meet, Zoom…): obligatorio si el curso incluye la modalidad virtual. No es público.
  meetingUrl: string
  // Días y horarios en que se imparte el curso. Las clases solo se agendan dentro de estas franjas.
  availability: AvailabilityWindow[]
  // Individual: 1 estudiante por inscripción. Grupal: hasta maxStudents estudiantes activos a la vez (2 a 20)
  classType: ClassType
  maxStudents: number
  // Plan: semanas del bloque y clases por semana. totalSessions = weeks × sessionsPerWeek.
  // Las ofertas anteriores no tienen plan (solo totalSessions) y se agendan clase por clase.
  weeks?: number
  sessionsPerWeek?: number
  // Alcance del curso: cuántas clases incluye y cuánto dura cada una
  totalSessions: number
  sessionDurationMin: number
  // Solo aplica a la modalidad "en casa del estudiante": tarifa por km y distancia máxima que el tutor viaja
  travelFeePerKm: number
  maxTravelKm: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const windowSchema = new Schema<AvailabilityWindow>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    end: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  },
  { _id: false },
)

const offerSchema = new Schema<IOffer>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 800 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    modes: { type: [{ type: String, enum: TEACHING_MODES }], validate: (value: string[]) => value.length > 0 },
    hourlyRate: { type: Number, required: true, min: 1, max: 10000 },
    // Las ofertas anteriores no tienen franjas: se agendan sin restricción hasta que el tutor las defina
    availability: { type: [windowSchema], default: [] },
    meetingUrl: { type: String, trim: true, maxlength: 300, default: '' },
    // Las ofertas anteriores se leen como clases individuales
    classType: { type: String, enum: CLASS_TYPES, default: 'individual' },
    maxStudents: { type: Number, default: 1, min: 1, max: MAX_GROUP_SIZE },
    // Las ofertas anteriores a esta versión se leen como nivel básico
    level: { type: String, enum: COURSE_LEVELS, default: 'basic' },
    weeks: { type: Number, min: 1, max: MAX_WEEKS },
    sessionsPerWeek: { type: Number, min: 1, max: MAX_PER_WEEK },
    // Las ofertas anteriores a esta versión se leen como 1 clase de 60 minutos
    totalSessions: { type: Number, default: 1, min: 1, max: MAX_WEEKS * MAX_PER_WEEK },
    sessionDurationMin: { type: Number, default: 60, min: 30, max: 240 },
    travelFeePerKm: { type: Number, default: 0, min: 0, max: 100 },
    maxTravelKm: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Offer = model<IOffer>('Offer', offerSchema)
