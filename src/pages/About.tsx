import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/ui/PageHero'
import { SITE } from '../config/site'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const pillars = [
  {
    icon: 'bi-bullseye',
    title: 'Nuestra misión',
    text: 'Facilitar el acceso a tutorías de calidad, reuniendo en un solo lugar a estudiantes y tutores con perfiles claros, tarifas transparentes y una agenda sencilla.',
  },
  {
    icon: 'bi-binoculars',
    title: 'Nuestra visión',
    text: 'Ser el punto de encuentro para aprender cualquier habilidad, desde idiomas y deportes hasta ciencias y tecnología, de forma flexible y segura.',
  },
  {
    icon: 'bi-lightbulb',
    title: 'Cómo lo logramos',
    text: 'Te lo ponemos fácil: encuentras al tutor que se ajusta a tu presupuesto y a tu zona, reservas en minutos sin cruces de horario y resuelves tus dudas por chat antes de tu primera clase.',
  },
]

const studentSteps = [
  'Inicia sesión con Google y completa tu perfil.',
  'Busca tutores por categoría, precio, calificación, distancia o modalidad.',
  'Reserva una sesión o una suscripción de 4 u 8 semanas.',
  'Conversa por chat, aprende y califica tu experiencia.',
]

const tutorSteps = [
  'Crea tu cuenta de tutor con biografía, portafolio y tarifa.',
  'Espera la aprobación del equipo administrador.',
  'Publica tus ofertas, modalidades y disponibilidad semanal.',
  'Gestiona tus reservas y construye tu reputación con reseñas.',
]

const values = [
  { icon: 'bi-shield-check', title: 'Confianza', text: 'Perfiles revisados, reseñas reales y moderación activa.' },
  { icon: 'bi-geo-alt', title: 'Cercanía', text: 'Tutores cerca de ti o disponibles en línea.' },
  { icon: 'bi-eye', title: 'Transparencia', text: 'Tarifas y costos de traslado visibles antes de reservar.' },
  { icon: 'bi-calendar-check', title: 'Flexibilidad', text: 'Horarios, modalidades y suscripciones a tu medida.' },
]

export function About() {
  useDocumentTitle('Quiénes somos')

  return (
    <>
      <PageHero
        eyebrow="Nosotros"
        title="Conectamos a quienes quieren aprender con quienes saben enseñar"
        subtitle="Neko Sensei es una plataforma de tutorías para encontrar a tu sensei ideal, en línea o en persona, y aprender a tu ritmo."
      />

      <Container className="page-container">
        <Row className="g-4">
          {pillars.map((pillar) => (
            <Col key={pillar.title} xs={12} md={4}>
              <div className="surface-card feature-card">
                <div className="feature-card__icon">
                  <i className={`bi ${pillar.icon}`} aria-hidden="true" />
                </div>
                <h2>{pillar.title}</h2>
                <p className="mb-0 text-secondary">{pillar.text}</p>
              </div>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-5 mb-4">
          <p className="eyebrow mb-2">Cómo funciona</p>
          <h2 className="h3 mb-0">Aprender o enseñar en cuatro pasos</h2>
        </div>

        <Row className="g-4">
          <Col xs={12} md={6}>
            <div className="surface-card h-100">
              <h3 className="h5 mb-3">Para estudiantes</h3>
              <ol className="steps">
                {studentSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="surface-card h-100">
              <h3 className="h5 mb-3">Para tutores</h3>
              <ol className="steps">
                {tutorSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </Col>
        </Row>

        <div className="text-center mt-5 mb-4">
          <p className="eyebrow mb-2">Nuestros valores</p>
          <h2 className="h3 mb-0">Lo que nos guía</h2>
        </div>

        <Row className="g-4">
          {values.map((value) => (
            <Col key={value.title} xs={12} sm={6} lg={3}>
              <div className="surface-card feature-card">
                <div className="feature-card__icon">
                  <i className={`bi ${value.icon}`} aria-hidden="true" />
                </div>
                <h3 className="h5">{value.title}</h3>
                <p className="mb-0 text-secondary">{value.text}</p>
              </div>
            </Col>
          ))}
        </Row>

        <div className="cta-band mt-5">
          <h2 className="h3">Un proyecto en construcción</h2>
          <p className="mx-auto mb-4" style={{ maxWidth: 560 }}>
            Neko Sensei es un proyecto académico de Desarrollo Web creado por {SITE.author} y publicado por etapas.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Link to="/tutores" className="btn btn-primary btn-lg">
              Explorar tutores
            </Link>
            <Link to="/registro" className="btn btn-outline-light btn-lg">
              Crear cuenta
            </Link>
          </div>
        </div>
      </Container>
    </>
  )
}
