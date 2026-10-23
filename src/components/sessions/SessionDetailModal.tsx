import { useEffect, useState } from 'react'
import { Alert, Button, Modal, Spinner } from 'react-bootstrap'
import { MODE_LABELS } from '../../content/modes'
import { api } from '../../services/api'
import type { ClassSession, SessionDetail } from '../../types'
import { formatDuration } from '../../utils/course'
import { capitalize, formatDate, formatTime } from '../../utils/dates'
import { money } from '../../utils/money'
import { ClassTypeBadge } from '../ui/ClassTypeBadge'
import { LevelBadge } from '../ui/LevelBadge'
import { TravelInfo } from '../ui/TravelInfo'
import { RescheduleNotice } from './RescheduleNotice'

interface SessionDetailModalProps {
  session: ClassSession
  viewerRole: 'student' | 'tutor'
  onClose: () => void
}

const STATUS_TEXT = { scheduled: 'Programada', completed: 'Realizada', cancelled: 'Cancelada' } as const

// Enlace a Google Maps con la ruta ya trazada (solo para quien se desplaza)
const directionsUrl = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`

export function SessionDetailModal({ session, viewerRole, onClose }: SessionDetailModalProps) {
  const [result, setResult] = useState<{ id: string; detail?: SessionDetail } | null>(null)

  useEffect(() => {
    let active = true
    api
      .get<{ detail: SessionDetail }>(`/sessions/${session.id}/detail`)
      .then((res) => active && setResult({ id: session.id, detail: res.data.detail }))
      .catch(() => active && setResult({ id: session.id }))
    return () => {
      active = false
    }
  }, [session.id])

  const loading = result?.id !== session.id
  const detail = result?.id === session.id ? result.detail : undefined
  const travel = detail?.travel ?? null

  return (
    <Modal show onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">
          {session.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="session-detail">
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" /> Cargando detalle…
          </div>
        )}
        {!loading && !detail && <Alert variant="danger">No pudimos cargar el detalle de la clase.</Alert>}
        {detail && (
          <>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className={`enrollment-status ${detail.status === 'scheduled' ? 'is-active' : 'is-closed'}`}>{STATUS_TEXT[detail.status]}</span>
              <span className="badge text-bg-light border">{MODE_LABELS[detail.place.kind]}</span>
              <LevelBadge level={detail.level} />
              <ClassTypeBadge classType={detail.classType} maxStudents={detail.maxStudents} />
              {detail.category && <span className="badge text-bg-light border">{detail.category}</span>}
            </div>

            <dl className="session-detail__grid">
              <div>
                <dt>Fecha</dt>
                <dd>{capitalize(formatDate(detail.start))}</dd>
              </div>
              <div>
                <dt>Horario</dt>
                <dd>
                  {formatTime(detail.start)} – {formatTime(detail.end)} · {formatDuration(detail.durationMin)}
                </dd>
              </div>
              <div>
                <dt>Avance del curso</dt>
                <dd>
                  Clase {detail.classNumber} de {detail.totalSessions}
                </dd>
              </div>
              <div>
                <dt>{viewerRole === 'tutor' ? (detail.students ? `Estudiantes (${detail.students.length})` : 'Estudiante') : 'Tutor'}</dt>
                <dd>{viewerRole === 'tutor' ? (detail.students ? detail.students.map((student) => student.name).join(', ') : detail.student.name) : detail.tutor.name}</dd>
              </div>
              {detail.rescheduleCount > 0 && (
                <div>
                  <dt>Reagendada</dt>
                  <dd>{detail.rescheduleCount} {detail.rescheduleCount === 1 ? 'vez' : 'veces'}</dd>
                </div>
              )}
            </dl>

            {detail.description && <p className="text-secondary small">{detail.description}</p>}
            {detail.note && (
              <p className="small">
                <strong>Nota de la clase:</strong> {detail.note}
              </p>
            )}
            {detail.status === 'scheduled' && detail.reschedule && <RescheduleNotice reschedule={detail.reschedule} viewerRole={viewerRole} />}

            {detail.place.meetingUrl && (
              <section className="session-detail__block">
                <h3 className="h6">Enlace de la clase</h3>
                <a className="btn btn-outline-primary btn-sm" href={detail.place.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-camera-video me-1" aria-hidden="true" />
                  Unirse a la clase
                </a>
              </section>
            )}

            {detail.place.address && (
              <section className="session-detail__block">
                <h3 className="h6">Lugar de la clase</h3>
                <p className="mb-0">
                  <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                  {detail.place.address}
                </p>
              </section>
            )}

            {travel && (
              <section className="session-detail__block">
                <h3 className="h6">{travel.viewerTravels ? 'Tu traslado' : 'Traslado del tutor'}</h3>
                <TravelInfo travel={travel} />
                {travel.viewerTravels && detail.status === 'scheduled' && (
                  <a className="btn btn-outline-primary btn-sm mt-2" href={directionsUrl(travel.from, travel.to)} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-sign-turn-right me-1" aria-hidden="true" />
                    Cómo llegar (Google Maps)
                  </a>
                )}
              </section>
            )}

            <section className="session-detail__block">
              <h3 className="h6">Costo de la clase</h3>
              <ul className="session-detail__stats">
                <li>
                  Clase: <strong>{money(detail.price.classCost)}</strong> ({money(detail.price.hourlyRate)} por hora)
                </li>
                {detail.price.travelCost !== null && (
                  <li>
                    Traslado: <strong>{money(detail.price.travelCost)}</strong> ({money(detail.price.travelFeePerKm ?? 0)} por km × {travel?.straightKm} km)
                  </li>
                )}
                <li>
                  Total: <strong>{money(detail.price.total)}</strong>
                </li>
              </ul>
            </section>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
