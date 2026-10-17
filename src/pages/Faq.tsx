import { Accordion, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/ui/PageHero'
import { SITE } from '../config/site'
import { faqCategories } from '../content/faq'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Faq() {
  useDocumentTitle('Preguntas frecuentes')

  return (
    <>
      <PageHero
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        subtitle="Respuestas rápidas sobre cómo funciona Neko Sensei. Estamos construyendo la plataforma por etapas, así que algunas funciones se activarán en próximas versiones."
      />

      <Container className="page-container">
        <Row className="justify-content-center">
          <Col lg={9} xl={8}>
            {faqCategories.map((category) => (
              <section key={category.id} className="faq-category">
                <h2>{category.title}</h2>
                <Accordion className="faq-accordion">
                  {category.items.map((item, index) => (
                    <Accordion.Item key={item.question} eventKey={`${category.id}-${index}`}>
                      <Accordion.Header>{item.question}</Accordion.Header>
                      <Accordion.Body>{item.answer}</Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </section>
            ))}

            <div className="surface-card text-center mt-5">
              <h2 className="h5">¿No encontraste tu respuesta?</h2>
              <p className="text-secondary">Escríbenos y te ayudamos con gusto.</p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Link to="/contacto" className="btn btn-primary">
                  Quiero contactarme
                </Link>
                <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="btn btn-dark">
                  <i className="bi bi-whatsapp me-2" aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  )
}
