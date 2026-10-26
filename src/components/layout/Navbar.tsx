import { Container, Nav, Navbar as BsNavbar } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'
import { SITE } from '../../config/site'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/tutores', label: 'Tutores' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/login', label: 'Iniciar sesión' },
]

export function Navbar() {
  return (
    <BsNavbar expand="lg" sticky="top" className="site-navbar">
      <Container>
        <BsNavbar.Brand as={Link} to="/" className="brand">
          {SITE.name}
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="main-nav" />

        {/* Todos los enlaces y el botón quedan alineados a la derecha en escritorio */}
        <BsNavbar.Collapse id="main-nav" className="justify-content-lg-end">
          <Nav className="align-items-lg-center">
            {links.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.end}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
          <Link to="/registro" className="btn btn-cta ms-lg-2">
            Comenzar
          </Link>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  )
}
