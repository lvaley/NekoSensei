import axios from 'axios'
import { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { api } from '../../services/api'
import type { Enrollment } from '../../types'

const LABELS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente']

interface ReviewModalProps {
  enrollment: Enrollment
  onClose: () => void
  onSaved: () => void
}

// El estudiante califica a su tutor (1 a 5 estrellas) y deja un comentario. Una reseña por curso y no se edita.
export function ReviewModal({ enrollment, onClose, onSaved }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const shown = hover || rating

  const submit = async () => {
    setError('')
    if (rating === 0) return setError('Elige una calificación de 1 a 5 estrellas.')
    if (comment.trim().length < 10) return setError('Cuéntanos un poco más: escribe al menos 10 caracteres.')
    setSaving(true)
    try {
      await api.post(`/enrollments/${enrollment.id}/review`, { rating, comment })
      onSaved()
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos guardar tu reseña.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">
          Calificar a {enrollment.tutor.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-grid gap-3">
        <div className="text-secondary small">Curso: {enrollment.offer.title}</div>
        {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
        <div>
          <Form.Label as="div">Tu calificación</Form.Label>
          <div className="star-input" role="radiogroup" aria-label="Calificación" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" role="radio" aria-checked={rating === star} aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`} className={shown >= star ? 'is-on' : ''} onMouseEnter={() => setHover(star)} onClick={() => setRating(star)}>
                <i className={`bi ${shown >= star ? 'bi-star-fill' : 'bi-star'}`} aria-hidden="true" />
              </button>
            ))}
            <span className="ms-2 text-secondary">{LABELS[shown]}</span>
          </div>
        </div>
        <div>
          <Form.Label htmlFor="review-comment">Tu comentario</Form.Label>
          <Form.Control id="review-comment" as="textarea" rows={4} maxLength={500} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="¿Cómo fueron las clases? ¿Qué destacarías del tutor?" />
          <small className="text-secondary">{comment.length}/500 · Tu reseña será pública con tu nombre y la inicial de tu apellido, y no se puede editar.</small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? 'Publicando…' : 'Publicar reseña'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
