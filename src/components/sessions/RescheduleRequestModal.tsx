import axios from 'axios'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { api } from '../../services/api'
import type { ClassSession } from '../../types'
import { formatDateTime } from '../../utils/dates'

interface RescheduleRequestModalProps {
  session: ClassSession
  onClose: () => void
  onSaved: () => void
}

// El estudiante pide reagendar una clase a domicilio y explica el motivo
export function RescheduleRequestModal({ session, onClose, onSaved }: RescheduleRequestModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (reason.trim().length < 5) return setError('Cuéntale al tutor el motivo (al menos 5 caracteres).')
    setSaving(true)
    try {
      await api.post(`/sessions/${session.id}/reschedule`, { reason: reason.trim() })
      onSaved()
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos enviar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={onClose} centered backdrop="static">
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Reagendar clase
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
          <p className="mb-0">
            <strong>{session.title}</strong>
            <br />
            <span className="text-secondary">Horario actual: {formatDateTime(session.start)}</span>
          </p>
          <div>
            <Form.Label htmlFor="r-reason">Motivo de la solicitud</Form.Label>
            <Form.Control as="textarea" rows={3} id="r-reason" maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej. Tengo un examen ese día y no estaré en casa." />
          </div>
          <small className="text-secondary">
            Tu clase se mantiene en su horario hasta que el tutor responda. Él te propondrá un nuevo horario según su agenda y tú decides si lo aceptas.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
