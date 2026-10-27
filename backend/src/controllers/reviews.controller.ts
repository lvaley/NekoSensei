import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import { MAX_COMMENT, MIN_COMMENT, Review } from '../models/Review'
import { Session } from '../models/Session'
import { User } from '../models/User'
import { notify, userName } from '../services/notify.service'
import { emptyRating, ratingsFor } from '../services/ratings.service'

// "Sofía Ramírez Pérez" → "Sofía R." (las reseñas son públicas y no muestran el nombre completo)
const shortName = (name: string) => {
  const [first = 'Estudiante', second] = name.trim().split(/\s+/)
  return second ? `${first} ${second.charAt(0).toUpperCase()}.` : first
}

// Reseñas públicas de un tutor, de la más reciente a la más antigua
export async function listTutorReviews(req: Request<{ id: string }>, res: Response): Promise<void> {
  const tutor = isValidObjectId(req.params.id) ? await User.findOne({ _id: req.params.id, role: 'tutor', 'tutorProfile.status': 'approved', suspended: { $ne: true } }) : null
  if (!tutor) {
    res.status(404).json({ message: 'Tutor no encontrado' })
    return
  }
  const reviews = await Review.find({ tutor: tutor._id }).sort({ createdAt: -1 }).limit(100)
  const students = await User.find({ _id: { $in: reviews.map((item) => item.student) } })
  const nameById = new Map(students.map((user) => [String(user._id), user.name]))
  const rating = (await ratingsFor([tutor._id])).get(String(tutor._id)) ?? emptyRating
  res.json({
    average: rating.average,
    count: rating.count,
    reviews: reviews.map((item) => ({ id: String(item._id), rating: item.rating, comment: item.comment, offerTitle: item.offerTitle, student: shortName(nameById.get(String(item.student)) ?? ''), createdAt: item.createdAt })),
  })
}

// El estudiante califica a su tutor (1 a 5) una vez que se realizó al menos una clase de la inscripción
export async function createReview(req: Request<{ id: string }>, res: Response): Promise<void> {
  const enrollment = isValidObjectId(req.params.id) ? await Enrollment.findById(req.params.id) : null
  if (!enrollment || String(enrollment.student) !== req.auth?.sub) {
    res.status(404).json({ message: 'Inscripción no encontrada' })
    return
  }
  const rating = Number(req.body?.rating)
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : ''
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ message: 'Elige una calificación de 1 a 5 estrellas.' })
    return
  }
  if (comment.length < MIN_COMMENT || comment.length > MAX_COMMENT) {
    res.status(400).json({ message: `Escribe un comentario de ${MIN_COMMENT} a ${MAX_COMMENT} caracteres.` })
    return
  }
  const completed = await Session.countDocuments({ enrollment: enrollment._id, status: 'completed' })
  if (completed === 0) {
    res.status(409).json({ message: 'Podrás calificar cuando se realice tu primera clase.' })
    return
  }
  if (await Review.exists({ enrollment: enrollment._id })) {
    res.status(409).json({ message: 'Ya calificaste este curso.' })
    return
  }

  const review = await Review.create({ tutor: enrollment.tutor, student: enrollment.student, enrollment: enrollment._id, offerTitle: enrollment.offerTitle, rating, comment })
  const author = await userName(enrollment.student)
  await notify({ user: enrollment.tutor, type: 'review_received', title: 'Nueva reseña', message: `${shortName(author)} te calificó con ${rating} ${rating === 1 ? 'estrella' : 'estrellas'} en «${enrollment.offerTitle}».`, link: `/tutores/${String(enrollment.tutor)}` })
  const summary = (await ratingsFor([enrollment.tutor])).get(String(enrollment.tutor)) ?? emptyRating
  res.status(201).json({ review: { id: String(review._id), rating, comment, createdAt: review.createdAt }, tutor: summary })
}
