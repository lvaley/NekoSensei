import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/ui/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { UserRole } from '../types'

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Estudiante',
  tutor: 'Tutor',
  admin: 'Administrador',
}

// Accesos de cada rol; se irán activando en las próximas versiones
const ROLE_SHORTCUTS: Record<UserRole, { icon: string; title: string; text: string }[]> = {
  student: [
    { icon: 'bi-search', title: 'Buscar tutores', text: 'Filtra por materia, precio y modalidad.' },
    { icon: 'bi-calendar-check', title: 'Mis reservas', text: 'Consulta y gestiona tus clases.' },
  ],
  tutor: [
    { icon: 'bi-person-vcard', title: 'Mi perfil de tutor', text: 'Biografía, portafolio y tarifa.' },
    { icon: 'bi-journal-text', title: 'Mis ofertas', text: 'Publica cursos y tu disponibilidad.' },
  ],
  admin: [
    { icon: 'bi-people', title: 'Usuarios', text: 'Consulta las cuentas registradas.' },
    { icon: 'bi-flag', title: 'Moderación', text: 'Denuncias y suspensiones.' },
  ],
}

export function Dashboard() {
  useDocumentTitle('Mi panel')
  const { user } = useAuth()
  if (!user) return null

  return (
    <>
      <PageHero eyebrow={ROLE_LABEL[user.role]} title={`Hola, ${user.name.split(' ')[0]}`} subtitle={user.email} />

      <Container className="page-container">
        <Row className="g-4">
          {ROLE_SHORTCUTS[user.role].map((item) => (
            <Col md={6} key={item.title}>
              <div className="surface-card feature-card">
                <i className={`bi ${item.icon} feature-card__icon`} aria-hidden="true" />
                <h2 className="h5">{item.title}</h2>
                <p className="text-secondary mb-0">{item.text}</p>
                <p className="eyebrow mt-3 mb-0">Próximamente</p>
              </div>
            </Col>
          ))}
        </Row>
        {user.role === 'admin' && (
          <div className="mt-4">
            <Link to="/admin" className="btn btn-primary">
              Ver usuarios registrados
            </Link>
          </div>
        )}
      </Container>
    </>
  )
}
