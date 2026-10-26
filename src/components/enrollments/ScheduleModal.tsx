import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { api } from '../../services/api'
import type { Enrollment, SlotsResponse } from '../../types'
import { formatDuration } from '../../utils/course'
import { capitalize, dayKey, formatDate, formatTime } from '../../utils/dates'

interface ScheduleModalProps {
  // Inscripciones activas entre las que se puede elegir
  enrollments: Enrollment[]
  // Si ya se sabe a cuál pertenece (botón dentro de una tarjeta)
  enrollmentId?: string
  defaultDay?: string
  viewerRole: 'student' | 'tutor'
  onClose: () => void
  onSaved: () => void
}

const DURATIONS = [30, 45, 60, 90, 120, 150, 180, 240]

// Formulario para agendar una clase dentro de una inscripción activa.
// Si el tutor definió sus días y horarios, solo se ofrecen los horarios compatibles (sin choques y con tiempo de traslado).
export function ScheduleModal({ enrollments, enrollmentId, defaultDay, viewerRole, onClose, onSaved }: ScheduleModalProps) {
  const today = dayKey(new Date())
  const [selected, setSelected] = useState(enrollmentId ?? enrollments[0]?.id ?? '')
  const current = enrollments.find((item) => item.id === selected)

  // Horarios disponibles de la inscripción elegida (se guardan con su id para saber si siguen vigentes)
  const [loaded, setLoaded] = useState<{ id: string; data: SlotsResponse | null; failed: boolean } | null>(null)
  useEffect(() => {
    if (!selected) return
    let active = true
    api
      .get<SlotsResponse>(`/enrollments/${selected}/slots`, { params: { days: 45 } })
      .then((res) => active && setLoaded({ id: selected, data: res.data, failed: false }))
      .catch(() => active && setLoaded({ id: selected, data: null, failed: true }))
    return () => {
      active = false
    }
  }, [selected])
  const loading = !!selected && loaded?.id !== selected
  const data = loaded?.id === selected ? loaded.data : null
  const scheduled = !!data?.hasSchedule

  // Horarios agrupados por día
  const byDay = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const slot of data?.slots ?? []) map.set(dayKey(slot), [...(map.get(dayKey(slot)) ?? []), slot])
    return map
  }, [data])
  const dayKeys = [...byDay.keys()]
  const [chosenDay, setChosenDay] = useState(defaultDay ?? '')
  const day = byDay.has(chosenDay) ? chosenDay : (dayKeys[0] ?? '')
  const daySlots = byDay.get(day) ?? []
  const [chosenSlot, setChosenSlot] = useState('')
  const slot = daySlots.includes(chosenSlot) ? chosenSlot : ''

  // Sin franjas definidas (ofertas antiguas) el horario se escribe a mano
  const [date, setDate] = useState(defaultDay && defaultDay >= today ? defaultDay : today)
  const [time, setTime] = useState('15:00')
  const [manualDuration, setManualDuration] = useState(current?.offer.sessionDurationMin ?? 60)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  // Aviso tras agendar una clase grupal (a quiénes no se pudo agregar)
  const [done, setDone] = useState<string | null>(null)
  const groupMembers = current?.offer.classType === 'group' ? enrollments.filter((item) => item.offer.id === current.offer.id).length : 0

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!selected) return setError('Selecciona un curso.')
    let start: Date
    let durationMin: number
    if (scheduled) {
      if (!slot) return setError('Elige uno de los horarios disponibles.')
      start = new Date(slot)
      durationMin = data?.durationMin ?? 60
    } else {
      start = new Date(`${date}T${time}`)
      durationMin = manualDuration
      if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) return setError('Elige una fecha y hora futuras.')
    }

    setSaving(true)
    try {
      const res = await api.post<{ groupSize?: number; skipped?: string[] }>(`/enrollments/${selected}/sessions`, { start: start.toISOString(), durationMin, note })
      const skipped = res.data.skipped ?? []
      if (skipped.length === 0) onSaved()
      else setDone(`Clase agendada para ${res.data.groupSize ?? 0} estudiantes. No se agregó a: ${skipped.join(', ')} (horario cruzado o ya completaron las clases del curso).`)
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos agendar la clase.')
    } finally {
      setSaving(false)
    }
  }

  const isHome = current?.mode === 'student_home'

  return (
    <Modal show onHide={onClose} centered backdrop="static">
      <Form onSubmit={onSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Agendar clase
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
          {done && <Alert variant="warning" className="mb-0">{done}</Alert>}
          {!enrollmentId && (
            <div>
              <Form.Label htmlFor="s-enrollment">Curso</Form.Label>
              <Form.Select id="s-enrollment" value={selected} onChange={(event) => {
                  setSelected(event.target.value)
                  const next = enrollments.find((item) => item.id === event.target.value)
                  if (next) setManualDuration(next.offer.sessionDurationMin)
                }}>
                {enrollments.map((enrollment) => (
                  <option key={enrollment.id} value={enrollment.id}>
                    {enrollment.offer.title} — {viewerRole === 'tutor' ? enrollment.student.name : enrollment.tutor.name}
                  </option>
                ))}
              </Form.Select>
            </div>
          )}

          {loading && (
            <div className="text-center text-secondary py-3">
              <Spinner size="sm" className="me-2" />
              Buscando horarios disponibles…
            </div>
          )}

          {!loading && scheduled && (
            <>
              {dayKeys.length === 0 ? (
                <Alert variant="light" className="border mb-0">
                  No hay horarios disponibles en los próximos 45 días. {isHome ? 'Puede que el tutor tenga su agenda llena o que el traslado entre clases no deje espacio.' : 'Revisa más adelante o escribe al tutor.'}
                </Alert>
              ) : (
                <>
                  <div>
                    <Form.Label htmlFor="s-day">Día</Form.Label>
                    <Form.Select id="s-day" value={day} onChange={(event) => setChosenDay(event.target.value)}>
                      {dayKeys.map((key) => (
                        <option key={key} value={key}>
                          {capitalize(formatDate(`${key}T12:00`))}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div>
                    <Form.Label id="s-slots-label">Hora de inicio ({formatDuration(data?.durationMin ?? 60)} por clase)</Form.Label>
                    <div className="chip-list mt-0" role="group" aria-labelledby="s-slots-label">
                      {daySlots.map((value) => (
                        <button key={value} type="button" className={`chip${slot === value ? ' is-active' : ''}`} aria-pressed={slot === value} onClick={() => setChosenSlot(value)}>
                          {formatTime(value)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {!loading && !scheduled && (
            <>
              <div className="row g-3">
                <div className="col-7">
                  <Form.Label htmlFor="s-date">Fecha</Form.Label>
                  <Form.Control id="s-date" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} />
                </div>
                <div className="col-5">
                  <Form.Label htmlFor="s-time">Hora</Form.Label>
                  <Form.Control id="s-time" type="time" step={900} value={time} onChange={(event) => setTime(event.target.value)} />
                </div>
              </div>
              <div>
                <Form.Label htmlFor="s-duration">Duración</Form.Label>
                <Form.Select id="s-duration" value={manualDuration} onChange={(event) => setManualDuration(Number(event.target.value))}>
                  {DURATIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatDuration(minutes)}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </>
          )}

          <div>
            <Form.Label htmlFor="s-note">Nota (opcional)</Form.Label>
            <Form.Control id="s-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="Tema a repasar, material…" />
          </div>
          {groupMembers > 0 && (
            <small className="text-secondary">
              <i className="bi bi-people me-1" aria-hidden="true" />
              Clase grupal: se agenda para los {groupMembers} estudiantes activos del grupo, a la misma hora.
            </small>
          )}
          {current && (
            <small className="text-secondary">
              Llevas {current.sessionsUsed} de {current.offer.totalSessions} clases agendadas o realizadas en este curso.
            </small>
          )}
          {scheduled && (
            <small className="text-secondary">
              <i className="bi bi-info-circle me-1" aria-hidden="true" />
              Solo se muestran horarios dentro de la disponibilidad del tutor{isHome ? ', con tiempo de traslado suficiente entre sus clases' : ' y sin cruces con otras clases'}.
            </small>
          )}
          {!loading && !scheduled && <small className="text-secondary">No se permiten clases que se crucen con otras ya agendadas del tutor o del estudiante.</small>}
        </Modal.Body>
        <Modal.Footer>
          {done ? (
            <Button variant="primary" onClick={onSaved}>
              Listo
            </Button>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving || loading || (scheduled && !slot)}>
                {saving ? 'Agendando…' : 'Agendar'}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
