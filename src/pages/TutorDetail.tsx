import { useEffect, useMemo, useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { EnrollButton } from '../components/enrollments/EnrollButton'
import { MessageButton } from '../components/ui/MessageButton'
import { ShareWhatsApp } from '../components/ui/ShareWhatsApp'
import { StarRating } from '../components/ui/StarRating'
import { TutorReviews } from '../components/ui/TutorReviews'
import { OfferCard } from '../components/ui/OfferCard'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useEnrollments } from '../hooks/useEnrollments'
import { api } from '../services/api'
import type { TutorDetail as TutorDetailData } from '../types'
import { money } from '../utils/money'
import { ProfileSkeleton } from '../components/ui/Skeleton'

export function TutorDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { hash } = useLocation()
  const mine = useEnrollments(user?.role === 'student')
  const openByOffer = new Map((mine.items ?? []).filter((item) => item.status === 'pending' || item.status === 'awaiting_payment' || item.status === 'active').map((item) => [item.offer.id, item]))
  const [data, setData] = useState<TutorDetailData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  useDocumentTitle(data?.tutor.name ?? 'Tutor')

  // Los enlaces directos a las reseñas (#resenas) bajan hasta la sección cuando ya cargó el perfil
  useEffect(() => {
    if (status !== 'ready' || hash !== '#resenas') return
    const timer = window.setTimeout(() => document.getElementById('resenas')?.scrollIntoView({ behavior: 'smooth' }), 150)
    return () => window.clearTimeout(timer)
  }, [status, hash])

  const lat = user?.address?.lat
  const lng = user?.address?.lng
  const query = useMemo(() => (lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : ''), [lat, lng])

  useEffect(() => {
    let cancelled = false
    api
      .get<TutorDetailData>(`/tutors/${id}${query}`)
      .then((res) => {
        if (cancelled) return
        setData(res.data)
        setStatus('ready')
      })
      .catch((error: { response?: { status?: number } }) => {
        if (!cancelled) setStatus(error.response?.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [id, query])

  if (status === 'loading') return <ProfileSkeleton />

  if (status !== 'ready' || !data) {
    return (
      <Container className="page-container text-center">
        <div className="surface-card mx-auto" style={{ maxWidth: 560 }}>
          <h1 className="h3">{status === 'missing' ? 'Este tutor no está disponible' : 'No pudimos cargar el perfil'}</h1>
          <p className="text-secondary">{status === 'missing' ? 'Puede que el perfil ya no esté publicado.' : 'Intenta de nuevo en unos segundos.'}</p>
          <Link to="/tutores" className="btn btn-primary">
            Ver todos los tutores
          </Link>
        </div>
      </Container>
    )
  }

  const { tutor, offers } = data

  return (
    <Container className="page-container">
      <Link to="/tutores" className="d-inline-block mb-3 text-decoration-none">
        <i className="bi bi-arrow-left me-1" aria-hidden="true" />
        Todos los tutores
      </Link>
      <div className="surface-card tutor-profile">
        <Avatar name={tutor.name} picture={tutor.picture} size={96} />
        <div>
          <p className="eyebrow mb-1">Tutor verificado</p>
          <h1 className="h2 mb-2">{tutor.name}</h1>
          <div className="mb-3">
            <StarRating value={tutor.rating} count={tutor.reviewCount} size="lg" />
          </div>
          <div className="mode-list mb-3">
            {tutor.categories.map((name) => (
              <span key={name} className="badge-soft">
                {name}
              </span>
            ))}
          </div>
          <p>{tutor.bio}</p>
          <p className="text-secondary mb-0">
            Tarifa base: <strong>{money(tutor.hourlyRate)}/hora</strong>
            {tutor.distanceKm !== null && <> · a {tutor.distanceKm} km de tu dirección</>}
          </p>
          <div className="d-flex flex-wrap gap-2 mt-3">
            {user?.role === 'student' && <MessageButton userId={tutor.id} variant="primary" />}
            <ShareWhatsApp tutor={tutor} offerCount={offers.length} />
          </div>
          {tutor.portfolioUrl && (
            <a href={tutor.portfolioUrl} target="_blank" rel="noopener noreferrer" className="d-inline-block mt-2">
              <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
              Ver portafolio
            </a>
          )}
        </div>
      </div>

      <h2 className="h4 mt-5 mb-3">Cursos de {tutor.name.split(' ')[0]}</h2>
      {offers.length === 0 ? (
        <Alert variant="light" className="border">
          Este tutor aún no ha publicado cursos.
        </Alert>
      ) : (
        <Row className="g-4">
          {offers.map((offer) => (
            <Col md={6} key={offer.id}>
              <OfferCard offer={offer} showTutor={false} footer={<EnrollButton offer={offer} current={openByOffer.get(offer.id)} onRequested={() => void mine.reload()} />} />
            </Col>
          ))}
        </Row>
      )}

      <h2 className="h4 mt-5 mb-3" id="resenas">Reseñas</h2>
      <TutorReviews tutorId={tutor.id} count={tutor.reviewCount} />
    </Container>
  )
}
