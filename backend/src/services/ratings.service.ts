import type { Types } from 'mongoose'
import { Review } from '../models/Review'

export interface RatingSummary {
  average: number | null
  count: number
}

// Promedio y cantidad de reseñas por tutor. Se calcula al consultar, así que cada reseña nueva se refleja de inmediato.
export async function ratingsFor(tutorIds: Array<Types.ObjectId | string>): Promise<Map<string, RatingSummary>> {
  const reviews = await Review.find({ tutor: { $in: tutorIds } }).select('tutor rating')
  const sums = new Map<string, { total: number; count: number }>()
  for (const review of reviews) {
    const key = String(review.tutor)
    const current = sums.get(key) ?? { total: 0, count: 0 }
    sums.set(key, { total: current.total + review.rating, count: current.count + 1 })
  }
  return new Map([...sums].map(([key, { total, count }]) => [key, { average: Math.round((total / count) * 10) / 10, count }]))
}

export const emptyRating: RatingSummary = { average: null, count: 0 }
