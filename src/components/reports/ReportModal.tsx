import axios from 'axios'
import { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { REPORT_REASON_LABELS } from '../../content/reports'
import { api } from '../../services/api'
import type { PersonRef, ReportReason } from '../../types'

interface ReportModalProps {
  person: PersonRef
  onClose: () => void
}

// Denuncia a la otra persona de una inscripción. El equipo la revisa y avisa cuando la cierra.
export function ReportModal({ person, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setError('')
    if (!reason) return setError('Elige el motivo de la denuncia.')
    if (detail.trim().length < 10) return setError('Cuéntanos qué ocurrió: escribe al menos 10 caracteres.')
    setSaving(true)
    try {
      await api.post('/reports', { userId: person.id, reason, detail })
      setSent(true)
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos enviar tu denuncia.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">
          Denunciar a {person.name}
        </Modal.Title>
      </Modal.Header>
      {sent ? (
        <>
          <Modal.Body>
            <Alert variant="success" className="mb-0">
              Recibimos tu denuncia. El equipo la revisará y te avisaremos cuando la cierre.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={onClose}>
              Listo
            </Button>
          </Modal.Footer>
        </>
      ) : (
        <>
          <Modal.Body className="d-grid gap-3">
            <p className="text-secondary small mb-0">
              Usa esta opción si la persona incumple las <Link to="/convivencia">normas de convivencia</Link>. La denuncia solo la ve el equipo de Neko Sensei; no se le notifica a la persona denunciada.
            </p>
            {error && (
              <Alert variant="danger" className="mb-0">
                {error}
              </Alert>
            )}
            <div>
              <Form.Label htmlFor="report-reason">Motivo</Form.Label>
              <Form.Select id="report-reason" value={reason} onChange={(event) => setReason(event.target.value as ReportReason | '')}>
                <option value="">Elige un motivo</option>
                {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((key) => (
                  <option key={key} value={key}>
                    {REPORT_REASON_LABELS[key]}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div>
              <Form.Label htmlFor="report-detail">¿Qué ocurrió?</Form.Label>
              <Form.Control id="report-detail" as="textarea" rows={4} maxLength={1000} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Describe los hechos con fechas o detalles que ayuden a revisar el caso." />
              <small className="text-secondary">{detail.length}/1000 · Las denuncias falsas o malintencionadas también son una falta.</small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={submit} disabled={saving}>
              {saving ? 'Enviando…' : 'Enviar denuncia'}
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  )
}
