import { useCallback, useEffect, useState } from 'react'
import { Alert, Container, Nav } from 'react-bootstrap'
import { AdminNav } from '../components/ui/AdminNav'
import { PageHero } from '../components/ui/PageHero'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { TutorApplication, TutorStatus } from '../types'
import { ListSkeleton } from '../components/ui/Skeleton'

const FILTERS: { value: TutorStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'inactive', label: 'Inactivos' },
]

type State = { kind: 'loading' } | { kind: 'ok'; tutors: TutorApplication[] } | { kind: 'error' }

// Bandeja de revisión: el administrador aprueba o rechaza perfiles nuevos, inactiva a tutores aprobados y atiende solicitudes de reactivación
export function AdminTutors() {
  useDocumentTitle('Revisión de tutores')
  const [status, setStatus] = useState<TutorStatus>('pending')
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [actionError, setActionError] = useState('')

  const load = useCallback((filter: TutorStatus) => {
    return api
      .get<{ tutors: TutorApplication[] }>('/admin/tutors', { params: { status: filter } })
      .then((res) => setState({ kind: 'ok', tutors: res.data.tutors }))
      .catch(() => setState({ kind: 'error' }))
  }, [])

  useEffect(() => {
    let active = true
    api
      .get<{ tutors: TutorApplication[] }>('/admin/tutors', { params: { status } })
      .then((res) => {
        if (active) setState({ kind: 'ok', tutors: res.data.tutors })
      })
      .catch(() => {
        if (active) setState({ kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [status])

  const changeFilter = (next: TutorStatus) => {
    setState({ kind: 'loading' })
    setRejecting(null)
    setStatus(next)
  }

  const review = async (id: string, decision: 'approved' | 'rejected' | 'inactive') => {
    setActionError('')
    try {
      await api.patch(`/admin/tutors/${id}/review`, { status: decision, note })
      setRejecting(null)
      setNote('')
      await load(status)
    } catch {
      setActionError(decision !== 'approved' ? 'Escribe el motivo (mínimo 5 caracteres).' : 'No se pudo guardar la decisión.')
    }
  }

  // La descarga lleva el JWT en el header, por eso se pide con axios y no con un enlace directo
  const downloadCv = async (tutor: TutorApplication) => {
    try {
      const res = await api.get<Blob>(`/admin/tutors/${tutor.id}/cv`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = url
      link.download = tutor.cvFileName ?? 'hoja-de-vida.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setActionError('No se pudo descargar la hoja de vida.')
    }
  }

  return (
    <>
      <PageHero eyebrow="Administración" title="Revisión de tutores" subtitle="Asegura la calidad del catálogo: valida datos y hoja de vida, y aprueba solo a los mejores tutores." />
      <AdminNav />
      <Container className="page-container">
        <Nav variant="pills" className="filter-pills mb-4" activeKey={status}>
          {FILTERS.map((filter) => (
            <Nav.Link key={filter.value} eventKey={filter.value} onClick={() => changeFilter(filter.value)}>
              {filter.label}
            </Nav.Link>
          ))}
        </Nav>

        {actionError && <Alert variant="danger">{actionError}</Alert>}
        {state.kind === 'loading' && <ListSkeleton label="Cargando" />}
        {state.kind === 'error' && <Alert variant="danger">No se pudo cargar la lista de tutores.</Alert>}
        {state.kind === 'ok' && state.tutors.length === 0 && <p className="text-secondary">No hay tutores en este estado.</p>}

        <div className="d-grid gap-3">
          {state.kind === 'ok' &&
            state.tutors.map((tutor) => (
              <article key={tutor.id} className="surface-card tutor-review">
                <header className="d-flex align-items-center gap-3 mb-3">
                  {tutor.picture && <img src={tutor.picture} alt="" className="avatar" referrerPolicy="no-referrer" />}
                  <div>
                    <h2 className="h5 mb-0">{tutor.name}</h2>
                    <small className="text-secondary">{tutor.email}</small>
                  </div>
                  <strong className="ms-auto rate">Q{tutor.hourlyRate}/h</strong>
                </header>

                <p className="mb-3">{tutor.bio}</p>

                <dl className="tutor-review__data">
                  <div>
                    <dt>Teléfono</dt>
                    <dd>{tutor.phone}</dd>
                  </div>
                  <div>
                    <dt>Documento</dt>
                    <dd>{tutor.documentId}</dd>
                  </div>
                  <div>
                    <dt>Dirección</dt>
                    <dd>{tutor.address}</dd>
                  </div>
                  <div>
                    <dt>Categorías</dt>
                    <dd>{tutor.categories.join(', ') || '—'}</dd>
                  </div>
                </dl>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  {tutor.cvFileName && (
                    <button type="button" className="btn btn-dark btn-sm" onClick={() => downloadCv(tutor)}>
                      <i className="bi bi-file-earmark-pdf me-2" aria-hidden="true" />
                      Hoja de vida (PDF)
                    </button>
                  )}
                  {tutor.portfolioUrl && (
                    <a href={tutor.portfolioUrl} target="_blank" rel="noreferrer" className="btn btn-dark btn-sm">
                      <i className="bi bi-box-arrow-up-right me-2" aria-hidden="true" />
                      Portafolio
                    </a>
                  )}
                </div>

                {tutor.status === 'rejected' && tutor.reviewNote && <p className="text-secondary mb-3">Motivo del rechazo: {tutor.reviewNote}</p>}
                {tutor.status === 'inactive' && tutor.reviewNote && <p className="text-secondary mb-3">Motivo de la inactivación: {tutor.reviewNote}</p>}
                {tutor.reactivationRequest && (
                  <Alert variant="info" className="mb-3">
                    <strong>Solicita reactivación</strong> · {new Date(tutor.reactivationRequest.sentAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <div className="mt-1">{tutor.reactivationRequest.message}</div>
                  </Alert>
                )}

                {rejecting === tutor.id ? (
                  <div>
                    <label htmlFor={`note-${tutor.id}`} className="form-label">
                      {tutor.status === 'pending' ? 'Motivo del rechazo' : tutor.status === 'inactive' ? 'Respuesta para el tutor' : 'Motivo de la inactivación (el tutor lo verá)'}
                    </label>
                    <textarea id={`note-${tutor.id}`} className="form-control mb-2" rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-dark btn-sm" onClick={() => review(tutor.id, tutor.status === 'pending' ? 'rejected' : 'inactive')}>
                        {tutor.status === 'pending' ? 'Confirmar rechazo' : tutor.status === 'inactive' ? 'Enviar respuesta' : 'Confirmar inactivación'}
                      </button>
                      <button type="button" className="btn btn-link btn-sm" onClick={() => setRejecting(null)}>
                        Cancelar
                      </button>
                    </div>
                    {tutor.status === 'approved' && <p className="small text-secondary mt-2 mb-0">Saldrá del catálogo y no recibirá solicitudes nuevas. Sus alumnos actuales terminan sus cursos.</p>}
                  </div>
                ) : (
                  <div className="d-flex gap-2">
                    {tutor.status !== 'approved' && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => review(tutor.id, 'approved')}>
                        {tutor.status === 'inactive' ? 'Reactivar' : 'Aprobar'}
                      </button>
                    )}
                    {(tutor.status === 'pending' || tutor.status === 'approved' || (tutor.status === 'inactive' && tutor.reactivationRequest)) && (
                      <button
                        type="button"
                        className="btn btn-dark btn-sm"
                        onClick={() => {
                          setRejecting(tutor.id)
                          setNote('')
                          setActionError('')
                        }}
                      >
                        {tutor.status === 'approved' ? 'Inactivar' : tutor.status === 'inactive' ? 'Rechazar solicitud' : 'Rechazar'}
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
        </div>
      </Container>
    </>
  )
}
