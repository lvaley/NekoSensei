import { useEffect, useState } from 'react'
import { Alert, Container } from 'react-bootstrap'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { GoogleSignIn } from '../components/auth/GoogleSignIn'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NOTICE_KEY } from '../services/api'

const NOTICE_TEXT = {
  logout: '¡Cerraste sesión correctamente, nos vemos pronto!',
  expired: '¡Ups! Tu sesión expiró, inicia sesión de nuevamente para seguir aprendiendo.',
} as const
const NOTICE_MS = 4000

type Notice = keyof typeof NOTICE_TEXT

// Lee y borra el aviso pendiente para que se muestre una sola vez
function takeNotice(): Notice | null {
  try {
    const value = sessionStorage.getItem(NOTICE_KEY)
    sessionStorage.removeItem(NOTICE_KEY)
    return value === 'logout' || value === 'expired' ? value : null
  } catch {
    return null
  }
}

export function Login() {
  useDocumentTitle('Iniciar sesión')
  const { user } = useAuth()
  const location = useLocation()
  const [notice, setNotice] = useState<Notice | null>(takeNotice)

  // El aviso desaparece solo después de unos segundos
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [notice])
  const from = (location.state as { from?: string } | null)?.from ?? '/panel'

  if (user) return <Navigate to={from} replace />

  return (
    <Container className="page-container">
      {notice && (
        <Alert
          variant={notice === 'logout' ? 'success' : 'warning'}
          className="auth-notice mx-auto"
          dismissible
          onClose={() => setNotice(null)}
          role="status"
        >
          {NOTICE_TEXT[notice]}
        </Alert>
      )}
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
