import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Category } from '../models/Category'
import { TUTOR_STATUSES, User } from '../models/User'
import type { TutorStatus } from '../models/User'
import { notify, notifyAdmins } from '../services/notify.service'

// Solicitudes de tutores para revisión (admin). Por defecto, las pendientes.
export async function listTutorApplications(req: Request, res: Response): Promise<void> {
  const status = TUTOR_STATUSES.includes(req.query.status as TutorStatus) ? (req.query.status as TutorStatus) : 'pending'
  const tutors = await User.find({ role: 'tutor', 'tutorProfile.status': status }).sort({ updatedAt: -1 }).limit(200)

  const categoryIds = [...new Set(tutors.flatMap((tutor) => tutor.categories.map(String)))]
  const categories = await Category.find({ _id: { $in: categoryIds } })
  const nameById = new Map(categories.map((category) => [String(category._id), category.name]))

  res.json({
    tutors: tutors.map((tutor) => ({
      id: String(tutor._id),
      name: tutor.name,
      email: tutor.email,
      picture: tutor.picture,
      phone: tutor.phone,
      documentId: tutor.documentId,
      address: tutor.address?.text,
      bio: tutor.tutorProfile?.bio,
      hourlyRate: tutor.tutorProfile?.hourlyRate,
      portfolioUrl: tutor.tutorProfile?.portfolioUrl,
      cvFileName: tutor.tutorProfile?.cvFileName,
      status: tutor.tutorProfile?.status,
      reviewNote: tutor.tutorProfile?.reviewNote,
      reactivationRequest: tutor.tutorProfile?.reactivationRequest ? { message: tutor.tutorProfile.reactivationRequest.message, sentAt: tutor.tutorProfile.reactivationRequest.sentAt } : null,
      categories: tutor.categories.map((id) => nameById.get(String(id))).filter(Boolean),
      updatedAt: tutor.updatedAt,
    })),
  })
}

export async function reviewTutor(req: Request<{ id: string }>, res: Response): Promise<void> {
  const decision = req.body?.status as TutorStatus
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : ''

  if (decision !== 'approved' && decision !== 'rejected' && decision !== 'inactive') {
    res.status(400).json({ message: 'La decisión debe ser "approved", "rejected" o "inactive".' })
    return
  }
  if (decision !== 'approved' && note.length < 5) {
    res.status(400).json({ message: decision === 'rejected' ? 'Indica el motivo del rechazo.' : 'Indica el motivo.' })
    return
  }

  const tutor = isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null
  if (!tutor || tutor.role !== 'tutor' || !tutor.tutorProfile) {
    res.status(404).json({ message: 'Tutor no encontrado' })
    return
  }

  // Rechazar es para perfiles en revisión; a un tutor aprobado se le inactiva. Inactivo también se usa para responder una solicitud de reactivación.
  const previous = tutor.tutorProfile.status
  if (decision === 'rejected' && (previous === 'approved' || previous === 'inactive')) {
    res.status(409).json({ message: 'Un tutor aprobado no se rechaza: inactívalo.' })
    return
  }
  if (decision === 'inactive' && previous !== 'approved' && previous !== 'inactive') {
    res.status(409).json({ message: 'Solo se inactiva a un tutor aprobado.' })
    return
  }

  tutor.tutorProfile.status = decision
  tutor.tutorProfile.reviewNote = note || undefined
  tutor.tutorProfile.reviewedAt = new Date()
  tutor.tutorProfile.reactivationRequest = undefined
  await tutor.save()

  if (decision === 'inactive') {
    await notify(previous === 'inactive'
      ? { user: tutor._id, type: 'tutor_inactivated', title: 'Tu solicitud de reactivación no fue aprobada', message: `Respuesta del administrador: ${note}`, link: '/panel' }
      : { user: tutor._id, type: 'tutor_inactivated', title: 'Tu cuenta de tutor fue inactivada', message: `Motivo: ${note} Tus alumnos actuales terminan sus cursos, pero no recibirás solicitudes nuevas.`, link: '/panel' })
  }
  if (decision === 'approved' && previous === 'inactive') {
    await notify({ user: tutor._id, type: 'tutor_reactivated', title: 'Tu cuenta de tutor fue reactivada', message: 'Vuelves a aparecer en el catálogo y puedes recibir solicitudes nuevas.', link: '/mis-ofertas' })
  }

  res.json({ id: String(tutor._id), status: decision })
}

// El tutor inactivo pide que lo reactiven, explicando su caso; el administrador recibe un aviso
export async function requestReactivation(req: Request, res: Response): Promise<void> {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
  if (message.length < 10 || message.length > 500) {
    res.status(400).json({ message: 'Cuéntanos tu caso en 10 a 500 caracteres.' })
    return
  }
  const tutor = await User.findById(req.auth?.sub)
  if (!tutor || tutor.role !== 'tutor' || tutor.tutorProfile?.status !== 'inactive') {
    res.status(409).json({ message: 'Tu cuenta de tutor no está inactiva.' })
    return
  }
  if (tutor.tutorProfile.reactivationRequest) {
    res.status(409).json({ message: 'Ya enviaste una solicitud; espera la respuesta del administrador.' })
    return
  }
  tutor.tutorProfile.reactivationRequest = { message, sentAt: new Date() }
  await tutor.save()
  await notifyAdmins({ type: 'tutor_reactivation_request', title: 'Solicitud de reactivación', message: `${tutor.name} pide reactivar su cuenta de tutor.`, link: '/admin/tutores' })
  res.status(201).json({ ok: true })
}

// Descarga de la hoja de vida en PDF (solo admin; el JWT viaja en el header)
export async function downloadTutorCv(req: Request<{ id: string }>, res: Response): Promise<void> {
  const tutor = isValidObjectId(req.params.id) ? await User.findById(req.params.id).select('+tutorProfile.cvFile') : null
  const file = tutor?.tutorProfile?.cvFile
  if (!tutor || !file) {
    res.status(404).json({ message: 'Hoja de vida no encontrada' })
    return
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${(tutor.tutorProfile?.cvFileName ?? 'hoja-de-vida.pdf').replace(/"/g, '')}"`)
  res.send(file)
}
