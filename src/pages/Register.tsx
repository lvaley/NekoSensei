import { useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link, Navigate } from 'react-router-dom'
import { GoogleSignIn } from '../components/auth/GoogleSignIn'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { UserRole } from '../types'

type SelfRole = Exclude<UserRole, 'admin'>

const roleOptions: { value: SelfRole; icon: string; title: string; text: string }[] = [
  { value: 'student', icon: 'bi-mortarboard', title: 'Quiero aprender', text: 'Busca tutores y reserva tus clases.' },
  { value: 'tutor', icon: 'bi-person-workspace', title: 'Quiero enseñar', text: 'Publica tus ofertas y gestiona tus reservas.' },
]

export function Register() {
  useDocumentTitle('Crear cuenta')
  const { user } = useAuth()
  const [role, setRole] = useState<SelfRole>('student')

  if (user) return <Navigate to="/panel" replace />

  return (
    <Container className="page-container">
      <div className="surface-card auth-card mx-auto">
        <p className="eyebrow mb-2">Únete</p>
        <h1 className="h3 mb-2">Crear cuenta</h1>
        <p className="text-secondary mb-4">Elige cómo quieres usar Neko Sensei y continúa con Google.</p>

        <div className="role-picker" role="radiogroup" aria-label="Tipo de cuenta">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={role === option.value}
              className={`role-option${role === option.value ? ' is-active' : ''}`}
              onClick={() => setRole(option.value)}
            >
              <i className={`bi ${option.icon}`} aria-hidden="true" />
              <strong>{option.title}</strong>
              <small>{option.text}</small>
            </button>
          ))}
        </div>

        <GoogleSignIn role={role} redirectTo="/panel" />
        <p className="text-secondary small text-center mt-4 mb-0">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </Container>
  )
}
