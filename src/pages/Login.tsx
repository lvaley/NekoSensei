import { Container } from 'react-bootstrap'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { GoogleSignIn } from '../components/auth/GoogleSignIn'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Login() {
  useDocumentTitle('Iniciar sesión')
  const { user } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/panel'

  if (user) return <Navigate to={from} replace />

  return (
    <Container className="page-container">
      <div className="surface-card auth-card mx-auto">
        <p className="eyebrow mb-2">Bienvenido de nuevo</p>
        <h1 className="h3 mb-2">Iniciar sesión</h1>
        <p className="text-secondary mb-4">Accede con tu cuenta de Google para continuar.</p>
        <GoogleSignIn redirectTo={from} />
        <p className="text-secondary small text-center mt-4 mb-0">
          ¿Aún no tienes cuenta? <Link to="/registro">Crea una aquí</Link>
        </p>
      </div>
    </Container>
  )
}
