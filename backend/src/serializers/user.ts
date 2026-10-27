import type { HydratedDocument } from 'mongoose'
import type { ISuspension, IUser } from '../models/User'

// Datos del propio usuario (sesión actual). El PDF de la hoja de vida nunca se envía aquí.
export function toSelfUser(user: HydratedDocument<IUser>) {
  const tutor = user.tutorProfile
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    // Los administradores no necesitan completar el onboarding
    onboardingCompleted: user.role === 'admin' ? true : user.onboardingCompleted,
    phone: user.phone,
    gender: user.gender,
    documentId: user.documentId,
    address: user.address ? { text: user.address.text, lat: user.address.lat, lng: user.address.lng } : undefined,
    categories: user.categories.map(String),
    suspension: user.suspended && user.suspension ? toSuspensionView(user.suspension) : undefined,
    tutor: tutor
      ? {
          bio: tutor.bio,
          hourlyRate: tutor.hourlyRate,
          portfolioUrl: tutor.portfolioUrl,
          cvFileName: tutor.cvFileName,
          hasCvFile: !!tutor.cvFileName,
          status: tutor.status,
          reviewNote: tutor.reviewNote,
        }
      : undefined,
  }
}

export function toSuspensionView(suspension: ISuspension) {
  const appeal = suspension.appeal
  return {
    reason: suspension.reason,
    suspendedAt: suspension.suspendedAt,
    appeal: appeal ? { message: appeal.message, sentAt: appeal.sentAt, status: appeal.status, response: appeal.response, respondedAt: appeal.respondedAt } : undefined,
  }
}
