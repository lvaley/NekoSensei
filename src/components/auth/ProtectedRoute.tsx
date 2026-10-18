import { Container, Spinner } from 'react-bootstrap'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

interface ProtectedRouteProps {
  // Si se omite, basta con haber iniciado sesión
  roles?: UserRole[]
}

// Protege un grupo de rutas: exige sesión y, opcionalmente, uno de los roles indicados
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Container className="page-container text-center">
        <Spinner animation="border" role="status" aria-label="Cargando sesión" />
      </Container>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Container className="page-container text-center">
        <div className="surface-card mx-auto" style={{ maxWidth: 560 }}>
          <p className="eyebrow mb-2">Acceso restringido</p>
          <h1 className="h3 mb-3">No tienes permisos para ver esta página</h1>
          <Link to="/panel" className="btn btn-primary">
            Ir a mi panel
          </Link>
        </div>
      </Container>
    )
  }

  return <Outlet />
}
