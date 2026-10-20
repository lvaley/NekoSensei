import { Link } from 'react-router-dom'
import { MODE_LABELS } from '../../content/modes'
import type { PublicOffer } from '../../types'
import { money } from '../../utils/money'
import { Avatar } from './Avatar'

interface OfferCardProps {
  offer: PublicOffer
  // En el perfil de un tutor no hace falta repetir quién es
  showTutor?: boolean
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

export function OfferCard({ offer, showTutor = true }: OfferCardProps) {
  return (
    <article className="surface-card offer-card">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <span className="badge-soft">{offer.category.name}</span>
        <p className="offer-card__price">
          {money(offer.hourlyRate)}
          <small>/hora</small>
        </p>
      </div>
      <h3 className="h5 mt-2">{offer.title}</h3>
      <p className="text-secondary">{offer.description}</p>
      <div className="mode-list">
        {offer.modes.map((mode) => (
          <span key={mode} className="mode-pill">
            {MODE_LABELS[mode]}
          </span>
        ))}
      </div>
      <TravelNote offer={offer} />
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
