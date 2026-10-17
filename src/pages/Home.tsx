import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { SITE } from '../config/site'

const features = [
  {
    icon: 'bi-patch-check',
    title: 'Tutores verificados',
    text: 'Idiomas, deportes, ciencias y tecnología con perfiles revisados.',
  },
  {
    icon: 'bi-geo-alt',
    title: 'Virtual o presencial',
    text: 'Calcula el costo de traslado antes de reservar tu clase.',
  },
  {
    icon: 'bi-calendar-check',
    title: 'Agenda sin traslapes',
    text: 'Calendario diario, semanal y mensual para organizar tus sesiones.',
  },
]

export function Home() {
  return (
    <>
      <section className="hero">
        <span className="hero-kanji" aria-hidden="true">
          {SITE.kanji}
        </span>
        <Container className="position-relative">
          <p className="eyebrow mb-3">Plataforma de tutorías</p>
          <h1 className="mb-3">Encuentra a tu sensei ideal</h1>
          <p className="lead mb-4">
            Conecta con tutores especializados, en línea o a domicilio, y aprende a tu ritmo.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/tutores" className="btn btn-primary btn-lg">
              Explorar tutores
            </Link>
            <Link to="/registro" className="btn btn-outline-light btn-lg">
              Crear cuenta
            </Link>
          </div>
        </Container>
      </section>

      <Container className="page-container">
        <Row className="g-4">
          {features.map((feature) => (
            <Col key={feature.title} xs={12} md={4}>
              <div className="surface-card feature-card">
                <div className="feature-card__icon">
                  <i className={`bi ${feature.icon}`} aria-hidden="true" />
                </div>
                <h2>{feature.title}</h2>
                <p className="mb-0 text-secondary">{feature.text}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  )
}
