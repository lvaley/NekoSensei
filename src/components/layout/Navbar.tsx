import { Container, Nav, NavDropdown, Navbar as BsNavbar } from 'react-bootstrap'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { SITE } from '../../config/site'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/tutores', label: 'Tutores' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/nosotros', label: 'Nosotros' },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
            {user ? (
              <NavDropdown title={user.name.split(' ')[0]} id="user-menu" align="end">
                <NavDropdown.Item as={Link} to="/panel">
                  Mi panel
                </NavDropdown.Item>
                {user.onboardingCompleted && (
                  <NavDropdown.Item as={Link} to="/perfil">
                    Mi perfil
                  </NavDropdown.Item>
                )}
                {user.role === 'tutor' && user.onboardingCompleted && (
                  <NavDropdown.Item as={Link} to="/mis-ofertas">
                    Mis ofertas
                  </NavDropdown.Item>
                )}
                {user.role === 'admin' && (
                  <NavDropdown.Item as={Link} to="/admin">
                    Administración
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item as="button" onClick={handleLogout}>
                  Cerrar sesión
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={NavLink} to="/login">
                Iniciar sesión
              </Nav.Link>
            )}
          </Nav>
          {!user && (
            <Link to="/registro" className="btn btn-cta ms-lg-2">
              Comenzar
            </Link>
          )}
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  )
}
