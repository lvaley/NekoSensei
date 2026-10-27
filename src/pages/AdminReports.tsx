import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Container, Nav } from 'react-bootstrap'
import { AdminNav } from '../components/ui/AdminNav'
import { PageHero } from '../components/ui/PageHero'
import { ListSkeleton } from '../components/ui/Skeleton'
import { TextPromptModal } from '../components/ui/TextPromptModal'
import { REPORT_STATUS_LABELS } from '../content/reports'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { AdminReport, AdminSuspension, ReportStatus } from '../types'
import { formatDateTime } from '../utils/dates'

const ROLE_LABEL = { student: 'Estudiante', tutor: 'Tutor', admin: 'Administrador' } as const
type Tab = 'abiertas' | 'cerradas' | 'apelaciones'
type Action = { kind: 'close'; report: AdminReport; status: 'resolved' | 'dismissed' } | { kind: 'suspend'; report: AdminReport } | { kind: 'reject'; item: AdminSuspension }

// Bandeja del administrador: denuncias por revisar y apelaciones de cuentas suspendidas
export function AdminReports() {
  useDocumentTitle('Denuncias')
  const [tab, setTab] = useState<Tab>('abiertas')
  const [reports, setReports] = useState<AdminReport[] | null>(null)
  const [suspensions, setSuspensions] = useState<AdminSuspension[] | null>(null)
  const [error, setError] = useState('')
  const [action, setAction] = useState<Action | null>(null)

  const load = useCallback(async () => {
    try {
      const [reportsRes, suspensionsRes] = await Promise.all([api.get<{ reports: AdminReport[] }>('/admin/reports'), api.get<{ suspensions: AdminSuspension[] }>('/admin/suspensions')])
      setReports(reportsRes.data.reports)
      setSuspensions(suspensionsRes.data.suspensions)
      setError('')
    } catch {
      setError('No pudimos cargar las denuncias.')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const run = async (request: () => Promise<unknown>) => {
    await request()
    setAction(null)
    await load()
  }

  const open = reports?.filter((report) => report.status === 'pending' || report.status === 'reviewing') ?? []
  const closed = reports?.filter((report) => report.status === 'resolved' || report.status === 'dismissed') ?? []
  const pendingAppeals = suspensions?.filter((item) => item.appeal?.status === 'pending').length ?? 0
  const list = tab === 'abiertas' ? open : closed

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'abiertas', label: 'Por revisar', count: open.length },
    { key: 'cerradas', label: 'Cerradas', count: closed.length },
    { key: 'apelaciones', label: 'Apelaciones', count: pendingAppeals },
  ]

  return (
    <>
      <PageHero eyebrow="Administración" title="Denuncias y apelaciones" subtitle="Revisa las denuncias entre estudiantes y tutores, suspende cuentas y responde las apelaciones." />
      <AdminNav />
      <Container className="page-container">
        <Nav variant="pills" className="enrollment-tabs mb-3">
          {tabs.map((item) => (
            <Nav.Item key={item.key}>
              <Nav.Link active={tab === item.key} as="button" type="button" onClick={() => setTab(item.key)}>
                {item.label} <span className="enrollment-tabs__count">{item.count}</span>
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {error && <Alert variant="danger">{error}</Alert>}
        {!reports && !error && <ListSkeleton label="Cargando denuncias" />}

        {reports && tab !== 'apelaciones' && list.length === 0 && (
          <div className="surface-card text-center text-secondary">{tab === 'abiertas' ? 'No hay denuncias por revisar.' : 'Aún no hay denuncias cerradas.'}</div>
        )}

        {reports && tab !== 'apelaciones' && (
          <div className="d-grid gap-3">
            {list.map((report) => {
              const status = REPORT_STATUS_LABELS[report.status]
              return (
                <article className="surface-card admin-report" key={report.id}>
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <div>
                      <span className="badge-soft">{report.reasonLabel}</span>
                      <span className="small text-secondary ms-2">{formatDateTime(report.createdAt)}</span>
                    </div>
                    <span className={`enrollment-status ${status.className}`}>{status.text}</span>
                  </div>
                  <p className="admin-report__detail">“{report.detail}”</p>
                  <div className="admin-report__people">
                    <div>
                      <span className="admin-report__label">Denunciante</span>
                      {report.reporter.name} <small className="text-secondary">· {ROLE_LABEL[report.reporter.role]} · {report.reporter.email}</small>
                    </div>
                    <div>
                      <span className="admin-report__label">Denunciado</span>
                      {report.reported.name} <small className="text-secondary">· {ROLE_LABEL[report.reported.role]} · {report.reported.email}</small>
                      {report.reported.suspended && <span className="badge text-bg-danger ms-2">Suspendido</span>}
                      <div className="small text-secondary">{report.reported.totalReports} {report.reported.totalReports === 1 ? 'denuncia' : 'denuncias'} en total contra esta persona</div>
                    </div>
                  </div>
                  {report.adminNote && (
                    <p className="small mb-0 mt-2">
                      <strong>Nota del equipo:</strong> {report.adminNote}
                    </p>
                  )}
                  {(report.status === 'pending' || report.status === 'reviewing') && (
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {report.status === 'pending' && (
                        <Button size="sm" variant="outline-dark" onClick={() => void run(() => api.patch(`/admin/reports/${report.id}`, { status: 'reviewing' satisfies ReportStatus }))}>
                          Marcar en revisión
                        </Button>
                      )}
                      <Button size="sm" variant="outline-secondary" onClick={() => setAction({ kind: 'close', report, status: 'dismissed' })}>
                        Descartar
                      </Button>
                      <Button size="sm" variant="outline-primary" onClick={() => setAction({ kind: 'close', report, status: 'resolved' })}>
                        Resolver sin suspender
                      </Button>
                      {!report.reported.suspended && (
                        <Button size="sm" variant="danger" onClick={() => setAction({ kind: 'suspend', report })}>
                          Suspender cuenta
                        </Button>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {suspensions && tab === 'apelaciones' && (
          <div className="d-grid gap-3">
            {suspensions.length === 0 && <div className="surface-card text-center text-secondary">No hay cuentas suspendidas.</div>}
            {suspensions.map((item) => (
              <article className="surface-card admin-report" key={item.user.id}>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <strong>{item.user.name}</strong> <small className="text-secondary">· {ROLE_LABEL[item.user.role]} · {item.user.email}</small>
                  </div>
                  {item.appeal?.status === 'pending' ? <span className="enrollment-status is-pending">Apelación pendiente</span> : <span className="enrollment-status is-closed">{item.appeal ? 'Apelación rechazada' : 'Sin apelación'}</span>}
                </div>
                <p className="small mt-2 mb-1">
                  <strong>Suspendida el {formatDateTime(item.suspendedAt)}:</strong> {item.reason}
                </p>
                {item.appeal && <p className="admin-report__detail">“{item.appeal.message}”</p>}
                {item.appeal?.status === 'rejected' && item.appeal.response && (
                  <p className="small mb-0">
                    <strong>Tu respuesta:</strong> {item.appeal.response}
                  </p>
                )}
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {item.appeal?.status === 'pending' && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => void run(() => api.patch(`/admin/users/${item.user.id}/appeal`, { decision: 'accept' }))}>
                        Aceptar y reactivar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setAction({ kind: 'reject', item })}>
                        Rechazar
                      </Button>
                    </>
                  )}
                  {!item.appeal?.status || item.appeal.status !== 'pending' ? (
                    <Button size="sm" variant="outline-dark" onClick={() => window.confirm(`¿Reactivar la cuenta de ${item.user.name}?`) && void run(() => api.post(`/admin/users/${item.user.id}/reactivate`))}>
                      Reactivar sin apelación
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>

      {action?.kind === 'close' && (
        <TextPromptModal
          title={action.status === 'dismissed' ? 'Descartar denuncia' : 'Resolver denuncia'}
          intro={<>La nota se envía a {action.report.reporter.name} como cierre de su denuncia.</>}
          label="Nota de cierre"
          placeholder={action.status === 'dismissed' ? 'Ej.: No encontramos evidencia suficiente.' : 'Ej.: Hablamos con la persona y se corrigió la situación.'}
          minLength={5}
          maxLength={500}
          confirmLabel={action.status === 'dismissed' ? 'Descartar' : 'Resolver'}
          onSubmit={(note) => run(() => api.patch(`/admin/reports/${action.report.id}`, { status: action.status, note }))}
          onClose={() => setAction(null)}
        />
      )}
      {action?.kind === 'suspend' && (
        <TextPromptModal
          title={`Suspender a ${action.report.reported.name}`}
          intro="La persona podrá iniciar sesión, pero solo verá este motivo y un formulario de apelación. Las denuncias abiertas contra ella se marcarán como resueltas."
          label="Motivo de la suspensión"
          placeholder="Se muestra a la persona suspendida."
          minLength={10}
          maxLength={500}
          confirmLabel="Suspender cuenta"
          confirmVariant="danger"
          onSubmit={(reason) => run(() => api.post(`/admin/users/${action.report.reported.id}/suspend`, { reason, reportId: action.report.id }))}
          onClose={() => setAction(null)}
        />
      )}
      {action?.kind === 'reject' && (
        <TextPromptModal
          title="Rechazar apelación"
          intro={<>{action.item.user.name} verá tu respuesta y podrá enviar una nueva apelación.</>}
          label="Respuesta"
          minLength={5}
          maxLength={500}
          confirmLabel="Rechazar apelación"
          confirmVariant="danger"
          onSubmit={(response) => run(() => api.patch(`/admin/users/${action.item.user.id}/appeal`, { decision: 'reject', response }))}
          onClose={() => setAction(null)}
        />
      )}
    </>
  )
}
