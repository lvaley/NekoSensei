import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { TutorCard } from '../components/ui/TutorCard'
import { SITE } from '../config/site'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import type { Category, PublicTutor } from '../types'
import { categoryIcon } from '../utils/categoryIcons'

interface PublicStats {
  tutors: number
  courses: number
  reviews: number
  rating: number | null
  categories: Array<{ id: string; courses: number }>
}

interface HomeData {
  stats: PublicStats | null
  categories: Category[]
  tutors: PublicTutor[]
}

const MODES = [
  {
    icon: 'bi-camera-video',
    title: 'Virtual',
    text: 'Entras a la reunión desde tu casa con un enlace. Sin traslados y con más horarios para elegir.',
  },
  {
    icon: 'bi-house-door',
    title: 'En casa del tutor',
    text: 'Vas al lugar del tutor. Recibes su dirección al inscribirte y ves la ruta en el mapa.',
  },
  {
    icon: 'bi-geo-alt',
    title: 'A domicilio',
    text: 'El tutor viaja hasta ti. Antes de pedir la clase ves la distancia, la ruta y cuánto cuesta el traslado.',
  },
]

const BENEFITS = [
  {
    icon: 'bi-calendar2-week',
    title: 'Tu horario, siempre listo',
    text: 'Elige tus días y horas fijos y tus clases quedan agendadas por semanas. Sin escribir cada vez para coordinar.',
  },
  {
    icon: 'bi-calendar-check',
    title: 'Cero choques de horario',
    text: 'Tu calendario cuida que no se crucen dos clases, incluso cuando hay que trasladarse.',
  },
  {
    icon: 'bi-chat-dots',
    title: 'Pregunta antes de decidir',
    text: 'Escríbele al tutor, resuelve tus dudas y empieza con confianza.',
  },
  {
    icon: 'bi-star',
    title: 'Opiniones en las que sí puedes confiar',
    text: 'Solo califican estudiantes que ya tomaron clase con el tutor. Lo que lees es real.',
  },
  {
    icon: 'bi-receipt',
    title: 'Sabes cuánto pagas desde el inicio',
    text: 'Clases y traslado a la vista antes de pedir y antes de pagar. Sin sorpresas.',
  },
  {
    icon: 'bi-arrow-repeat',
    title: 'Sigue sin empezar de cero',
    text: 'Si te gustó, renueva tu plan con el mismo tutor y el mismo horario.',
  },
]

export function Home() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [data, setData] = useState<HomeData>({
    stats: null,
    categories: [],
    tutors: [],
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    Promise.allSettled([api.get<PublicStats>('/public/stats'), api.get<{ categories: Category[] }>('/public/categories'), api.get<{ tutors: PublicTutor[] }>('/tutors')]).then(
      ([stats, categories, tutors]) => {
        if (!active) return
        setData({
          stats: stats.status === 'fulfilled' ? stats.value.data : null,
          categories: categories.status === 'fulfilled' ? categories.value.data.categories : [],
          tutors: tutors.status === 'fulfilled' ? tutors.value.data.tutors : [],
        })
        setLoaded(true)
      },
    )
    return () => {
      active = false
    }
  }, [])

  const search = (event: FormEvent) => {
    event.preventDefault()
    navigate(query.trim() ? `/cursos?q=${encodeURIComponent(query.trim())}` : '/cursos')
  }

  const { stats, categories, tutors } = data
  const courseCount = (id: string) => stats?.categories.find((item) => item.id === id)?.courses ?? 0
  const popular = [...categories].sort((a, b) => courseCount(b.id) - courseCount(a.id)).slice(0, 4)
  // Destacados: mejor calificados primero y, a igualdad, quienes tienen más cursos
  const featured = [...tutors].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount || b.offerCount - a.offerCount).slice(0, 3)
  const figures = stats
    ? [
        {
          value: stats.tutors,
          label: stats.tutors === 1 ? 'tutor verificado' : 'tutores verificados',
        },
        {
          value: stats.courses,
          label: stats.courses === 1 ? 'curso disponible' : 'cursos disponibles',
        },
        ...(stats.rating !== null
          ? [
              {
                value: stats.rating.toFixed(1),
                label: `calificación promedio (${stats.reviews} ${stats.reviews === 1 ? 'reseña' : 'reseñas'})`,
              },
            ]
          : []),
      ].filter((item) => Number(item.value) > 0)
    : []

  return (
    <>
      <section className="hero">
        <span className="hero-kanji" aria-hidden="true">
          {SITE.kanji}
        </span>
        <Container className="position-relative">
          <h1 className="mb-3">Encuentra a tu sensei ideal</h1>
          <p className="lead mb-4">Aprende idiomas, ciencias, tecnología o deportes con tutores verificados, en línea o en persona, con horarios y precios claros desde el inicio.</p>
          <form className="home-search" onSubmit={search} role="search">
            <label htmlFor="home-q" className="visually-hidden">
              ¿Qué quieres aprender?
            </label>
            <i className="bi bi-search" aria-hidden="true" />
            <input id="home-q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué quieres aprender? Inglés, cálculo, programación…" maxLength={60} />
            <button type="submit" className="btn btn-primary">
              Buscar cursos
            </button>
          </form>
          {popular.length > 0 && (
            <p className="home-popular">
              Lo más buscado:
              {popular.map((category) => (
                <Link key={category.id} to={`/cursos?category=${category.id}`}>
                  {category.name}
                </Link>
              ))}
            </p>
          )}
        </Container>
      </section>

      {/* Hasta tener los datos y la sesión no se pinta el resto: así nada salta de lugar al terminar de cargar */}
      {!loaded || loading ? (
        <div className="home-skeleton" role="status" aria-label="Cargando contenido">
          <section className="home-figures">
            <Container>
              <div className="home-skeleton__figures">
                {[0, 1, 2].map((item) => (
                  <span className="skeleton" key={item} />
                ))}
              </div>
            </Container>
          </section>
          <section className="home-section">
            <Container>
              <span className="skeleton skeleton--title" />
              <div className="home-skeleton__grid is-small">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <span className="skeleton skeleton--block" key={item} />
                ))}
              </div>
            </Container>
          </section>
          <section className="home-section is-tinted">
            <Container>
              <span className="skeleton skeleton--title" />
              <div className="home-skeleton__grid">
                {[0, 1, 2].map((item) => (
                  <span className="skeleton skeleton--card" key={item} />
                ))}
              </div>
            </Container>
          </section>
        </div>
      ) : (
        <>
          {figures.length > 0 && (
            <section className="home-figures" aria-label="Neko Sensei en cifras">
              <Container>
                <dl>
                  {figures.map((item) => (
                    <div key={item.label}>
                      <dt>{item.value}</dt>
                      <dd>{item.label}</dd>
                    </div>
                  ))}
                </dl>
              </Container>
            </section>
          )}

          {categories.length > 0 && (
            <section className="home-section">
              <Container>
                <h2 className="home-title">Explora por materia</h2>
                <p className="home-subtitle">Elige un área y mira los cursos que publican los tutores.</p>
                <ul className="home-index">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link to={`/cursos?category=${category.id}`}>
                        <i className={`bi ${categoryIcon(category.name)}`} aria-hidden="true" />
                        <span className="home-index__body">
                          <strong>{category.name}</strong>
                          <small>{category.children.map((child) => child.name).join(', ')}</small>
                        </span>
                        <span className="home-index__count">
                          {courseCount(category.id)} {courseCount(category.id) === 1 ? 'curso' : 'cursos'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Container>
            </section>
          )}

          {featured.length > 0 && (
            <section className="home-section is-tinted">
              <Container>
                <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
                  <div>
                    <h2 className="home-title mb-1">Tutores destacados</h2>
                    <p className="home-subtitle mb-0">Los mejor calificados de la plataforma.</p>
                  </div>
                  <Link to="/tutores">Ver todos los tutores</Link>
                </div>
                <Row className="g-4">
                  {featured.map((tutor) => (
                    <Col key={tutor.id} md={6} lg={4}>
                      <TutorCard tutor={tutor} />
                    </Col>
                  ))}
                </Row>
              </Container>
            </section>
          )}

          {!user && (
            <section className="home-join" aria-label="Crear cuenta">
              <Container>
                <div>
                  <h2>Quiero aprender</h2>
                  <p>Crea tu cuenta con Google, completa tu perfil y solicita tu primer curso.</p>
                  <Link to="/registro" className="btn btn-primary">
                    Crear cuenta de estudiante
                  </Link>
                </div>
                <div>
                  <h2>Quiero enseñar</h2>
                  <p>Publica tus cursos con tu tarifa y tus horarios. Un administrador revisa tu perfil antes de publicarte.</p>
                  <Link to="/registro?rol=tutor" className="btn btn-outline-light">
                    Registrarme como tutor
                  </Link>
                </div>
              </Container>
            </section>
          )}

          <section className="home-section is-tinted">
            <Container>
              <h2 className="home-title">Aprende donde te quede mejor</h2>
              <p className="home-subtitle">Cada curso indica sus modalidades. Tú eliges al solicitarlo.</p>
              <Row className="g-4">
                {MODES.map((mode) => (
                  <Col key={mode.title} md={4}>
                    <div className="home-mode">
                      <i className={`bi ${mode.icon}`} aria-hidden="true" />
                      <h3>{mode.title}</h3>
                      <p>{mode.text}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>

          <section className="home-section">
            <Container>
              <Row className="gy-4 gx-lg-5">
                <Col lg={4}>
                  <h2 className="home-title">Aprende con constancia, sin complicarte</h2>
                  <p className="home-subtitle">Reserva, paga y estudia desde un solo lugar. Tú pones las ganas, nosotros el resto.</p>
                  <Link to="/cursos" className="btn btn-primary">
                    Encuentra tu curso
                  </Link>
                </Col>
                <Col lg={8}>
                  <ul className="home-benefits">
                    {BENEFITS.map((benefit) => (
                      <li key={benefit.title}>
                        <i className={`bi ${benefit.icon}`} aria-hidden="true" />
                        <div>
                          <h3>{benefit.title}</h3>
                          <p>{benefit.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Col>
              </Row>
            </Container>
          </section>
        </>
      )}
    </>
  )
}
