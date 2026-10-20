import { useEffect, useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/ui/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { AuthUser, UserRole } from '../types'

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
const ROLE_SHORTCUTS: Record<UserRole, { icon: string; title: string; text: string; to?: string }[]> = {
  student: [
    { icon: 'bi-search', title: 'Buscar tutores', text: 'Filtra por materia, precio, modalidad y cercanía.', to: '/tutores' },
    { icon: 'bi-calendar-check', title: 'Mis reservas', text: 'Consulta y gestiona tus clases.' },
  ],
  tutor: [
    { icon: 'bi-person-vcard', title: 'Mi perfil de tutor', text: 'Biografía, portafolio y tarifa.', to: '/perfil' },
    { icon: 'bi-journal-text', title: 'Mis ofertas', text: 'Publica tus cursos, precios y modalidades.', to: '/mis-ofertas' },
  ],
  admin: [
    { icon: 'bi-people', title: 'Usuarios', text: 'Consulta las cuentas registradas.', to: '/admin' },
    { icon: 'bi-flag', title: 'Moderación', text: 'Denuncias y suspensiones.' },
  ],
}

const TUTOR_ALERT = {
  pending: { variant: 'warning', title: 'Perfil en revisión.', text: 'El equipo administrador está validando tus datos; te avisaremos cuando puedas publicar ofertas.' },
  approved: { variant: 'success', title: 'Perfil aprobado.', text: 'Ya puedes publicar tus cursos desde "Mis ofertas".' },
  rejected: { variant: 'danger', title: 'Perfil rechazado.', text: 'Corrige lo indicado y vuelve a guardar tu perfil para una nueva revisión.' },
} as const

export function Dashboard() {
  useDocumentTitle('Mi panel')
  const { user, setUser } = useAuth()
  const [greeting] = useState(() => greetingFor(new Date()))

  const isTutor = user?.role === 'tutor'
  const tutorStatus = user?.tutor?.status

  // El estado del perfil de tutor lo cambia el admin desde otra sesión: mientras esté
  // pendiente se consulta cada 10 s y al volver a la pestaña, para reflejar la decisión sin recargar
  useEffect(() => {
    if (!isTutor || !tutorStatus) return

    let active = true
    const refresh = () => {
      api
        .get<{ user: AuthUser }>('/auth/me')
        .then((res) => {
          const next = res.data.user.tutor
          if (active && next && (next.status !== tutorStatus || next.reviewNote !== user?.tutor?.reviewNote)) setUser(res.data.user)
        })
        .catch(() => undefined)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    const timer = tutorStatus === 'pending' ? window.setInterval(refresh, 10000) : undefined
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTutor, tutorStatus, setUser])
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
                {item.to ? (
                  <Link to={item.to} className="stretched-link mt-3 d-inline-block">
                    Abrir
                  </Link>
                ) : (
                  <p className="eyebrow mt-3 mb-0">Próximamente</p>
                )}
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
