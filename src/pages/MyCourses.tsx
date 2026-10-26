import axios from 'axios'
import { useState } from 'react'
import { Alert, Button, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { EnrollmentCard } from '../components/enrollments/EnrollmentCard'
import { EnrollmentTabs } from '../components/enrollments/EnrollmentTabs'
import { ReviewModal } from '../components/enrollments/ReviewModal'
import { PaymentModal } from '../components/enrollments/PaymentModal'
import { TravelModal } from '../components/enrollments/TravelModal'
import { ScheduleModal } from '../components/enrollments/ScheduleModal'
import { Avatar } from '../components/ui/Avatar'
import { MessageButton } from '../components/ui/MessageButton'
import { PageHero } from '../components/ui/PageHero'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useEnrollments } from '../hooks/useEnrollments'
import { api } from '../services/api'
import type { Enrollment } from '../types'
import { money } from '../utils/money'
import { ListSkeleton } from '../components/ui/Skeleton'

type Tab = 'activos' | 'solicitudes' | 'historial' | 'tutores'

const EMPTY: Record<Tab, { title: string; text: string }> = {
  activos: { title: 'Aún no llevas cursos', text: 'Cuando un tutor acepte tu solicitud, el curso aparecerá aquí.' },
  solicitudes: { title: 'No tienes solicitudes abiertas', text: 'Explora los cursos y solicita el que más te interese.' },
  historial: { title: 'Todavía no hay historial', text: 'Aquí verás los cursos finalizados, cancelados o vencidos.' },
  tutores: { title: 'Aún no tienes tutores', text: 'Tus tutores aparecerán aquí cuando tengas cursos activos.' },
}

// Panel del estudiante: sus cursos activos, solicitudes, historial y los tutores con los que estudia
export function MyCourses() {
  useDocumentTitle('Mis cursos')
  const { items, error, reload } = useEnrollments()
  const [chosenTab, setTab] = useState<Tab | null>(null)
  const [schedule, setSchedule] = useState<string | null>(null)
  const [route, setRoute] = useState<Enrollment | null>(null)
  const [actionError, setActionError] = useState('')
  const [reviewing, setReviewing] = useState<Enrollment | null>(null)
  const [payId, setPayId] = useState<string | null>(null)
  const [paidNotice, setPaidNotice] = useState(false)

  const active = items?.filter((item) => item.status === 'active') ?? []
  const requests = items?.filter((item) => item.status === 'pending' || item.status === 'awaiting_payment' || item.status === 'rejected') ?? []
  const history = items?.filter((item) => item.status === 'finished' || item.status === 'cancelled' || item.status === 'expired') ?? []
  // Sin cursos activos se muestran primero las solicitudes abiertas
  const tab: Tab = chosenTab ?? (items?.some((item) => item.status === 'awaiting_payment') || (active.length === 0 && requests.length > 0) ? 'solicitudes' : 'activos')
  const tutors = [...new Map(active.map((item) => [item.tutor.id, item.tutor])).values()]

  const cancel = async (id: string, text: string) => {
    if (!window.confirm(text)) return
    setActionError('')
    try {
      await api.patch(`/enrollments/${id}/cancel`)
      await reload()
    } catch (err) {
      setActionError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos completar la acción.')
    }
  }

  const renew = async (id: string) => {
    setActionError('')
    try {
      await api.post(`/enrollments/${id}/renew`)
      await reload()
      setPayId(id)
    } catch (err) {
      setActionError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos renovar el plan.')
    }
  }

  const payTarget = items?.find((item) => item.id === payId) ?? null
  const list = tab === 'activos' ? active : tab === 'solicitudes' ? requests : history

  return (
    <>
      <PageHero eyebrow="Estudiante" title="Mis cursos" subtitle="Tus cursos activos, tus solicitudes y los tutores con los que estudias." />
      <Container className="page-container">
        <EnrollmentTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'activos', label: 'Activos', count: active.length },
            { key: 'solicitudes', label: 'Solicitudes', count: requests.length },
            { key: 'tutores', label: 'Mis tutores', count: tutors.length },
            { key: 'historial', label: 'Historial', count: history.length },
          ]}
        />
        {error && <Alert variant="danger">No pudimos cargar tus cursos.</Alert>}
        {actionError && <Alert variant="danger">{actionError}</Alert>}
        {paidNotice && <Alert variant="success" dismissible onClose={() => setPaidNotice(false)}>¡Pago aprobado! Tu curso ya está activo.</Alert>}
        {!items && !error && <ListSkeleton label="Cargando tus cursos" />}

        {items && tab !== 'tutores' && list.length === 0 && (
          <div className="surface-card text-center">
            <h2 className="h5">{EMPTY[tab].title}</h2>
            <p className="text-secondary mb-3">{EMPTY[tab].text}</p>
            <Link to="/cursos" className="btn btn-primary">
              Explorar cursos
            </Link>
          </div>
        )}
        {items && tab !== 'tutores' && list.length > 0 && (
          <Row className="g-4">
            {list.map((enrollment) => (
              <Col md={6} lg={4} key={enrollment.id}>
                <EnrollmentCard enrollment={enrollment} viewerRole="student">
                  {enrollment.mode === 'student_home' && ['pending', 'awaiting_payment', 'active'].includes(enrollment.status) && (
                    <Button size="sm" variant="outline-dark" onClick={() => setRoute(enrollment)}>
                      <i className="bi bi-signpost-split me-1" aria-hidden="true" />
                      Ver traslado
                    </Button>
                  )}
                  {(enrollment.status === 'awaiting_payment' || (enrollment.status === 'active' && enrollment.charge)) && enrollment.charge && (
                    <Button size="sm" variant="primary" onClick={() => setPayId(enrollment.id)}>
                      <i className="bi bi-credit-card me-1" aria-hidden="true" />
                      {enrollment.charge.kind === 'renewal' ? 'Pagar renovación' : 'Pagar'} {money(enrollment.charge.total)}
                    </Button>
                  )}
                  <MessageButton userId={enrollment.tutor.id} label="Mensaje" onError={setActionError} />
                  {enrollment.canReview && (
                    <Button size="sm" variant="outline-primary" onClick={() => setReviewing(enrollment)}>
                      <i className="bi bi-star me-1" aria-hidden="true" />
                      Calificar
                    </Button>
                  )}
                  {enrollment.status === 'active' && enrollment.canRenew && !enrollment.charge && (
                    <Button size="sm" variant="outline-primary" onClick={() => renew(enrollment.id)}>
                      <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
                      Renovar plan
                    </Button>
                  )}
                  {enrollment.status === 'active' && (
                    <>
                      {enrollment.mode === 'student_home' && !enrollment.plan?.weeklySlots.length && (
                        <Button size="sm" variant="primary" onClick={() => setSchedule(enrollment.id)}>
                          Agendar clase
                        </Button>
                      )}
                    </>
                  )}
                  {(enrollment.status === 'pending' || enrollment.status === 'awaiting_payment') && (
                    <Button size="sm" variant="outline-danger" onClick={() => cancel(enrollment.id, '¿Cancelar esta solicitud?')}>
                      Cancelar solicitud
                    </Button>
                  )}
                </EnrollmentCard>
              </Col>
            ))}
          </Row>
        )}

        {items && tab === 'tutores' &&
          (tutors.length === 0 ? (
            <div className="surface-card text-center">
              <h2 className="h5">{EMPTY.tutores.title}</h2>
              <p className="text-secondary mb-0">{EMPTY.tutores.text}</p>
            </div>
          ) : (
            <Row className="g-4">
              {tutors.map((tutor) => {
                const courses = active.filter((item) => item.tutor.id === tutor.id)
                return (
                  <Col md={6} lg={4} key={tutor.id}>
                    <article className="surface-card tutor-card">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <Avatar name={tutor.name} picture={tutor.picture} size={56} />
                        <h3 className="h5 mb-0">{tutor.name}</h3>
                      </div>
                      <ul className="list-unstyled text-secondary mb-3">
                        {courses.map((course) => (
                          <li key={course.id}>
                            <i className="bi bi-journal-check me-2" aria-hidden="true" />
                            {course.offer.title}
                          </li>
                        ))}
                      </ul>
                      <Link to={`/tutores/${tutor.id}`} className="btn btn-outline-dark btn-sm mt-auto align-self-start">
                        Ver perfil
                      </Link>
                    </article>
                  </Col>
                )
              })}
            </Row>
          ))}
      </Container>

      {payTarget && (
        <PaymentModal
          enrollment={payTarget}
          onClose={() => setPayId(null)}
          onPaid={() => {
            setPaidNotice(true)
            void reload()
          }}
        />
      )}
      {reviewing && (
        <ReviewModal
          enrollment={reviewing}
          onClose={() => setReviewing(null)}
          onSaved={() => {
            setReviewing(null)
            void reload()
          }}
        />
      )}
      {route && <TravelModal enrollmentId={route.id} viewerRole="student" title={route.offer.title} onClose={() => setRoute(null)} />}
      {schedule && (
        <ScheduleModal
          enrollments={active}
          enrollmentId={schedule}
          viewerRole="student"
          onClose={() => setSchedule(null)}
          onSaved={() => {
            setSchedule(null)
            void reload()
          }}
        />
      )}
    </>
  )
}
