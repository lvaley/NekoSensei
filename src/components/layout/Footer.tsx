import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'

export function Footer() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__top">
        <Row className="g-4 g-lg-5">
          <Col xs={6} lg={3}>
            <h3>Acerca de {SITE.name}</h3>
            <ul>
              <li>
                <Link to="/nosotros">Quiénes somos</Link>
              </li>
              <li>
                <Link to="/tutores">Nuestros tutores</Link>
              </li>
              <li>
                <Link to="/cursos">Cursos</Link>
              </li>
            </ul>
          </Col>

          <Col xs={6} lg={3}>
            <h3>Ayuda</h3>
            <ul>
              <li>
                <Link to="/ayuda">Preguntas frecuentes</Link>
              </li>
              <li>
                <Link to="/privacidad">Política de privacidad</Link>
              </li>
              <li>
                <Link to="/terminos">Términos y condiciones</Link>
              </li>
              <li>
                <Link to="/status">Estado del sistema</Link>
              </li>
            </ul>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <h3>Contacto</h3>
            <ul>
              <li>
                <a className="contact-link" href={SITE.whatsapp} target="_blank" rel="noreferrer">
                  <i className="bi bi-whatsapp" aria-hidden="true" />
                  Escríbenos por WhatsApp
                </a>
              </li>
              <li>
                <a className="contact-link" href={SITE.email}>
                  <i className="bi bi-envelope" aria-hidden="true" />
                  Envíanos un email
                </a>
              </li>
            </ul>
            <Link to="/contacto" className="btn btn-contact">
              Quiero contactarme
            </Link>
          </Col>

          <Col xs={12} sm={6} lg={3} className="footer-brand">
            <div className="footer-brand__name">{SITE.name}</div>
            <p className="footer-brand__tagline">{SITE.tagline}</p>
            <div className="social">
              {SITE.social.map((item) => (
                <a key={item.label} href={item.href} aria-label={item.label}>
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
          </Col>
        </Row>
      </Container>

      <div className="site-footer__bottom">
        <Container className="d-flex flex-column flex-md-row justify-content-between gap-2">
          <span>
            © {SITE.year} {SITE.name}. Todos los derechos reservados.
          </span>
          <span>
            Desarrollado por <strong>{SITE.author}</strong> · Carnet <strong>{SITE.carnet}</strong>
          </span>
        </Container>
      </div>
    </footer>
  )
}
