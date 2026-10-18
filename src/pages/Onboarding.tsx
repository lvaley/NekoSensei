import { Col, Container, Row } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'
import { ProfileForm } from '../components/profile/ProfileForm'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Primer ingreso: el usuario completa sus datos antes de usar la plataforma
export function Onboarding() {
  useDocumentTitle('Completa tu perfil')
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user || user.onboardingCompleted) return <Navigate to="/panel" replace />

  return (
    <Container className="page-container">
      <Row className="justify-content-center">
        <Col lg={9} xl={8}>
          <p className="eyebrow mb-2">Bienvenido, {user.name.split(' ')[0]}</p>
          <h1 className="h2 mb-2">Completa tu perfil</h1>
          <p className="text-secondary mb-4">Necesitamos unos datos más para activar tu cuenta. Solo lo harás una vez.</p>
          <ProfileForm mode="onboarding" onSaved={() => navigate('/panel', { replace: true })} />
        </Col>
      </Row>
    </Container>
  )
}
