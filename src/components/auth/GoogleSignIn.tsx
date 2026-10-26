import { GoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { GOOGLE_CLIENT_ID } from '../../config/site'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

interface GoogleSignInProps {
  // Rol elegido al registrarse (solo aplica a cuentas nuevas)
  role?: Exclude<UserRole, 'admin'>
  // Ruta a la que se vuelve después de iniciar sesión
  redirectTo: string
}

export function GoogleSignIn({ role, redirectTo }: GoogleSignInProps) {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Alert variant="warning" className="mb-0">
        El inicio de sesión con Google aún no está configurado. Define <code>VITE_GOOGLE_CLIENT_ID</code> en el archivo{' '}
        <code>.env</code> del frontend.
      </Alert>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-center">
        <GoogleLogin
          onSuccess={(response) => {
            if (!response.credential) {
              setError('Google no devolvió una credencial válida.')
              return
            }
            setError('')
            loginWithGoogle(response.credential, role)
              .then(() => navigate(redirectTo, { replace: true }))
              .catch(() => setError('No pudimos iniciar tu sesión. Inténtalo de nuevo.'))
          }}
          onError={() => setError('No se pudo completar el inicio de sesión con Google.')}
          text="continue_with"
          shape="pill"
        />
      </div>
      {error && (
        <Alert variant="danger" className="mt-3 mb-0" role="alert">
          {error}
        </Alert>
      )}
    </div>
  )
}
