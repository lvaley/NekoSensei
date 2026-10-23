import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MODE_LABELS } from '../../content/modes'
import type { PublicOffer } from '../../types'
import { summarizeAvailability } from '../../utils/availability'
import { courseTotal, scopeLabel } from '../../utils/course'
import { money } from '../../utils/money'
import { Avatar } from './Avatar'
import { ClassTypeBadge } from './ClassTypeBadge'
import { LevelBadge } from './LevelBadge'

interface OfferCardProps {
  offer: PublicOffer
  // En el perfil de un tutor no hace falta repetir quién es
  showTutor?: boolean
  // Acción opcional al pie (por ejemplo, solicitar el curso)
  footer?: ReactNode
}

// Resumen de distancia y traslado para la modalidad a domicilio
function TravelNote({ offer }: { offer: PublicOffer }) {
  if (!offer.modes.includes('student_home')) return null
  if (offer.distanceKm === null) {
    return <p className="offer-card__travel">Traslado: {money(offer.travelFeePerKm)} por km, hasta {offer.maxTravelKm} km.</p>
  }
  if (!offer.inTravelRange) {
    return (
      <p className="offer-card__travel is-out">
        A {offer.distanceKm} km de ti: fuera del alcance a domicilio ({offer.maxTravelKm} km). Disponible virtual o en casa del tutor.
      </p>
    )
  }
  return (
    <p className="offer-card__travel">
      <i className="bi bi-geo-alt me-1" aria-hidden="true" />A {offer.distanceKm} km de ti · traslado estimado <strong>{money(offer.travelCost ?? 0)}</strong>
    </p>
  )
}

export function OfferCard({ offer, showTutor = true, footer }: OfferCardProps) {
  return (
    <article className="surface-card offer-card">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div className="d-flex flex-wrap gap-2">
          <span className="badge-soft">{offer.category.name}</span>
          <LevelBadge level={offer.level} />
          <ClassTypeBadge classType={offer.classType} maxStudents={offer.maxStudents} seatsLeft={offer.seatsLeft} />
        </div>
        <p className="offer-card__price">
          {money(offer.hourlyRate)}
          <small>/hora</small>
        </p>
      </div>
      <h3 className="h5 mt-2">{offer.title}</h3>
      <p className="text-secondary">{offer.description}</p>
      <p className="offer-card__scope">
        <i className="bi bi-collection me-2" aria-hidden="true" />
        <span>
          {scopeLabel(offer)}
          <small>{offer.weeks ? 'Precio del bloque' : 'Total estimado del curso'}: {money(courseTotal(offer.hourlyRate, offer.totalSessions, offer.sessionDurationMin))}</small>
        </span>
      </p>
      {offer.availability.length > 0 && (
        <p className="offer-card__schedule">
          <i className="bi bi-clock me-2" aria-hidden="true" />
          {summarizeAvailability(offer.availability)}
        </p>
      )}
      <div className="mode-list">
        {offer.modes.map((mode) => (
          <span key={mode} className="mode-pill">
            {MODE_LABELS[mode]}
          </span>
        ))}
      </div>
      <TravelNote offer={offer} />
      {footer}
      {showTutor && (
        <Link to={`/tutores/${offer.tutor.id}`} className="offer-card__tutor">
          <Avatar name={offer.tutor.name} picture={offer.tutor.picture} size={36} />
          <span>{offer.tutor.name}</span>
          <i className="bi bi-arrow-right ms-auto" aria-hidden="true" />
        </Link>
      )}
    </article>
  )
}
