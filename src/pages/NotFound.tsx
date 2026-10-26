import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function NotFound() {
  const { user, loading } = useAuth()

  return (
    <Container className="page-container text-center">
      <h1 className="display-4">404</h1>
      <p>La página que buscas no existe.</p>
      {!loading && (user ? <Link to="/panel">Volver a mi panel</Link> : <Link to="/">Volver al inicio</Link>)}
    </Container>
  )
}
