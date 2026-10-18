import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Category } from '../models/Category'
import { TUTOR_STATUSES, User } from '../models/User'
import type { TutorStatus } from '../models/User'

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
      categories: tutor.categories.map((id) => nameById.get(String(id))).filter(Boolean),
      updatedAt: tutor.updatedAt,
    })),
  })
}

export async function reviewTutor(req: Request<{ id: string }>, res: Response): Promise<void> {
  const decision = req.body?.status as TutorStatus
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : ''

  if (decision !== 'approved' && decision !== 'rejected') {
    res.status(400).json({ message: 'La decisión debe ser "approved" o "rejected".' })
    return
  }
  if (decision === 'rejected' && note.length < 5) {
    res.status(400).json({ message: 'Indica el motivo del rechazo.' })
    return
  }

  const tutor = isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null
  if (!tutor || tutor.role !== 'tutor' || !tutor.tutorProfile) {
    res.status(404).json({ message: 'Tutor no encontrado' })
    return
  }

  tutor.tutorProfile.status = decision
  tutor.tutorProfile.reviewNote = note || undefined
  tutor.tutorProfile.reviewedAt = new Date()
  await tutor.save()

  res.json({ id: String(tutor._id), status: decision })
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
