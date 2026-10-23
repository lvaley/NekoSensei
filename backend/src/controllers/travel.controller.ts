import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import { Offer } from '../models/Offer'
import { User } from '../models/User'
import { buildHomeTravel } from '../services/travel.service'

// Estudiante: calcula el traslado y la ruta de un curso a domicilio ANTES de solicitarlo
export async function previewOfferTravel(req: Request<{ id: string }>, res: Response): Promise<void> {
  const offer = isValidObjectId(req.params.id) ? await Offer.findOne({ _id: req.params.id, active: true }) : null
  const tutor = offer ? await User.findOne({ _id: offer.tutor, role: 'tutor', 'tutorProfile.status': 'approved' }) : null
  if (!offer || !tutor) {
    res.status(404).json({ message: 'Curso no encontrado' })
    return
  }
  if (!offer.modes.includes('student_home')) {
    res.status(400).json({ message: 'Este curso no se ofrece a domicilio.' })
    return
  }
  const student = await User.findById(req.auth?.sub)
  if (!student?.address || !tutor.address) {
    res.status(400).json({ message: 'Necesitamos tu dirección para calcular el traslado. Completa tu perfil.' })
    return
  }
  res.json(await buildHomeTravel({ tutor, student, offer, viewer: 'student', exactStudent: true, totalSessions: offer.totalSessions ?? 1 }))
}

// Tutor o estudiante de la inscripción: traslado y ruta de una inscripción a domicilio (pendiente o activa)
export async function enrollmentTravel(req: Request<{ id: string }>, res: Response): Promise<void> {
  const enrollment = isValidObjectId(req.params.id) ? await Enrollment.findById(req.params.id) : null
  const userId = req.auth?.sub
  const viewer = enrollment && String(enrollment.tutor) === userId ? 'tutor' : enrollment && String(enrollment.student) === userId ? 'student' : null
  if (!enrollment || !viewer) {
    res.status(404).json({ message: 'Inscripción no encontrada' })
    return
  }
  if (enrollment.mode !== 'student_home' || !['pending', 'awaiting_payment', 'active'].includes(enrollment.status)) {
    res.status(400).json({ message: 'El traslado solo aplica a inscripciones a domicilio pendientes o activas.' })
    return
  }
  const [offer, tutor, student] = await Promise.all([Offer.findById(enrollment.offer), User.findById(enrollment.tutor), User.findById(enrollment.student)])
  const result = tutor && student ? await buildHomeTravel({ tutor, student, offer, viewer, exactStudent: enrollment.status === 'active', totalSessions: enrollment.totalSessions ?? 1 }) : null
  if (!result) {
    res.status(400).json({ message: 'Falta la dirección del tutor o del estudiante para calcular el traslado.' })
    return
  }
  res.json(result)
}
