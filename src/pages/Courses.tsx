import { Alert, Col, Container, Row, Spinner } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import { EnrollButton } from '../components/enrollments/EnrollButton'
import { OfferCard } from '../components/ui/OfferCard'
import { PageHero } from '../components/ui/PageHero'
import { SearchFilters } from '../components/ui/SearchFilters'
import { useAuth } from '../hooks/useAuth'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useEnrollments } from '../hooks/useEnrollments'
import type { PublicOffer } from '../types'

export function Courses() {
  useDocumentTitle('Cursos')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const mine = useEnrollments(user?.role === 'student')
  const openByOffer = new Map((mine.items ?? []).filter((item) => item.status === 'pending' || item.status === 'awaiting_payment' || item.status === 'active').map((item) => [item.offer.id, item]))
  const { data, loading, error, hasOrigin } = useCatalog<{ offers: PublicOffer[] }>('/offers', params)

  return (
    <>
      <PageHero eyebrow="Cursos" title="Encuentra tu próxima clase" subtitle="Cursos publicados por tutores verificados. Filtra por materia, precio, modalidad y cercanía." />
      <Container className="page-container">
        <SearchFilters params={params} onChange={setParams} showDistance={hasOrigin} total={data?.offers.length} />
        {!hasOrigin && (
          <p className="text-secondary small mt-3 mb-0">Inicia sesión y registra tu dirección para ver la distancia y el costo de traslado de cada curso.</p>
        )}
        {error && <Alert variant="danger" className="mt-4">No pudimos cargar los cursos. Intenta de nuevo en unos segundos.</Alert>}
        {loading && !data && <Spinner animation="border" role="status" aria-label="Cargando cursos" className="d-block mx-auto my-5" />}
        {data && data.offers.length === 0 && (
          <div className="surface-card text-center mt-4">
            <h2 className="h5">No encontramos cursos con esos filtros</h2>
            <p className="text-secondary mb-0">Prueba con otra categoría o quita algún filtro.</p>
          </div>
        )}
        {data && data.offers.length > 0 && (
          <Row className="g-4 mt-1">
            {data.offers.map((offer) => (
              <Col md={6} lg={4} key={offer.id}>
                <OfferCard offer={offer} footer={<EnrollButton offer={offer} current={openByOffer.get(offer.id)} onRequested={() => void mine.reload()} />} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  )
}
