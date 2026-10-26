import { lazy, Suspense } from 'react'
import { Alert, Col, Container, Row, Spinner } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import { PageHero } from '../components/ui/PageHero'
import { SearchFilters } from '../components/ui/SearchFilters'
import { TutorCard } from '../components/ui/TutorCard'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { PublicTutor } from '../types'
import { CardGridSkeleton } from '../components/ui/Skeleton'

// El mapa (Leaflet) solo se descarga cuando se elige esa vista
const TutorsMap = lazy(() => import('../components/ui/TutorsMap').then((module) => ({ default: module.TutorsMap })))

export function Tutors() {
  useDocumentTitle('Nuestros tutores')
  const [params, setParams] = useSearchParams()
  const { data, loading, error, hasOrigin } = useCatalog<{ tutors: PublicTutor[] }>('/tutors', params)
  const view = params.get('vista') === 'mapa' ? 'mapa' : 'lista'

  const setView = (next: 'lista' | 'mapa') => {
    const updated = new URLSearchParams(params)
    if (next === 'mapa') updated.set('vista', 'mapa')
    else updated.delete('vista')
    setParams(updated)
  }

  // "vista" no es un filtro: se conserva al limpiar o cambiar filtros
  const changeFilters = (next: URLSearchParams) => {
    if (view === 'mapa') next.set('vista', 'mapa')
    setParams(next)
  }

  return (
    <>
      <PageHero eyebrow="Tutores" title="Aprende con los mejores" subtitle="Perfiles revisados por nuestro equipo. Compara precios, modalidades y encuentra al tutor más cercano a ti." />
      <Container className="page-container">
        <SearchFilters params={params} onChange={changeFilters} showDistance={hasOrigin} total={data?.tutors.length} />
        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
          <small className="text-secondary">{hasOrigin ? 'Distancias calculadas desde tu dirección registrada.' : 'Inicia sesión y registra tu dirección para ver distancias.'}</small>
          <div className="view-toggle" role="group" aria-label="Tipo de vista">
            <button type="button" className={view === 'lista' ? 'is-active' : ''} onClick={() => setView('lista')} aria-pressed={view === 'lista'}>
              <i className="bi bi-grid me-1" aria-hidden="true" />
              Lista
            </button>
            <button type="button" className={view === 'mapa' ? 'is-active' : ''} onClick={() => setView('mapa')} aria-pressed={view === 'mapa'}>
              <i className="bi bi-geo-alt me-1" aria-hidden="true" />
              Mapa
            </button>
          </div>
        </div>

        {error && <Alert variant="danger" className="mt-4">No pudimos cargar los tutores. Intenta de nuevo en unos segundos.</Alert>}
        {loading && !data && <CardGridSkeleton label="Cargando tutores" />}
        {data && data.tutors.length === 0 && (
          <div className="surface-card text-center mt-4">
            <h2 className="h5">No encontramos tutores con esos filtros</h2>
            <p className="text-secondary mb-0">Prueba con otra categoría o quita algún filtro.</p>
          </div>
        )}
        {data && data.tutors.length > 0 && view === 'lista' && (
          <Row className="g-4 mt-1">
            {data.tutors.map((tutor) => (
              <Col md={6} lg={4} key={tutor.id}>
                <TutorCard tutor={tutor} />
              </Col>
            ))}
          </Row>
        )}
        {data && data.tutors.length > 0 && view === 'mapa' && (
          <div className="mt-3">
            <Suspense fallback={<Spinner animation="border" role="status" className="d-block mx-auto my-5" />}>
              <TutorsMap tutors={data.tutors} />
            </Suspense>
            <small className="text-secondary d-block mt-2">La ubicación de cada tutor es aproximada para proteger su privacidad.</small>
          </div>
        )}
      </Container>
    </>
  )
}
