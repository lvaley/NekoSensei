import {
  Container,
  Nav,
  NavDropdown,
  Navbar as BsNavbar,
} from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { SITE } from "../../config/site";
import { useAuth } from "../../hooks/useAuth";
import { ChatButton } from "./ChatButton";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const HOME: NavItem = { to: "/", label: "Inicio", end: true };
const ABOUT: NavItem = { to: "/nosotros", label: "Nosotros" };

// Cada rol ve su propio menú: el estudiante estudia y explora, el tutor gestiona ofertas y alumnos.
// Inicio y Nosotros son páginas de presentación: solo las ven los visitantes (el logo sigue llevando al inicio)
function navLinks(role?: string): NavItem[] {
  if (role === "student")
    return [
      { to: "/mis-cursos", label: "Mis cursos" },
      { to: "/agenda", label: "Agenda" },
      { to: "/tutores", label: "Tutores" },
      { to: "/cursos", label: "Cursos" },
    ];
  if (role === "tutor")
    return [
      { to: "/mis-ofertas", label: "Mis ofertas" },
      { to: "/mis-estudiantes", label: "Mis estudiantes" },
      { to: "/agenda", label: "Agenda" },
    ];
  // El administrador entra a sus secciones desde el panel; en la barra tiene el panel y el catálogo
  if (role === "admin")
    return [
      { to: "/panel", label: "Panel" },
      { to: "/tutores", label: "Tutores" },
      { to: "/cursos", label: "Cursos" },
    ];
  return [
    HOME,
    { to: "/tutores", label: "Tutores" },
    { to: "/cursos", label: "Cursos" },
    ABOUT,
  ];
}

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Cuenta suspendida: la barra solo deja cerrar sesión
  if (user?.suspension) {
    return (
      <BsNavbar sticky="top" className="site-navbar">
        <Container>
          <span className="brand navbar-brand">{SITE.name}</span>
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </Container>
      </BsNavbar>
    );
  }

  return (
    <BsNavbar expand="lg" sticky="top" className="site-navbar">
      <Container>
        <BsNavbar.Brand as={Link} to={user ? '/panel' : '/'} className="brand">
          {SITE.name}
        </BsNavbar.Brand>

        {/* La campanita queda siempre visible: junto al menú en móvil y al final de la barra en escritorio */}
        {user && (
          <div className="order-1 order-lg-3 ms-auto ms-lg-1 me-2 me-lg-0 d-flex align-items-center">
            {(user.role === "student" || user.role === "tutor") && (
              <ChatButton />
            )}
            <NotificationBell />
          </div>
        )}

        <BsNavbar.Toggle aria-controls="main-nav" className="order-2" />

        {/* Todos los enlaces y el botón quedan alineados a la derecha en escritorio */}
        <BsNavbar.Collapse
          id="main-nav"
          className="justify-content-lg-end order-3 order-lg-2"
        >
          <Nav className="align-items-lg-center">
            {navLinks(user?.role).map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.end}>
                {link.label}
              </Nav.Link>
            ))}
            {user ? (
              <NavDropdown
                title={user.name.split(" ")[0]}
                id="user-menu"
                align="end"
              >
                {user.role !== "admin" && (
                  <NavDropdown.Item as={Link} to="/panel">
                    Mi panel
                  </NavDropdown.Item>
                )}
                {user.onboardingCompleted && (
                  <NavDropdown.Item as={Link} to="/perfil">
                    Mi perfil
                  </NavDropdown.Item>
                )}
                {(user.role === "student" || user.role === "tutor") && (
                  <NavDropdown.Item as={Link} to="/pagos">
                    {user.role === "tutor" ? "Pagos recibidos" : "Mis pagos"}
                  </NavDropdown.Item>
                )}
                {user.role === "admin" && (
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
              !loading && (
                <Nav.Link as={NavLink} to="/login">
                  Iniciar sesión
                </Nav.Link>
              )
            )}
          </Nav>
          {!user && !loading && (
            <Link to="/registro" className="btn btn-cta ms-lg-2">
              Comenzar
            </Link>
          )}
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
