import { model, Schema, Types } from 'mongoose'

export const USER_ROLES = ['student', 'tutor', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

// Roles que una persona puede elegir al registrarse (el administrador nunca se elige)
export const SELF_ASSIGNABLE_ROLES: readonly UserRole[] = ['student', 'tutor']

export const GENDERS = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'] as const
export type Gender = (typeof GENDERS)[number]

export const TUTOR_STATUSES = ['pending', 'approved', 'rejected', 'inactive'] as const
export type TutorStatus = (typeof TUTOR_STATUSES)[number]

export interface IAddress {
  text: string
  lat: number
  lng: number
}

export interface ITutorProfile {
  bio: string
  // Tarifa base por hora (en quetzales)
  hourlyRate: number
  // Hoja de vida: enlace a portafolio y/o PDF subido
  portfolioUrl?: string
  cvFileName?: string
  cvFile?: Buffer
  status: TutorStatus
  reviewNote?: string
  reviewedAt?: Date
  // Un tutor inactivo puede pedir que lo reactiven; el administrador decide
  reactivationRequest?: { message: string; sentAt: Date }
}

export const APPEAL_STATUSES = ['pending', 'rejected'] as const
export type AppealStatus = (typeof APPEAL_STATUSES)[number]

// Apelación que envía una persona suspendida; el administrador la acepta (se reactiva la cuenta) o la rechaza con una respuesta
export interface IAppeal {
  message: string
  sentAt: Date
  status: AppealStatus
  response?: string
  respondedAt?: Date
}

export interface ISuspension {
  reason: string
  suspendedAt: Date
  suspendedBy: Types.ObjectId
  report?: Types.ObjectId
  appeal?: IAppeal
}

export interface IUser {
  googleId: string
  email: string
  name: string
  picture?: string
  role: UserRole
  // Onboarding: datos complementarios obligatorios en el primer ingreso
  onboardingCompleted: boolean
  phone?: string
  gender?: Gender
  documentId?: string
  address?: IAddress
  categories: Types.ObjectId[]
  tutorProfile?: ITutorProfile
  // Cuenta bloqueada por el administrador: puede iniciar sesión, pero solo ve la pantalla de suspensión y la apelación
  suspended: boolean
  suspension?: ISuspension
  createdAt: Date
  updatedAt: Date
}

const addressSchema = new Schema<IAddress>(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
)

const tutorProfileSchema = new Schema<ITutorProfile>(
  {
    bio: { type: String, required: true, trim: true, maxlength: 1000 },
    hourlyRate: { type: Number, required: true, min: 1, max: 10000 },
    portfolioUrl: { type: String, trim: true, maxlength: 300 },
    cvFileName: { type: String, trim: true, maxlength: 120 },
    // El PDF no se incluye en las consultas normales (solo cuando se pide explícitamente)
    cvFile: { type: Buffer, select: false },
    status: { type: String, enum: TUTOR_STATUSES, default: 'pending' },
    reviewNote: { type: String, trim: true, maxlength: 500 },
    reviewedAt: { type: Date },
    reactivationRequest: { type: new Schema({ message: { type: String, required: true, maxlength: 500 }, sentAt: { type: Date, required: true } }, { _id: false }) },
  },
  { _id: false },
)

const appealSchema = new Schema<IAppeal>(
  {
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    sentAt: { type: Date, required: true },
    status: { type: String, enum: APPEAL_STATUSES, default: 'pending' },
    response: { type: String, trim: true, maxlength: 500 },
    respondedAt: { type: Date },
  },
  { _id: false },
)

const suspensionSchema = new Schema<ISuspension>(
  {
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    suspendedAt: { type: Date, required: true },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    report: { type: Schema.Types.ObjectId, ref: 'Report' },
    appeal: { type: appealSchema },
  },
  { _id: false },
)

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    picture: { type: String },
    role: { type: String, enum: USER_ROLES, default: 'student', required: true },
    onboardingCompleted: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    gender: { type: String, enum: GENDERS },
    documentId: { type: String, trim: true },
    address: { type: addressSchema },
    categories: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [] },
    tutorProfile: { type: tutorProfileSchema },
    suspended: { type: Boolean, default: false },
    suspension: { type: suspensionSchema },
  },
  { timestamps: true },
)

export const User = model<IUser>('User', userSchema)
