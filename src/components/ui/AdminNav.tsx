import { Container, Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Usuarios', end: true },
  { to: '/admin/tutores', label: 'Tutores' },
  { to: '/admin/denuncias', label: 'Denuncias' },
  { to: '/admin/mensajes', label: 'Mensajes' },
  { to: '/admin/categorias', label: 'Categorías' },
]

// Navegación interna del área de administración
export function AdminNav() {
  return (
    <div className="admin-nav">
      <Container>
        <Nav>
          {tabs.map((tab) => (
            <Nav.Link key={tab.to} as={NavLink} to={tab.to} end={tab.end}>
              {tab.label}
            </Nav.Link>
          ))}
        </Nav>
      </Container>
    </div>
  )
}
