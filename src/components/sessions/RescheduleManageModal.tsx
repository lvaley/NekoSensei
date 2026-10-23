import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { api } from '../../services/api'
import type { ClassSession, SlotsResponse } from '../../types'
import { capitalize, dayKey, formatDate, formatDateTime, formatTime } from '../../utils/dates'

interface RescheduleManageModalProps {
  session: ClassSession
  onClose: () => void
  onSaved: () => void
}

// El tutor responde a una solicitud de reagendar: propone un horario según su agenda o explica por qué no puede
export function RescheduleManageModal({ session, onClose, onSaved }: RescheduleManageModalProps) {
  const [mode, setMode] = useState<'propose' | 'decline'>('propose')
  const [loaded, setLoaded] = useState<SlotsResponse | null | 'failed'>(null)
  useEffect(() => {
    let active = true
    api
      .get<SlotsResponse>(`/sessions/${session.id}/reschedule/slots`)
      .then((res) => active && setLoaded(res.data))
      .catch(() => active && setLoaded('failed'))
    return () => {
      active = false
    }
  }, [session.id])
  const data = loaded === 'failed' ? null : loaded
  const loading = loaded === null
  const scheduled = !!data?.hasSchedule

  const byDay = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const slot of data?.slots ?? []) map.set(dayKey(slot), [...(map.get(dayKey(slot)) ?? []), slot])
    return map
  }, [data])
  const dayKeys = [...byDay.keys()]
  const [chosenDay, setChosenDay] = useState('')
  const day = byDay.has(chosenDay) ? chosenDay : (dayKeys[0] ?? '')
  const daySlots = byDay.get(day) ?? []
  const [chosenSlot, setChosenSlot] = useState('')
  const slot = daySlots.includes(chosenSlot) ? chosenSlot : ''

  // Ofertas antiguas sin franjas: fecha y hora libres
  const today = dayKey(new Date())
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('15:00')
  const [note, setNote] = useState('')
  const [declineNote, setDeclineNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    let request: () => Promise<unknown>
    if (mode === 'decline') {
      if (declineNote.trim().length < 5) return setError('Indica brevemente por qué no es posible (al menos 5 caracteres).')
      request = () => api.post(`/sessions/${session.id}/reschedule/decline`, { note: declineNote.trim() })
    } else {
      const start = scheduled ? new Date(slot) : new Date(`${date}T${time}`)
      if (scheduled && !slot) return setError('Elige uno de los horarios disponibles.')
      if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) return setError('Elige una fecha y hora futuras.')
      request = () => api.post(`/sessions/${session.id}/reschedule/propose`, { start: start.toISOString(), note: note.trim() })
    }

    setSaving(true)
    try {
      await request()
      onSaved()
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos enviar tu respuesta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={onClose} centered backdrop="static">
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Solicitud de reagendar
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
          <div>
            <strong>{session.student.name}</strong> · {session.title}
            <br />
            <span className="text-secondary">Horario actual: {formatDateTime(session.start)}</span>
            {session.reschedule && <p className="mb-0 mt-2">Motivo: “{session.reschedule.reason}”</p>}
          </div>

          <div className="chip-list mt-0" role="group" aria-label="Respuesta">
            <button type="button" className={`chip${mode === 'propose' ? ' is-active' : ''}`} aria-pressed={mode === 'propose'} onClick={() => setMode('propose')}>
              Proponer nuevo horario
            </button>
            <button type="button" className={`chip${mode === 'decline' ? ' is-active' : ''}`} aria-pressed={mode === 'decline'} onClick={() => setMode('decline')}>
              No es posible
            </button>
          </div>

          {mode === 'decline' && (
            <div>
              <Form.Label htmlFor="r-decline">Motivo para el estudiante</Form.Label>
              <Form.Control as="textarea" rows={3} id="r-decline" maxLength={300} value={declineNote} onChange={(event) => setDeclineNote(event.target.value)} placeholder="Ej. Esa semana tengo la agenda completa." />
              <small className="text-secondary d-block mt-1">La clase se mantiene en su horario original.</small>
            </div>
          )}

          {mode === 'propose' && loading && (
            <div className="text-center text-secondary py-3">
              <Spinner size="sm" className="me-2" />
              Buscando horarios en tu agenda…
            </div>
          )}

          {mode === 'propose' && !loading && scheduled && (
            dayKeys.length === 0 ? (
              <Alert variant="light" className="border mb-0">No hay horarios libres en los próximos 45 días según tu agenda y el tiempo de traslado.</Alert>
            ) : (
              <>
                <div>
                  <Form.Label htmlFor="r-day">Día</Form.Label>
                  <Form.Select id="r-day" value={day} onChange={(event) => setChosenDay(event.target.value)}>
                    {dayKeys.map((key) => (
                      <option key={key} value={key}>
                        {capitalize(formatDate(`${key}T12:00`))}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div>
                  <Form.Label id="r-slots-label">Hora de inicio</Form.Label>
                  <div className="chip-list mt-0" role="group" aria-labelledby="r-slots-label">
                    {daySlots.map((value) => (
                      <button key={value} type="button" className={`chip${slot === value ? ' is-active' : ''}`} aria-pressed={slot === value} onClick={() => setChosenSlot(value)}>
                        {formatTime(value)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )
          )}

          {mode === 'propose' && !loading && !scheduled && (
            <div className="row g-3">
              <div className="col-7">
                <Form.Label htmlFor="r-date">Fecha</Form.Label>
                <Form.Control id="r-date" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <div className="col-5">
                <Form.Label htmlFor="r-time">Hora</Form.Label>
                <Form.Control id="r-time" type="time" step={900} value={time} onChange={(event) => setTime(event.target.value)} />
              </div>
            </div>
          )}

          {mode === 'propose' && (
            <>
              <div>
                <Form.Label htmlFor="r-note">Comentario (opcional)</Form.Label>
                <Form.Control id="r-note" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. Ese día salgo temprano de otra clase." />
              </div>
              {scheduled && <small className="text-secondary">Solo ves horarios dentro de tu disponibilidad, sin choques y con tiempo de traslado. El estudiante debe aceptar la propuesta para que la clase cambie.</small>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant={mode === 'decline' ? 'danger' : 'primary'} disabled={saving || loading || (mode === 'propose' && scheduled && !slot)}>
            {saving ? 'Enviando…' : mode === 'decline' ? 'Rechazar solicitud' : 'Enviar propuesta'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
