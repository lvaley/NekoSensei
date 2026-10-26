import { useEffect, useState } from 'react'
import { Alert, Container } from 'react-bootstrap'
import { PageHero } from '../components/ui/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { PaymentRecord } from '../types'
import { classesLabel } from '../utils/course'
import { money } from '../utils/money'
import { ListSkeleton } from '../components/ui/Skeleton'

// Historial de pagos: el estudiante ve lo que pagó y el tutor lo que recibió
export function Payments() {
  const { user } = useAuth()
  const asTutor = user?.role === 'tutor'
  useDocumentTitle(asTutor ? 'Pagos recibidos' : 'Mis pagos')
  const [state, setState] = useState<{ items?: PaymentRecord[]; error?: boolean }>({})

  useEffect(() => {
    let active = true
    api
      .get<{ payments: PaymentRecord[] }>('/payments')
      .then((res) => active && setState({ items: res.data.payments }))
      .catch(() => active && setState({ error: true }))
    return () => {
      active = false
    }
  }, [])

  const items = asTutor ? state.items?.filter((item) => item.status === 'paid') : state.items
  const paid = items?.filter((item) => item.status === 'paid') ?? []
  const total = paid.reduce((sum, item) => sum + item.amount, 0)

  return (
    <>
      <PageHero eyebrow={asTutor ? 'Tutor' : 'Estudiante'} title={asTutor ? 'Pagos recibidos' : 'Mis pagos'} subtitle={asTutor ? 'El historial de los pagos que recibes por tus clases.' : 'El historial de tus pagos y renovaciones.'} />
      <Container className="page-container">
        {state.error && <Alert variant="danger">No pudimos cargar los pagos.</Alert>}
        {!items && !state.error && <ListSkeleton label="Cargando tus pagos" />}
        {items && items.length === 0 && (
          <div className="surface-card text-center">
            <p className="text-secondary mb-0">{asTutor ? 'Todavía no has recibido pagos.' : 'Todavía no has hecho pagos.'}</p>
          </div>
        )}
        {items && items.length > 0 && (
          <>
            <p className="mb-3">
              {asTutor ? 'Total recibido' : 'Total pagado'}: <strong>{money(total)}</strong> en {paid.length} {paid.length === 1 ? 'pago' : 'pagos'}.
            </p>
            <div className="surface-card p-0 table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Curso</th>
                    <th>{asTutor ? 'Estudiante' : 'Tutor'}</th>
                    <th>Concepto</th>
                    <th className="text-end">Clases</th>
                    <th className="text-end">Traslado</th>
                    <th className="text-end">Total</th>
                    <th>Tarjeta</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.createdAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        {item.offerTitle}
                        <div className="small text-secondary">Bloque {item.cycle}</div>
                      </td>
                      <td>{item.other}</td>
                      <td>
                        {item.kind === 'renewal' ? 'Renovación' : 'Primer pago'}
                        {item.sessions > 0 && <div className="small text-secondary">{classesLabel(item.sessions)}</div>}
                      </td>
                      <td className="text-end">{money(item.classes)}</td>
                      <td className="text-end">{money(item.travel)}</td>
                      <td className="text-end"><strong>{money(item.amount)}</strong></td>
                      <td>{item.card ? `${item.card.brand} ···· ${item.card.last4}` : '—'}</td>
                      <td>
                        {item.status === 'paid' ? <span className="enrollment-status is-active">Aprobado</span> : <span className="enrollment-status is-closed" title={item.failureReason ?? ''}>Rechazado</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Container>
    </>
  )
}
