import axios from 'axios'
import { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { LEVEL_LABELS } from '../../content/levels'
import { MODE_LABELS } from '../../content/modes'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { TravelPreviewPanel } from '../ui/TravelPreviewPanel'
import { PlanPicker } from './PlanPicker'
import type { PlanChoice } from './PlanPicker'
import { courseTotal, scopeLabel } from '../../utils/course'
import { tomorrow } from '../../utils/dates'
import { money } from '../../utils/money'
import type { Enrollment, PublicOffer, TeachingMode } from '../../types'

interface EnrollButtonProps {
  offer: PublicOffer
  // Inscripción pendiente o activa del estudiante en este curso, si existe
  current?: Enrollment
  onRequested: () => void
}

// Acción de cada curso del catálogo: solicitar (estudiantes), iniciar sesión (visitantes) o nada (tutores/admin)
export function EnrollButton({ offer, current, onRequested }: EnrollButtonProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<TeachingMode>(offer.modes[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const hasPlan = !!offer.weeks && !!offer.sessionsPerWeek
  const needsSlots = hasPlan && offer.classType === 'individual' && offer.availability.length > 0
  const [plan, setPlan] = useState<PlanChoice>({ startDate: tomorrow(), slots: Array.from({ length: offer.sessionsPerWeek ?? 0 }, () => null) })

  if (!user) {
    return (
      <Link to="/login" state={{ from: `/tutores/${offer.tutor.id}` }} className="btn btn-outline-dark btn-sm mt-3">
        Inicia sesión para solicitar
      </Link>
    )
  }
  if (user.role !== 'student') return null

  if (current) {
    return (
      <Link to="/mis-cursos" className="btn btn-outline-secondary btn-sm mt-3">
        {current.status === 'active' ? 'Ya estás inscrito' : current.status === 'awaiting_payment' ? 'Aceptada: pagar ahora' : 'Solicitud enviada, ver estado'}
      </Link>
    )
  }

  const submit = async () => {
    setError('')
    if (needsSlots && plan.slots.some((slot) => slot === null)) {
      setError('Elige todos los días y horas fijos de tu plan.')
      return
    }
    setSaving(true)
    try {
      await api.post('/enrollments', { offerId: offer.id, mode, note, ...(needsSlots ? { startDate: plan.startDate, weeklySlots: plan.slots } : {}) })
      setOpen(false)
      setNote('')
      onRequested()
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos enviar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  // Grupo completo: ya no se reciben solicitudes
  if (offer.seatsLeft === 0) {
    return (
      <Button variant="outline-secondary" size="sm" className="mt-3" disabled>
        Sin cupos disponibles
      </Button>
    )
  }

  return (
    <>
      <Button variant="primary" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        Solicitar curso
      </Button>
      <Modal show={open} onHide={() => setOpen(false)} centered size={mode === 'student_home' ? 'lg' : undefined} scrollable>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Solicitar “{offer.title}”
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
          <div className="offer-card__scope mb-0">
            <i className="bi bi-collection me-2" aria-hidden="true" />
            <span>
              Curso de nivel <strong>{LEVEL_LABELS[offer.level].toLowerCase()}</strong>{offer.classType === 'group' ? <>, <strong>grupal</strong> (hasta {offer.maxStudents} estudiantes, quedan {offer.seatsLeft})</> : <>, <strong>individual</strong></>}. Incluye <strong>{scopeLabel(offer)}</strong>
              <small>
                {money(offer.hourlyRate)} por hora · total estimado {money(courseTotal(offer.hourlyRate, offer.totalSessions, offer.sessionDurationMin))}
                {offer.modes.includes('student_home') && ' (sin traslado)'}
              </small>
            </span>
          </div>
          <div>
            <Form.Label>Modalidad</Form.Label>
            {offer.modes.map((option) => (
              <Form.Check key={option} type="radio" id={`m-${offer.id}-${option}`} name={`mode-${offer.id}`} label={MODE_LABELS[option]} checked={mode === option} onChange={() => { setMode(option); setPlan((old) => ({ ...old, slots: old.slots.map(() => null) })) }} />
            ))}
          </div>
          {mode === 'student_home' && (
            <div>
              <Form.Label>Traslado del tutor hasta tu casa</Form.Label>
              <TravelPreviewPanel url={`/offers/${offer.id}/travel`} />
            </div>
          )}
          {hasPlan && <PlanPicker offer={offer} mode={mode} needsSlots={needsSlots} value={plan} onChange={setPlan} />}
          <div>
            <Form.Label htmlFor={`n-${offer.id}`}>Mensaje para el tutor (opcional)</Form.Label>
            <Form.Control id={`n-${offer.id}`} as="textarea" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Cuéntale tu nivel, tus objetivos o tus horarios…" />
          </div>
          <small className="text-secondary">El tutor revisará tu solicitud. Cuando la acepte, tendrás 48 horas para pagar en “Mis cursos”; al pagar, el curso se activa y se agendan tus clases.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
