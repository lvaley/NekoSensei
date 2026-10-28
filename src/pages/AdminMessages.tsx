import { useEffect, useState } from 'react'
import { Alert, Container } from 'react-bootstrap'
import { AdminNav } from '../components/ui/AdminNav'
import { PageHero } from '../components/ui/PageHero'
import { ListSkeleton } from '../components/ui/Skeleton'
import { CONTACT_SUBJECTS } from '../content/contact'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { AdminContactMessage } from '../types'
import { formatDateTime } from '../utils/dates'

type State = { kind: 'loading' } | { kind: 'ok'; messages: AdminContactMessage[] } | { kind: 'error' }

// Mensajes que llegan desde la página de contacto (administrador)
export function AdminMessages() {
  useDocumentTitle('Mensajes de contacto')
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    api
      .get<{ messages: AdminContactMessage[] }>('/admin/contact-messages')
      .then((res) => !cancelled && setState({ kind: 'ok', messages: res.data.messages }))
      .catch(() => !cancelled && setState({ kind: 'error' }))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHero eyebrow="Administración" title="Mensajes de contacto" subtitle="Cada mensaje es una oportunidad: atiende consultas, sugerencias y solicitudes de tu comunidad con rapidez." />
      <AdminNav />
      <Container className="page-container">
        {state.kind === 'loading' && <ListSkeleton label="Cargando mensajes" />}
        {state.kind === 'error' && <Alert variant="danger">No pudimos cargar los mensajes.</Alert>}
        {state.kind === 'ok' && state.messages.length === 0 && <div className="surface-card text-center text-secondary">Aún no hay mensajes de contacto.</div>}
        {state.kind === 'ok' && (
          <div className="d-grid gap-3">
            {state.messages.map((item) => (
              <article className="surface-card admin-report" key={item.id}>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <span className="badge-soft">{CONTACT_SUBJECTS.find((subject) => subject.value === item.subject)?.label ?? item.subject}</span>
                    <span className="small text-secondary ms-2">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <a href={`mailto:${item.email}`} className="small">
                    <i className="bi bi-envelope me-1" aria-hidden="true" />
                    Responder
                  </a>
                </div>
                <p className="admin-report__detail">{item.message}</p>
                <div className="small">
                  <strong>{item.name}</strong> <span className="text-secondary">· {item.email}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  )
}
