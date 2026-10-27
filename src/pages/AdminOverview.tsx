import { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/ui/PageHero'
import { ListSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'

interface Overview {
  students: number
  tutors: number
  pendingTutors: number
  suspended: number
  pendingAppeals: number
  openReports: number
  messagesWeek: number
  messagesTotal: number
  activeEnrollments: number
  activeOffers: number
  categories: number
}

// Panel del administrador: lo pendiente arriba (con acceso directo) y las cifras generales debajo
export function AdminOverview() {
  const { user } = useAuth()
  const [data, setData] = useState<Overview | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api
      .get<Overview>('/admin/overview')
      .then((res) => setData(res.data))
      .catch(() => setFailed(true))
  }, [])

  const pending = data
    ? [
        { icon: 'bi-person-check', title: 'Tutores por revisar', count: data.pendingTutors, to: '/admin/tutores', text: 'Perfiles esperando aprobación.' },
        { icon: 'bi-flag', title: 'Denuncias abiertas', count: data.openReports, to: '/admin/denuncias', text: 'Pendientes o en revisión.' },
        { icon: 'bi-shield-exclamation', title: 'Apelaciones', count: data.pendingAppeals, to: '/admin/denuncias', text: 'Cuentas suspendidas que apelaron.' },
        { icon: 'bi-envelope', title: 'Mensajes (7 días)', count: data.messagesWeek, to: '/admin/mensajes', text: `${data.messagesTotal} en total.` },
      ]
    : []

  const figures = data
    ? [
        { label: 'Estudiantes', value: data.students },
        { label: 'Tutores aprobados', value: data.tutors },
        { label: 'Cursos activos', value: data.activeOffers },
        { label: 'Inscripciones activas', value: data.activeEnrollments },
        { label: 'Cuentas suspendidas', value: data.suspended },
        { label: 'Categorías', value: data.categories },
      ]
    : []

  return (
    <>
      <PageHero eyebrow="Administrador" title={`Panel de administración`} subtitle={user?.email} />
      <Container className="page-container">
        {!data && !failed && <ListSkeleton rows={3} label="Cargando resumen" />}
        {failed && <p className="text-danger">No pudimos cargar el resumen. Intenta de nuevo.</p>}
        {data && (
          <>
            <h2 className="h5 mb-3">Requiere tu atención</h2>
            <Row className="g-3 mb-5">
              {pending.map((item) => (
                <Col sm={6} lg={3} key={item.title}>
                  <div className={`surface-card admin-pending${item.count > 0 ? ' admin-pending--alert' : ''}`}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <strong className="admin-pending__count">{item.count}</strong>
                    <h3 className="h6 mb-1">{item.title}</h3>
                    <p className="text-secondary small mb-0">{item.text}</p>
                    <Link to={item.to} className="stretched-link small mt-2 d-inline-block">
                      Abrir
                    </Link>
                  </div>
                </Col>
              ))}
            </Row>

            <h2 className="h5 mb-3">Gestión</h2>
            <Row className="g-3 mb-5">
              {[
                { icon: 'bi-people', title: 'Usuarios', text: 'Cuentas, suspensión y reactivación.', to: '/admin' },
                { icon: 'bi-person-check', title: 'Tutores', text: 'Revisión de perfiles de tutor.', to: '/admin/tutores' },
                { icon: 'bi-flag', title: 'Denuncias', text: 'Bandeja de denuncias y apelaciones.', to: '/admin/denuncias' },
                { icon: 'bi-envelope', title: 'Mensajes', text: 'Mensajes del formulario de contacto.', to: '/admin/mensajes' },
                { icon: 'bi-tags', title: 'Categorías', text: 'Catálogo de materias.', to: '/admin/categorias' },
              ].map((item) => (
                <Col sm={6} lg={4} key={item.title}>
                  <div className="surface-card feature-card">
                    <i className={`bi ${item.icon} feature-card__icon`} aria-hidden="true" />
                    <h3 className="h6">{item.title}</h3>
                    <p className="text-secondary small mb-0">{item.text}</p>
                    <Link to={item.to} className="stretched-link mt-2 d-inline-block small">
                      Abrir
                    </Link>
                  </div>
                </Col>
              ))}
            </Row>

            <h2 className="h5 mb-3">Resumen</h2>
            <Row className="g-3">
              {figures.map((item) => (
                <Col xs={6} md={4} lg={2} key={item.label}>
                  <div className="surface-card admin-figure">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>
    </>
  )
}
