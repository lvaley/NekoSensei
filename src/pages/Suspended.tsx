import axios from 'axios'
import { useState } from 'react'
import { Alert, Button, Container, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { Suspension } from '../types'
import { formatDateTime } from '../utils/dates'

// Única pantalla de una cuenta suspendida: el motivo, las normas y la apelación al administrador
export function Suspended() {
  useDocumentTitle('Cuenta suspendida')
  const { user, setUser } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const suspension = user?.suspension
  if (!user || !suspension) return null

  const appeal = suspension.appeal
  const pending = appeal?.status === 'pending'

  const send = async () => {
    setError('')
    if (message.trim().length < 20) return setError('Expón tu caso con al menos 20 caracteres.')
    setSaving(true)
    try {
      const res = await api.post<{ suspension: Suspension }>('/suspension/appeal', { message })
      setUser({ ...user, suspension: res.data.suspension })
      setMessage('')
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos enviar tu apelación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="page-container">
      <div className="suspended">
        <div className="suspended__head">
          <i className="bi bi-slash-circle" aria-hidden="true" />
          <div>
            <p className="eyebrow mb-1">Cuenta suspendida</p>
            <h1 className="h3 mb-0">Tu cuenta está suspendida</h1>
          </div>
        </div>

        <dl className="suspended__facts">
          <div>
            <dt>Motivo</dt>
            <dd>{suspension.reason}</dd>
          </div>
          <div>
            <dt>Fecha de la suspensión</dt>
            <dd>{formatDateTime(suspension.suspendedAt)}</dd>
          </div>
        </dl>
        <p className="text-secondary">
          Mientras tu cuenta esté suspendida no puedes usar la plataforma. Puedes leer nuestras <Link to="/convivencia">normas de convivencia</Link> y exponer tu caso al administrador con el formulario de abajo. Tu cuenta se reactivará cuando se acepte tu apelación.
        </p>

        <section className="suspended__appeal">
          <h2 className="h5">Apelación</h2>
          {pending && appeal && (
            <>
              <Alert variant="info">Enviaste tu apelación el {formatDateTime(appeal.sentAt)}. El administrador la está revisando; verás la respuesta aquí.</Alert>
              <p className="suspended__quote">“{appeal.message}”</p>
            </>
          )}
          {!pending && (
            <>
              {appeal?.status === 'rejected' && (
                <Alert variant="warning">
                  <strong>Tu apelación fue rechazada.</strong> {appeal.response}
                  <div className="small mt-1">Puedes enviar una nueva con más información.</div>
                </Alert>
              )}
              {error && <Alert variant="danger">{error}</Alert>}
              <Form.Label htmlFor="appeal-message">Cuéntale al administrador por qué debería reactivarse tu cuenta</Form.Label>
              <Form.Control id="appeal-message" as="textarea" rows={5} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Explica lo ocurrido, aporta contexto o pruebas y qué harás para respetar las normas." />
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
                <small className="text-secondary">{message.length}/1000</small>
                <Button variant="primary" onClick={send} disabled={saving}>
                  {saving ? 'Enviando…' : 'Enviar apelación'}
                </Button>
              </div>
            </>
          )}
        </section>

      </div>
    </Container>
  )
}
