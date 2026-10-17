import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <Container className="page-container text-center">
      <h1 className="display-4">404</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </Container>
  )
}
