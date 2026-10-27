import type { Request, Response } from 'express'
import { Category } from '../models/Category'
import { Offer } from '../models/Offer'
import { Review } from '../models/Review'
import { User } from '../models/User'

// Cifras públicas para la página de inicio: tutores aprobados, cursos activos y calificación,
// más cuántos cursos activos hay en cada categoría principal (incluye sus subcategorías)
export async function getPublicStats(_req: Request, res: Response): Promise<void> {
  const tutors = await User.find({ role: 'tutor', 'tutorProfile.status': 'approved', suspended: { $ne: true } }).select('_id')
  const tutorIds = tutors.map((tutor) => tutor._id)
  const [offers, reviews, categories] = await Promise.all([
    Offer.find({ active: true, tutor: { $in: tutorIds } }).select('category'),
    Review.find({ tutor: { $in: tutorIds } }).select('rating'),
    Category.find({ active: true }),
  ])

  const parentOf = new Map(categories.map((category) => [String(category._id), category.parent ? String(category.parent) : String(category._id)]))
  const perParent = new Map<string, number>()
  for (const offer of offers) {
    const parent = parentOf.get(String(offer.category))
    if (parent) perParent.set(parent, (perParent.get(parent) ?? 0) + 1)
  }

  res.json({
    tutors: tutors.length,
    courses: offers.length,
    reviews: reviews.length,
    rating: reviews.length > 0 ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : null,
    categories: categories.filter((category) => !category.parent).map((category) => ({ id: String(category._id), courses: perParent.get(String(category._id)) ?? 0 })),
  })
}
