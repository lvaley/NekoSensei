import { Link } from 'react-router-dom'
import type { PublicTutor } from '../../types'
import { Avatar } from './Avatar'
import { money } from '../../utils/money'
import { StarRating } from './StarRating'

export function TutorCard({ tutor }: { tutor: PublicTutor }) {
  return (
    <article className="surface-card tutor-card">
      <div className="d-flex align-items-center gap-3 mb-3">
        <Avatar name={tutor.name} picture={tutor.picture} size={56} />
        <div className="min-w-0">
          <h3 className="h5 mb-0">{tutor.name}</h3>
          <small className="text-secondary">
            Desde {money(tutor.fromPrice)}/hora
            {tutor.distanceKm !== null && ` · a ${tutor.distanceKm} km`}
          </small>
        </div>
      </div>
      <div className="mb-2">
        <StarRating value={tutor.rating} count={tutor.reviewCount} />
      </div>
      <p className="text-secondary tutor-card__bio">{tutor.bio}</p>
      <div className="mode-list mb-3">
        {tutor.categories.slice(0, 4).map((name) => (
          <span key={name} className="badge-soft">
            {name}
          </span>
        ))}
      </div>
      <div className="d-flex justify-content-between align-items-center mt-auto">
        <small className="text-secondary">
          {tutor.offerCount} {tutor.offerCount === 1 ? 'curso' : 'cursos'}
        </small>
        <Link to={`/tutores/${tutor.id}`} className="btn btn-primary btn-sm">
          Ver perfil
        </Link>
      </div>
    </article>
  )
}
