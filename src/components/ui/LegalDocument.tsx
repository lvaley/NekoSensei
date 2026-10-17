import { Col, Container, Row } from 'react-bootstrap'
import type { LegalSection } from '../../types'
import { PageHero } from './PageHero'

interface LegalDocumentProps {
  eyebrow: string
  title: string
  subtitle: string
  updated: string
  sections: LegalSection[]
}

// Documento legal con índice lateral: lo usan la política de privacidad y los términos
export function LegalDocument({ eyebrow, title, subtitle, updated, sections }: LegalDocumentProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <Container className="page-container">
        <Row className="g-4">
          <Col lg={3}>
            <nav className="legal__toc" aria-label="Contenido del documento">
              <h2>Contenido</h2>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </Col>

          <Col lg={9}>
            <article className="surface-card legal__body">
              <p className="legal__updated">Última actualización: {updated}</p>
              {sections.map((section, index) => (
                <section key={section.id} id={section.id}>
                  <h2>
                    {index + 1}. {section.title}
                  </h2>
                  {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
                  {section.items && (
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </article>
          </Col>
        </Row>
      </Container>
    </>
  )
}
