import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

interface ComingSoonProps {
  title: string
}

// Marcador temporal para las secciones que se construirán en las próximas versiones
export function ComingSoon({ title }: ComingSoonProps) {
  useDocumentTitle(title)

  return (
    <Container className="page-container text-center">
      <div className="surface-card mx-auto" style={{ maxWidth: 560 }}>
        <p className="eyebrow mb-2">Próximamente</p>
        <h1 className="h3 mb-3">{title}</h1>
        <p className="text-secondary">Estamos construyendo esta sección.</p>
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </Container>
  )
}
