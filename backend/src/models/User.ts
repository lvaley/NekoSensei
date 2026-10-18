import { model, Schema } from 'mongoose'

export const USER_ROLES = ['student', 'tutor', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

// Roles que una persona puede elegir al registrarse (el administrador nunca se elige)
export const SELF_ASSIGNABLE_ROLES: readonly UserRole[] = ['student', 'tutor']

export interface IUser {
  googleId: string
  email: string
  name: string
  picture?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    picture: { type: String },
    role: { type: String, enum: USER_ROLES, default: 'student', required: true },
  },
  { timestamps: true },
)

export const User = model<IUser>('User', userSchema)
