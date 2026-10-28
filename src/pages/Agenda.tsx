import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ScheduleModal } from '../components/enrollments/ScheduleModal'
import { RescheduleManageModal } from '../components/sessions/RescheduleManageModal'
import { RescheduleNotice } from '../components/sessions/RescheduleNotice'
import { RescheduleRequestModal } from '../components/sessions/RescheduleRequestModal'
import { SessionDetailModal } from '../components/sessions/SessionDetailModal'
import { Calendar } from '../components/ui/Calendar'
import { PageHero } from '../components/ui/PageHero'
import { MODE_LABELS } from '../content/modes'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useEnrollments } from '../hooks/useEnrollments'
import { api } from '../services/api'
import type { ClassSession } from '../types'
import { capitalize, dayKey, formatDate, formatTime } from '../utils/dates'

const STATUS_TEXT = { scheduled: 'Programada', completed: 'Realizada', cancelled: 'Cancelada' } as const

// Agenda mensual compartida por tutores y estudiantes
export function Agenda() {
  useDocumentTitle('Agenda')
  const { user } = useAuth()
  const viewerRole = user?.role === 'tutor' ? 'tutor' : 'student'
  const { items: enrollments } = useEnrollments()
  // Virtual, en casa del tutor y grupales: agenda el tutor. A domicilio: agenda el estudiante.
  const activeEnrollments = useMemo(() => enrollments?.filter((item) => item.status === 'active' && (viewerRole === 'tutor' ? item.mode !== 'student_home' : item.mode === 'student_home')) ?? [], [enrollments, viewerRole])
  const hasActive = enrollments?.some((item) => item.status === 'active') ?? false

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState(() => dayKey(new Date()))
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [error, setError] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [rescheduling, setRescheduling] = useState<ClassSession | null>(null)
  const [managing, setManaging] = useState<ClassSession | null>(null)
  const [detail, setDetail] = useState<ClassSession | null>(null)
  // Hora de referencia para saber si una clase ya empezó; se actualiza cada vez que se cargan las clases
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback(() => {
    const from = new Date(month.getFullYear(), month.getMonth(), 1)
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
    return api
      .get<{ sessions: ClassSession[] }>('/sessions', { params: { from: from.toISOString(), to: to.toISOString() } })
      .then((res) => {
        setSessions(res.data.sessions)
        setNow(Date.now())
      })
      .catch(() => setError('No pudimos cargar tu agenda.'))
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const session of sessions) if (session.status !== 'cancelled') result[dayKey(session.start)] = (result[dayKey(session.start)] ?? 0) + 1
    return result
  }, [sessions])

  const daySessions = sessions.filter((session) => dayKey(session.start) === selected)
  const selectedDate = new Date(`${selected}T12:00:00`)

  const act = async (id: string, action: 'cancel' | 'complete') => {
    setError('')
    try {
      await api.patch(`/sessions/${id}/${action}`)
      await load()
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos completar la acción.')
    }
  }

  const respondToProposal = async (id: string, accept: boolean) => {
    if (accept === false && !window.confirm('¿Rechazar el nuevo horario? Tu clase se mantiene como estaba.')) return
    setError('')
    try {
      await api.post(`/sessions/${id}/reschedule/respond`, { accept })
      await load()
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos completar la acción.')
      await load()
    }
  }

  return (
    <>
      <PageHero eyebrow="Agenda" title="Mis clases" subtitle={viewerRole === 'tutor' ? 'Organiza tu semana con un vistazo: agenda clases virtuales y a domicilio, y responde reagendamientos sin perder tiempo.' : 'Todas tus clases en un solo calendario. Agenda las de domicilio a tu gusto, pide reagendar si surge algo y no te pierdas ninguna.'} />
      <Container className="page-container">
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        <Row className="g-4">
          <Col lg={5}>
            <Calendar month={month} counts={counts} selected={selected} onSelect={setSelected} onMonthChange={setMonth} />
          </Col>
          <Col lg={7}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="h5 mb-0">{capitalize(formatDate(selectedDate))}</h2>
              {(viewerRole === 'tutor' || activeEnrollments.length > 0) && (
                <Button variant="primary" size="sm" disabled={activeEnrollments.length === 0} onClick={() => setScheduling(true)}>
                  <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                  Agendar clase
                </Button>
              )}
            </div>
            {enrollments && activeEnrollments.length === 0 && (
              <Alert variant="light" className="border">
                {hasActive
                  ? viewerRole === 'student'
                    ? 'En tus cursos virtuales, en casa del tutor y grupales, tu tutor agenda las clases: las verás aquí cuando las programe.'
                    : 'Tus estudiantes a domicilio eligen su propio horario: sus clases aparecerán aquí.'
                  : 'Para agendar clases necesitas un curso activo.'}{' '}
                <Link to={viewerRole === 'tutor' ? '/mis-estudiantes' : '/cursos'}>{viewerRole === 'tutor' ? 'Revisar solicitudes' : 'Explorar cursos'}</Link>
              </Alert>
            )}
            {daySessions.length === 0 ? (
              <div className="surface-card text-center text-secondary">No hay clases este día.</div>
            ) : (
              <ul className="session-list">
                {daySessions.map((session) => {
                  const other = viewerRole === 'tutor' ? session.student.name : session.tutor.name
                  const started = new Date(session.start).getTime() <= now
                  return (
                    <li key={session.id} className={`surface-card session-item is-${session.status}`}>
                      <div className="session-item__time">
                        <strong>{formatTime(session.start)}</strong>
                        <small>{formatTime(session.end)}</small>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <h3 className="h6 mb-1">{session.title}</h3>
                        <p className="text-secondary small mb-1">
                          {session.students && session.students.length > 0
                            ? `Grupo (${session.students.length}): ${session.students.map((student) => student.name).join(', ')}`
                            : `${viewerRole === 'tutor' ? 'Estudiante' : 'Tutor'}: ${other}`}
                          {session.classType === 'group' && viewerRole === 'student' && ' · Clase grupal'}
                          {session.mode && ` · ${MODE_LABELS[session.mode]}`}
                        </p>
                        {session.note && <p className="small mb-1">{session.note}</p>}
                        {session.meetingUrl && (
                          <a className="btn btn-outline-primary btn-sm mb-2" href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                            <i className="bi bi-camera-video me-1" aria-hidden="true" />
                            Unirse a la clase
                          </a>
                        )}
                        <span className={`enrollment-status ${session.status === 'scheduled' ? 'is-active' : 'is-closed'}`}>{STATUS_TEXT[session.status]}</span>
                        {session.status === 'scheduled' && session.reschedule && <RescheduleNotice reschedule={session.reschedule} viewerRole={viewerRole} />}
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <Button size="sm" variant="outline-dark" onClick={() => setDetail(session)}>
                          Ver detalle
                        </Button>
                        {session.status === 'scheduled' && (
                          <>
                          {viewerRole === 'student' && session.mode === 'student_home' && !started && (!session.reschedule || ['declined', 'rejected'].includes(session.reschedule.status)) && (
                            <Button size="sm" variant="outline-primary" onClick={() => setRescheduling(session)}>
                              Reagendar
                            </Button>
                          )}
                          {viewerRole === 'student' && session.reschedule?.status === 'proposed' && (
                            <>
                              <Button size="sm" variant="primary" onClick={() => respondToProposal(session.id, true)}>
                                Aceptar horario
                              </Button>
                              <Button size="sm" variant="outline-secondary" onClick={() => respondToProposal(session.id, false)}>
                                Rechazar
                              </Button>
                            </>
                          )}
                          {viewerRole === 'tutor' && session.reschedule?.status === 'requested' && (
                            <Button size="sm" variant="primary" onClick={() => setManaging(session)}>
                              Responder
                            </Button>
                          )}
                          {viewerRole === 'tutor' && started && (
                            <Button size="sm" variant="outline-dark" onClick={() => act(session.id, 'complete')}>
                              Marcar realizada
                            </Button>
                          )}
                          <Button size="sm" variant="outline-danger" onClick={() => window.confirm('¿Cancelar esta clase?') && act(session.id, 'cancel')}>
                            Cancelar
                          </Button>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Col>
        </Row>
      </Container>

      {detail && <SessionDetailModal session={detail} viewerRole={viewerRole} onClose={() => setDetail(null)} />}
      {rescheduling && (
        <RescheduleRequestModal
          session={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={() => {
            setRescheduling(null)
            void load()
          }}
        />
      )}
      {managing && (
        <RescheduleManageModal
          session={managing}
          onClose={() => setManaging(null)}
          onSaved={() => {
            setManaging(null)
            void load()
          }}
        />
      )}
      {scheduling && (
        <ScheduleModal
          enrollments={activeEnrollments}
          defaultDay={selected}
          viewerRole={viewerRole}
          onClose={() => setScheduling(false)}
          onSaved={() => {
            setScheduling(false)
            void load()
          }}
        />
      )}
    </>
  )
}
