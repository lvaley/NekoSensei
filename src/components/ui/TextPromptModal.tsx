import axios from 'axios'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'

interface TextPromptModalProps {
  title: string
  // Contexto que se muestra sobre el campo (a quién afecta, qué pasará)
  intro?: ReactNode
  label: string
  placeholder?: string
  minLength: number
  maxLength: number
  confirmLabel: string
  confirmVariant?: string
  // Debe lanzar el error si falla; la ventana lo muestra y se queda abierta
  onSubmit: (text: string) => Promise<void>
  onClose: () => void
}

// Ventana para pedir un texto obligatorio antes de una acción (motivo, nota, respuesta)
export function TextPromptModal({ title, intro, label, placeholder, minLength, maxLength, confirmLabel, confirmVariant = 'primary', onSubmit, onClose }: TextPromptModalProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError('')
    if (text.trim().length < minLength) return setError(`Escribe al menos ${minLength} caracteres.`)
    setSaving(true)
    try {
      await onSubmit(text.trim())
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos completar la acción.')
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={saving ? undefined : onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-grid gap-3">
        {intro && <div className="text-secondary small">{intro}</div>}
        {error && (
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
        )}
        <div>
          <Form.Label htmlFor="prompt-text">{label}</Form.Label>
          <Form.Control id="prompt-text" as="textarea" rows={4} maxLength={maxLength} value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} />
          <small className="text-secondary">
            {text.length}/{maxLength}
          </small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant={confirmVariant} onClick={submit} disabled={saving}>
          {saving ? 'Enviando…' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
