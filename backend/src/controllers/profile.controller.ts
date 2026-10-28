import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Category } from '../models/Category'
import { GENDERS, SELF_ASSIGNABLE_ROLES, User } from '../models/User'
import type { Gender, UserRole } from '../models/User'
import { toSelfUser } from '../serializers/user'
import { notifyAdmins } from '../services/notify.service'

const MAX_PDF_BYTES = 2 * 1024 * 1024

type FieldErrors = Record<string, string>

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// Acepta el PDF como data URL o base64 y comprueba que realmente sea un PDF
function parsePdf(value: unknown): Buffer | string {
  const raw = text(value).replace(/^data:application\/pdf;base64,/, '')
  const buffer = Buffer.from(raw, 'base64')
  if (buffer.length === 0 || buffer.subarray(0, 4).toString() !== '%PDF') return 'El archivo debe ser un PDF válido.'
  if (buffer.length > MAX_PDF_BYTES) return 'El PDF no debe superar los 2 MB.'
  return buffer
}

// Onboarding (primer ingreso) y edición posterior del perfil
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth?.sub).select('+tutorProfile.cvFile')
  if (!user) {
    res.status(401).json({ message: 'Sesión inválida o expirada' })
    return
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const errors: FieldErrors = {}

  // El rol principal solo puede elegirse durante el onboarding (y nunca como administrador)
  let role: UserRole = user.role
  const firstTime = !user.onboardingCompleted && user.role !== 'admin'
  if (firstTime && body.role !== undefined) {
    if (SELF_ASSIGNABLE_ROLES.includes(body.role as UserRole)) role = body.role as UserRole
    else errors.role = 'Selecciona un rol válido.'
  }

  const phone = text(body.phone)
  if (!/^\d{8}$/.test(phone)) errors.phone = 'El teléfono debe tener exactamente 8 dígitos.'

  if (!GENDERS.includes(body.gender as Gender)) errors.gender = 'Selecciona una opción.'

  const documentId = text(body.documentId)
  if (!/^\d{13}$/.test(documentId)) errors.documentId = 'El DPI debe tener exactamente 13 dígitos.'

  const addressInput = (body.address ?? {}) as Record<string, unknown>
  const addressText = text(addressInput.text)
  const lat = Number(addressInput.lat)
  const lng = Number(addressInput.lng)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  if (addressText.length < 5 || addressText.length > 200) errors.addressText = 'Escribe tu dirección (5 a 200 caracteres).'
  if (!hasCoords) errors.location = 'Marca tu ubicación en el mapa.'

  const categoryIds = Array.isArray(body.categories) ? (body.categories as unknown[]).map(String) : []
  if (categoryIds.length < 1 || categoryIds.length > 10 || !categoryIds.every((id) => isValidObjectId(id))) {
    errors.categories = 'Elige entre 1 y 10 categorías de interés.'
  } else {
    const found = await Category.countDocuments({ _id: { $in: categoryIds }, active: true })
    if (found !== new Set(categoryIds).size) errors.categories = 'Alguna categoría elegida ya no está disponible.'
  }

  // Campos exclusivos de tutores
  let tutorUpdate: {
    bio: string
    hourlyRate: number
    portfolioUrl?: string
    cvFileName?: string
    cvFile?: Buffer
  } | null = null

  if (role === 'tutor') {
    const bio = text(body.bio)
    const hourlyRate = Number(body.hourlyRate)
    const portfolioUrl = text(body.portfolioUrl)
    const tutorInput = (body.cvFile ?? null) as { name?: unknown; data?: unknown } | null

    if (bio.length < 30 || bio.length > 1000) errors.bio = 'La biografía debe tener entre 30 y 1000 caracteres.'
    if (!Number.isFinite(hourlyRate) || hourlyRate < 1 || hourlyRate > 10000) errors.hourlyRate = 'Indica una tarifa por hora válida.'

    if (portfolioUrl && !/^https?:\/\/\S+\.\S+$/i.test(portfolioUrl)) errors.portfolioUrl = 'Escribe un enlace válido (http o https).'

    let cvFile: Buffer | undefined
    let cvFileName: string | undefined
    if (tutorInput?.data) {
      const parsed = parsePdf(tutorInput.data)
      if (typeof parsed === 'string') errors.cvFile = parsed
      else {
        cvFile = parsed
        cvFileName = text(tutorInput.name).slice(0, 120) || 'hoja-de-vida.pdf'
      }
    }

    const hasExistingCv = !!user.tutorProfile?.cvFileName
    if (!portfolioUrl && !cvFile && !hasExistingCv) errors.cv = 'Adjunta tu hoja de vida en PDF o un enlace a tu portafolio.'

    tutorUpdate = { bio, hourlyRate, portfolioUrl: portfolioUrl || undefined, cvFileName, cvFile }
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ message: 'Revisa los datos del formulario.', errors })
    return
  }

  user.role = role
  user.phone = phone
  user.gender = body.gender as Gender
  user.documentId = documentId
  user.address = { text: addressText, lat, lng }
  user.categories = categoryIds as unknown as typeof user.categories

  let applicationSent = false
  if (role === 'tutor' && tutorUpdate) {
    const previous = user.tutorProfile
    applicationSent = !previous || previous.status === 'rejected'
    user.tutorProfile = {
      bio: tutorUpdate.bio,
      hourlyRate: tutorUpdate.hourlyRate,
      portfolioUrl: tutorUpdate.portfolioUrl,
      cvFileName: tutorUpdate.cvFile ? tutorUpdate.cvFileName : previous?.cvFileName,
      cvFile: tutorUpdate.cvFile ?? previous?.cvFile,
      // Un perfil nuevo o rechazado vuelve a quedar pendiente de revisión
      status: !previous || previous.status === 'rejected' ? 'pending' : previous.status,
      reviewNote: !previous || previous.status === 'rejected' ? undefined : previous.reviewNote,
      reviewedAt: previous?.reviewedAt,
      reactivationRequest: previous?.reactivationRequest,
    }
  }

  user.onboardingCompleted = true
  await user.save()
  // Un perfil de tutor nuevo (o corregido tras un rechazo) queda esperando la revisión del administrador
  if (applicationSent) await notifyAdmins({ type: 'tutor_application', title: 'Perfil de tutor por revisar', message: `${user.name} envió su perfil de tutor para revisión.`, link: '/admin/tutores' })

  res.json({ user: toSelfUser(user) })
}
