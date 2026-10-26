import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { SITE } from '../config/site'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const CONTRAST = [
  { before: 'Buscas tutores por recomendaciones y no sabes si son buenos.', after: 'Perfiles revisados por nuestro equipo y reseñas de estudiantes que sí tomaron clase.' },
  { before: 'Preguntas el precio por mensaje y el traslado es una sorpresa.', after: 'Tarifa por hora y costo de traslado a la vista antes de pedir la clase.' },
  { before: 'Coordinas cada clase por chat y los horarios se cruzan.', after: 'Eliges tus días y horas fijos y la agenda cuida que no se crucen.' },
  { before: 'Pagas sin saber si el tutor te aceptó.', after: 'Primero el tutor acepta tu solicitud; solo entonces pagas.' },
]

const STUDENT_PERKS = [
  'Tutores de idiomas, ciencias, tecnología, deportes y posgrado.',
  'Clases virtuales, en casa del tutor o a domicilio.',
  'Planes por semanas con el mismo horario, y renovación cuando quieras.',
  'Chat con el tutor antes de decidir.',
]

const TUTOR_PERKS = [
  'Tú fijas tu tarifa, tus horarios y hasta dónde viajas.',
  'Cobras por bloque de semanas: el estudiante paga al empezar.',
  'Tu agenda se arma sola cuando el estudiante paga.',
  'Cada reseña construye tu reputación y te trae más estudiantes.',
]

const VALUES = [
  { icon: 'bi-shield-check', title: 'Confianza', text: 'Revisamos a cada tutor antes de publicarlo.' },
  { icon: 'bi-geo-alt', title: 'Cercanía', text: 'Tutores cerca de ti o en línea.' },
  { icon: 'bi-eye', title: 'Transparencia', text: 'Precios claros desde el inicio.' },
  { icon: 'bi-calendar-check', title: 'Flexibilidad', text: 'Horarios y modalidades a tu medida.' },
]

export function About() {
  useDocumentTitle('Quiénes somos')
  const { user } = useAuth()

  return (
    <>
      <section className="page-hero about-hero">
        <span className="hero-kanji" aria-hidden="true">
          {SITE.kanji}
        </span>
        <Container>
          <h1>Aprende con alguien que sí sabe enseñar</h1>
          <p className="lead">Neko Sensei reúne a estudiantes y tutores verificados en un solo lugar, con precios claros y clases que se organizan solas.</p>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link to="/tutores" className="btn btn-primary btn-lg">
              Encuentra tu tutor
            </Link>
            {!user && (
              <Link to="/registro?rol=tutor" className="btn btn-outline-light btn-lg">
                Quiero enseñar
              </Link>
            )}
          </div>
        </Container>
      </section>

      <section className="home-section">
        <Container>
          <h2 className="home-title">Encontrar un buen tutor no debería ser tan difícil</h2>
          <p className="home-subtitle">Por eso resolvimos lo que más estorba al aprender.</p>
          <div className="about-contrast">
            <p className="about-contrast__head is-before">Lo habitual</p>
            <p className="about-contrast__head is-after">Con Neko Sensei</p>
            {CONTRAST.map((row) => (
              <div className="about-contrast__row" key={row.after}>
                <p className="is-before">
                  <i className="bi bi-x-lg" aria-hidden="true" />
                  {row.before}
                </p>
                <p className="is-after">
                  <i className="bi bi-check-lg" aria-hidden="true" />
                  {row.after}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="home-section is-tinted">
        <Container>
          <Row className="g-4">
            <Col md={6}>
              <div className="about-path">
                <h2>Si quieres aprender</h2>
                <ul>
                  {STUDENT_PERKS.map((perk) => (
                    <li key={perk}>
                      <i className="bi bi-check2-circle" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link to="/cursos" className="btn btn-primary">
                  Ver cursos disponibles
                </Link>
              </div>
            </Col>
            <Col md={6}>
              <div className="about-path is-dark">
                <h2>Si quieres enseñar</h2>
                <ul>
                  {TUTOR_PERKS.map((perk) => (
                    <li key={perk}>
                      <i className="bi bi-check2-circle" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link to={user ? '/panel' : '/registro?rol=tutor'} className="btn btn-outline-light">
                  {user ? 'Ir a mi panel' : 'Registrarme como tutor'}
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="home-section">
        <Container>
          <h2 className="home-title">Lo que prometemos</h2>
          <p className="home-subtitle">Cuatro ideas que guían cada decisión de la plataforma.</p>
          <ul className="about-values">
            {VALUES.map((value) => (
              <li key={value.title}>
                <i className={`bi ${value.icon}`} aria-hidden="true" />
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  )
}
