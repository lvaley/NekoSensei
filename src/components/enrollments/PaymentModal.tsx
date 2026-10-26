import axios from 'axios'
import { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import type { Enrollment, PaymentRecord } from '../../types'
import { classesLabel } from '../../utils/course'
import { formatDateTime } from '../../utils/dates'
import { money } from '../../utils/money'

interface PaymentModalProps {
  enrollment: Enrollment
  onClose: () => void
  // Se llama cuando el pago se aprueba (para recargar la lista)
  onPaid: () => void
}

const groupCard = (value: string) => value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

// Pago con tarjeta: el número de tarjeta y el CVV nunca se guardan
export function PaymentModal({ enrollment, onClose, onPaid }: PaymentModalProps) {
  // Se guarda al abrir: al aprobarse el pago la inscripción ya no trae cobro pendiente
  const [charge] = useState(enrollment.charge)
  const [number, setNumber] = useState('')
  const [holder, setHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ generated: number; payment: PaymentRecord } | null>(null)

  if (!charge) return null

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await api.post<{ generated: number; payment: PaymentRecord }>(`/enrollments/${enrollment.id}/pay`, { cardNumber: number, holder, expiry, cvv })
      setDone({ generated: res.data.generated, payment: res.data.payment })
      onPaid()
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos procesar el pago.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={onClose} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">
          {done ? 'Pago aprobado' : charge.kind === 'renewal' ? 'Renovar plan' : 'Pagar curso'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-grid gap-3">
        {done ? (
          <>
            <Alert variant="success" className="mb-0">
              Pagaste <strong>{money(done.payment.amount)}</strong> con tu tarjeta {done.payment.card?.brand} ···· {done.payment.card?.last4}.{' '}
              {done.generated > 0 ? `Se agendaron ${classesLabel(done.generated)} en tu agenda.` : 'Tu tutor agendará tus clases.'}
            </Alert>
            <small className="text-secondary">Guardamos tu comprobante en “Mis pagos”.</small>
          </>
        ) : (
          <>
            <div>
              <strong>{enrollment.offer.title}</strong>
              <div className="text-secondary small">con {enrollment.tutor.name}</div>
            </div>
            <div className="surface-card p-3">
              <div className="d-flex justify-content-between"><span>{classesLabel(enrollment.plan ? enrollment.plan.weeks * enrollment.plan.sessionsPerWeek : enrollment.offer.totalSessions)}</span><strong>{money(charge.classes)}</strong></div>
              {charge.travel > 0 && <div className="d-flex justify-content-between"><span>Traslado</span><strong>{money(charge.travel)}</strong></div>}
              <div className="d-flex justify-content-between border-top mt-2 pt-2"><span>Total</span><strong>{money(charge.total)}</strong></div>
              <small className="text-secondary d-block mt-2">Paga antes del {formatDateTime(charge.dueAt)}; después la solicitud vence y se libera el horario.</small>
            </div>
            {error && <Alert variant="danger" className="mb-0">{error}</Alert>}
            <small className="text-secondary"><i className="bi bi-lock me-1" aria-hidden="true" />Tus datos de pago se envían cifrados y no guardamos el número completo ni el CVV.</small>
            <div>
              <Form.Label htmlFor="pay-number">Número de tarjeta</Form.Label>
              <Form.Control id="pay-number" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" value={number} onChange={(event) => setNumber(groupCard(event.target.value))} />
            </div>
            <div>
              <Form.Label htmlFor="pay-holder">Nombre en la tarjeta</Form.Label>
              <Form.Control id="pay-holder" autoComplete="off" maxLength={60} value={holder} onChange={(event) => setHolder(event.target.value)} />
            </div>
            <div className="d-flex gap-3">
              <div className="flex-grow-1">
                <Form.Label htmlFor="pay-expiry">Vence (MM/AA)</Form.Label>
                <Form.Control id="pay-expiry" inputMode="numeric" autoComplete="off" placeholder="MM/AA" value={expiry} onChange={(event) => setExpiry(formatExpiry(event.target.value))} />
              </div>
              <div className="flex-grow-1">
                <Form.Label htmlFor="pay-cvv">CVV</Form.Label>
                <Form.Control id="pay-cvv" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="123" value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {done ? (
          <>
            <Link to="/agenda" className="btn btn-primary" onClick={onClose}>Ver mi agenda</Link>
            <Button variant="outline-secondary" onClick={onClose}>Cerrar</Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={submit} disabled={saving}>{saving ? 'Procesando…' : `Pagar ${money(charge.total)}`}</Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  )
}
