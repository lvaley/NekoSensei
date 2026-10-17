import { Container } from 'react-bootstrap'
import { SITE } from '../../config/site'

interface PageHeroProps {
  eyebrow: string
  title: string
  subtitle?: string
}

// Cabecera oscura que comparten las páginas informativas
export function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <section className="page-hero">
      <span className="hero-kanji" aria-hidden="true">
        {SITE.kanji}
      </span>
      <Container>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1>{title}</h1>
        {subtitle && <p className="lead">{subtitle}</p>}
      </Container>
    </section>
  )
}
