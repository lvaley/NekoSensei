import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { TutorReviewsResponse } from '../../types'
import { StarRating } from './StarRating'
import { LinesSkeleton } from './Skeleton'

// Reseñas públicas de un tutor (la más reciente primero). Se vuelven a pedir cuando cambia el contador.
export function TutorReviews({ tutorId, count }: { tutorId: string; count: number }) {
  const key = `${tutorId}:${count}`
  const [result, setResult] = useState<{ key: string; data: TutorReviewsResponse | null } | null>(null)

  useEffect(() => {
    let active = true
    api
      .get<TutorReviewsResponse>(`/tutors/${tutorId}/reviews`)
      .then((res) => active && setResult({ key, data: res.data }))
      .catch(() => active && setResult({ key, data: null }))
    return () => {
      active = false
    }
  }, [tutorId, key])

  if (count === 0) return <p className="text-secondary">Este tutor aún no tiene reseñas.</p>
  if (result?.key !== key) return <LinesSkeleton lines={3} label="Cargando reseñas" />
  if (!result.data) return <p className="text-secondary">No pudimos cargar las reseñas.</p>

  return (
    <div className="d-grid gap-3">
      {result.data.reviews.map((review) => (
        <article key={review.id} className="surface-card review-card">
          <div className="d-flex flex-wrap justify-content-between gap-2">
            <StarRating value={review.rating} />
            <small className="text-secondary">{new Date(review.createdAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
          </div>
          <p className="mb-1 mt-2">{review.comment}</p>
          <small className="text-secondary">
            {review.student} · {review.offerTitle}
          </small>
        </article>
      ))}
    </div>
  )
}
