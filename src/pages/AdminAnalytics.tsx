import { useEffect, useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { BarChart } from '../components/charts/BarChart'
import { HBars } from '../components/charts/HBars'
import { AdminNav } from '../components/ui/AdminNav'
import { PageHero } from '../components/ui/PageHero'
import { ListSkeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { AdminAnalytics as Data, TutorRank } from '../types'
import { money } from '../utils/money'
import { currentMonthKey, monthLong, monthShort } from '../utils/months'

function Ranking({ rows, empty }: { rows: TutorRank[]; empty: string }) {
  if (rows.length === 0) return <p className="text-secondary mb-0">{empty}</p>
  return (
    <ol className="rank-list">
      {rows.map((row, index) => (
        <li key={row.id}>
          <span className="rank-list__pos">{index + 1}</span>
          <span className="rank-list__who">
            <strong>{row.name}</strong>
            <div className="small text-secondary">
              ★ {row.average.toFixed(1)} · {row.reviews} {row.reviews === 1 ? 'reseña' : 'reseñas'}
            </div>
          </span>
          {row.publicProfile ? (
            <Link to={`/tutores/${row.id}#resenas`} className="btn btn-outline-dark btn-sm">
              Ver reseñas
            </Link>
          ) : (
            <span className="small text-secondary">Perfil no público</span>
          )}
        </li>
      ))}
    </ol>
  )
}

// Reportería del administrador: ingresos y comisión, clases impartidas vs. canceladas, demanda y rankings de tutores
export function AdminAnalytics() {
  useDocumentTitle('Reportería')
  const [month, setMonth] = useState(currentMonthKey)
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get<Data>('/admin/analytics', { params: { month } })
      .then((res) => {
        if (!active) return
        setData(res.data)
        setFailed(false)
      })
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [month])

  const labels = data?.series.map((item) => monthShort(item.month)) ?? []
  const pct = data ? `${Math.round(data.commissionRate * 100)} %` : ''

  return (
    <>
      <PageHero eyebrow="Administrador" title="Reportería" subtitle="Las cifras que impulsan decisiones: ingresos, comisión, demanda por materia y calidad de tus tutores." />
      <AdminNav />
      <Container className="page-container">
        <div className="report-controls">
          <label className="d-flex align-items-center gap-2">
            <span className="fw-semibold">Mes</span>
            <input type="month" className="form-control" value={month} max={currentMonthKey()} onChange={(event) => event.target.value && setMonth(event.target.value)} />
          </label>
          {data && <span className="text-secondary">Mostrando {monthLong(data.month)} y los 5 meses anteriores</span>}
        </div>

        {failed && <Alert variant="danger">No pudimos cargar los reportes.</Alert>}
        {!data && !failed && <ListSkeleton rows={4} label="Cargando reportes" />}
        {data && (
          <>
            <Row className="g-3 mb-4">
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi">
                  <span>Cobrado neto</span>
                  <strong>{money(data.summary.net)}</strong>
                  <small>{money(data.summary.gross)} − {money(data.summary.refunds)} reembolsos</small>
                </div>
              </Col>
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi report-kpi--accent">
                  <span>Comisión ({pct})</span>
                  <strong>{money(data.summary.commission)}</strong>
                  <small>Ingreso de la plataforma</small>
                </div>
              </Col>
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi">
                  <span>A tutores</span>
                  <strong>{money(data.summary.payout)}</strong>
                  <small>Neto menos comisión</small>
                </div>
              </Col>
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi">
                  <span>Solicitudes</span>
                  <strong>{data.summary.requests}</strong>
                  <small>Nuevas inscripciones del mes</small>
                </div>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Ingresos por mes</h2>
                  <BarChart
                    label="Cobrado neto y comisión por mes"
                    labels={labels}
                    format={money}
                    series={[
                      { name: 'Cobrado neto', values: data.series.map((item) => item.net), tone: 'ink' },
                      { name: 'Comisión', values: data.series.map((item) => item.commission), tone: 'vermilion' },
                    ]}
                  />
                </div>
              </Col>
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Tutorías impartidas vs. canceladas</h2>
                  <BarChart
                    label="Clases realizadas y canceladas por mes"
                    labels={labels}
                    series={[
                      { name: 'Impartidas', values: data.series.map((item) => item.completed), tone: 'sage' },
                      { name: 'Canceladas', values: data.series.map((item) => item.cancelled), tone: 'vermilion' },
                    ]}
                  />
                  <p className="small text-secondary mt-2 mb-0">
                    En {monthLong(data.month)}: {data.summary.completed} impartidas y {data.summary.cancelled} canceladas.
                  </p>
                </div>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Demanda por categoría</h2>
                  <p className="small text-secondary">Solicitudes de {monthLong(data.month)}.</p>
                  <HBars rows={data.demand.byCategory} empty="Sin solicitudes este mes." />
                </div>
              </Col>
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Cursos más solicitados</h2>
                  <p className="small text-secondary">Los 5 con más solicitudes del mes.</p>
                  <HBars rows={data.demand.topCourses} empty="Sin solicitudes este mes." />
                </div>
              </Col>
            </Row>

            <Row className="g-4">
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Mejor calificados</h2>
                  <p className="small text-secondary">Promedio histórico de reseñas.</p>
                  <Ranking rows={data.rankings.best} empty="Aún no hay reseñas." />
                </div>
              </Col>
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Peor calificados</h2>
                  <p className="small text-secondary">Los de menor promedio: revisa sus reseñas para detectar problemas.</p>
                  <Ranking rows={data.rankings.worst} empty="Aún no hay reseñas." />
                </div>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </>
  )
}
