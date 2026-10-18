import { model, Schema, Types } from 'mongoose'

export const USER_ROLES = ['student', 'tutor', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

// Roles que una persona puede elegir al registrarse (el administrador nunca se elige)
export const SELF_ASSIGNABLE_ROLES: readonly UserRole[] = ['student', 'tutor']

export const GENDERS = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'] as const
export type Gender = (typeof GENDERS)[number]

export const TUTOR_STATUSES = ['pending', 'approved', 'rejected'] as const
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
  },
  { timestamps: true },
)

export const User = model<IUser>('User', userSchema)
