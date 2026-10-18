import { useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
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

// Saludo según la hora local del dispositivo: 5:00–11:59 días, 12:00–18:59 tardes, resto noches
function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
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

const TUTOR_ALERT = {
  pending: { variant: 'warning', title: 'Perfil en revisión.', text: 'El equipo administrador está validando tus datos; te avisaremos cuando puedas publicar ofertas.' },
  approved: { variant: 'success', title: 'Perfil aprobado.', text: 'Ya puedes preparar tus ofertas de tutoría (disponible en la próxima versión).' },
  rejected: { variant: 'danger', title: 'Perfil rechazado.', text: 'Corrige lo indicado y vuelve a guardar tu perfil para una nueva revisión.' },
} as const

export function Dashboard() {
  useDocumentTitle('Mi panel')
  const { user } = useAuth()
  const [greeting] = useState(() => greetingFor(new Date()))
  if (!user) return null

  return (
    <>
      <PageHero eyebrow={ROLE_LABEL[user.role]} title={`${greeting}, ${user.name.split(' ')[0]}`} subtitle={user.email} />

      <Container className="page-container">
        {user.role === 'tutor' && user.tutor && (
          <Alert variant={TUTOR_ALERT[user.tutor.status].variant} className="mb-4">
            <strong>{TUTOR_ALERT[user.tutor.status].title}</strong> {TUTOR_ALERT[user.tutor.status].text}
            {user.tutor.status === 'rejected' && user.tutor.reviewNote && <div className="mt-1">Motivo: {user.tutor.reviewNote}</div>}
            {user.tutor.status !== 'approved' && (
              <div className="mt-2">
                <Link to="/perfil">Revisar mi perfil</Link>
              </div>
            )}
          </Alert>
        )}
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
            <Link to="/admin/tutores" className="btn btn-primary">
              Revisar tutores
            </Link>
          </div>
        )}
      </Container>
    </>
  )
}
