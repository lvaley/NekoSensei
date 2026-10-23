import axios from 'axios'
import { useState } from 'react'
import { Alert, Button, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { EnrollmentCard } from '../components/enrollments/EnrollmentCard'
import { EnrollmentTabs } from '../components/enrollments/EnrollmentTabs'
import { TravelModal } from '../components/enrollments/TravelModal'
import { ScheduleModal } from '../components/enrollments/ScheduleModal'
import { PageHero } from '../components/ui/PageHero'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useEnrollments } from '../hooks/useEnrollments'
import { api } from '../services/api'
import type { Enrollment } from '../types'

type Tab = 'solicitudes' | 'activos' | 'historial'

const EMPTY: Record<Tab, string> = {
  solicitudes: 'No tienes solicitudes pendientes.',
  activos: 'Todavía no tienes estudiantes activos.',
  historial: 'Aquí verás las inscripciones finalizadas, canceladas, rechazadas o vencidas.',
}

// Panel del tutor: solicitudes por responder y estudiantes activos
export function MyStudents() {
  useDocumentTitle('Mis estudiantes')
  const { items, error, reload } = useEnrollments()
  const [tab, setTab] = useState<Tab | null>(null)
  const [schedule, setSchedule] = useState<string | null>(null)
  const [route, setRoute] = useState<Enrollment | null>(null)
  const [rejecting, setRejecting] = useState<Enrollment | null>(null)
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState('')

  const pending = items?.filter((item) => item.status === 'pending' || item.status === 'awaiting_payment') ?? []
  const active = items?.filter((item) => item.status === 'active') ?? []
  const history = items?.filter((item) => ['finished', 'cancelled', 'rejected', 'expired'].includes(item.status)) ?? []
  // Al entrar se muestran primero las solicitudes si hay alguna por responder
  const current: Tab = tab ?? (pending.length > 0 ? 'solicitudes' : 'activos')
  const list = current === 'solicitudes' ? pending : current === 'activos' ? active : history

  const run = async (request: () => Promise<unknown>) => {
    setActionError('')
    try {
      await request()
      await reload()
    } catch (err) {
      setActionError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos completar la acción.')
    }
  }

  const confirmReject = async () => {
    if (!rejecting) return
    if (reason.trim().length < 5) return setActionError('Indica brevemente el motivo del rechazo.')
    await run(() => api.patch(`/enrollments/${rejecting.id}/decision`, { decision: 'reject', note: reason }))
    setRejecting(null)
    setReason('')
  }

  return (
    <>
      <PageHero eyebrow="Tutor" title="Mis estudiantes" subtitle="Responde solicitudes, agenda clases y da seguimiento a quienes estudian contigo." />
      <Container className="page-container">
        <EnrollmentTabs
          active={current}
          onChange={setTab}
          tabs={[
            { key: 'solicitudes', label: 'Solicitudes', count: pending.length },
            { key: 'activos', label: 'Activos', count: active.length },
            { key: 'historial', label: 'Historial', count: history.length },
          ]}
        />
        {error && <Alert variant="danger">No pudimos cargar tus estudiantes.</Alert>}
        {actionError && <Alert variant="danger" dismissible onClose={() => setActionError('')}>{actionError}</Alert>}
        {current === 'solicitudes' && pending.some((item) => item.status === 'awaiting_payment') && <Alert variant="info">Las solicitudes aceptadas quedan “esperando pago”: el estudiante tiene 48 horas para pagar y entonces se agendan sus clases.</Alert>}
        {!items && !error && <Spinner animation="border" role="status" aria-label="Cargando" className="d-block mx-auto my-5" />}

        {items && list.length === 0 && (
          <div className="surface-card text-center">
            <p className="text-secondary mb-3">{EMPTY[current]}</p>
            {current !== 'historial' && (
              <Link to="/mis-ofertas" className="btn btn-primary">
                Ver mis ofertas
              </Link>
            )}
          </div>
        )}
        {items && list.length > 0 && (
          <Row className="g-4">
            {list.map((enrollment) => (
              <Col md={6} lg={4} key={enrollment.id}>
                <EnrollmentCard enrollment={enrollment} viewerRole="tutor">
                  {enrollment.mode === 'student_home' && ['pending', 'awaiting_payment', 'active'].includes(enrollment.status) && (
                    <Button size="sm" variant="outline-dark" onClick={() => setRoute(enrollment)}>
                      <i className="bi bi-signpost-split me-1" aria-hidden="true" />
                      Ver ruta
                    </Button>
                  )}
                  {enrollment.status === 'pending' && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => run(() => api.patch(`/enrollments/${enrollment.id}/decision`, { decision: 'accept' }))}>
                        Aceptar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => { setReason(''); setRejecting(enrollment) }}>
                        Rechazar
                      </Button>
                    </>
                  )}
                  {enrollment.status === 'awaiting_payment' && (
                    <>
                      <span className="small text-secondary align-self-center">Esperando pago</span>
                      <Button size="sm" variant="outline-danger" onClick={() => window.confirm('¿Cancelar esta solicitud aceptada? El estudiante ya no podrá pagarla.') && run(() => api.patch(`/enrollments/${enrollment.id}/cancel`))}>
                        Cancelar
                      </Button>
                    </>
                  )}
                  {enrollment.status === 'active' && (
                    <>
                      {enrollment.mode !== 'student_home' && !enrollment.plan?.weeklySlots.length && (
                        <Button size="sm" variant="primary" onClick={() => setSchedule(enrollment.id)}>
                          Agendar clase
                        </Button>
                      )}
                      <Button size="sm" variant="outline-dark" onClick={() => window.confirm('¿Marcar este curso como finalizado? Se cancelarán las clases futuras.') && run(() => api.patch(`/enrollments/${enrollment.id}/finish`))}>
                        Finalizar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => window.confirm('¿Cancelar esta inscripción?') && run(() => api.patch(`/enrollments/${enrollment.id}/cancel`))}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </EnrollmentCard>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {route && <TravelModal enrollmentId={route.id} viewerRole="tutor" title={route.student.name} onClose={() => setRoute(null)} />}

      <Modal show={!!rejecting} onHide={() => setRejecting(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Rechazar solicitud
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {rejecting?.student.name} verá el motivo que escribas para “{rejecting?.offer.title}”.
          </p>
          <Form.Label htmlFor="reject-reason">Motivo</Form.Label>
          <Form.Control id="reject-reason" as="textarea" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej. No tengo cupo en ese horario por ahora." />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setRejecting(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmReject}>
            Rechazar
          </Button>
        </Modal.Footer>
      </Modal>

      {schedule && (
        <ScheduleModal
          enrollments={active.filter((item) => item.mode !== 'student_home')}
          enrollmentId={schedule}
          viewerRole="tutor"
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
