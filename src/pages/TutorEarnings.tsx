import { useEffect, useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import { BarChart } from '../components/charts/BarChart'
import { PageHero } from '../components/ui/PageHero'
import { ListSkeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { TutorEarnings as Data } from '../types'
import { money } from '../utils/money'
import { currentMonthKey, monthLong, monthShort } from '../utils/months'

// Ganancias del tutor: lo cobrado, la comisión de la plataforma y lo que recibe, por mes y por curso
export function TutorEarnings() {
  useDocumentTitle('Mis ganancias')
  const [month, setMonth] = useState(currentMonthKey)
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get<Data>('/tutor/earnings', { params: { month } })
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
      <PageHero eyebrow="Tutor" title="Mis ganancias" subtitle="Mira cuánto crece tu negocio de enseñanza: cobros, comisión y lo que llega a tu bolsillo, mes a mes." />
      <Container className="page-container">
        <div className="report-controls">
          <label className="d-flex align-items-center gap-2">
            <span className="fw-semibold">Mes</span>
            <input type="month" className="form-control" value={month} max={currentMonthKey()} onChange={(event) => event.target.value && setMonth(event.target.value)} />
          </label>
          {data && <span className="text-secondary">Mostrando {monthLong(data.month)} y los 5 meses anteriores</span>}
        </div>

        {failed && <Alert variant="danger">No pudimos cargar tus ganancias.</Alert>}
        {!data && !failed && <ListSkeleton rows={4} label="Cargando ganancias" />}
        {data && (
          <>
            <Row className="g-3 mb-4">
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi">
                  <span>Cobrado</span>
                  <strong>{money(data.summary.net)}</strong>
                  <small>{data.summary.refunds > 0 ? `${money(data.summary.gross)} − ${money(data.summary.refunds)} reembolsado` : 'Pagos del mes'}</small>
                </div>
              </Col>
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi">
                  <span>Comisión ({pct})</span>
                  <strong>{money(data.summary.commission)}</strong>
                  <small>Para la plataforma</small>
                </div>
              </Col>
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi report-kpi--accent">
                  <span>Recibes</span>
                  <strong>{money(data.summary.payout)}</strong>
                  <small>Tus ganancias del mes</small>
                </div>
              </Col>
              <Col xs={6} lg={3}>
                <div className="surface-card report-kpi">
                  <span>Clases</span>
                  <strong>{data.summary.completed}</strong>
                  <small>{data.summary.cancelled} canceladas</small>
                </div>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Ganancias por mes</h2>
                  <BarChart label="Cobrado y ganancias por mes" labels={labels} format={money} series={[{ name: 'Cobrado', values: data.series.map((item) => item.net), tone: 'ink' }, { name: 'Recibes', values: data.series.map((item) => item.payout), tone: 'vermilion' }]} />
                </div>
              </Col>
              <Col lg={6}>
                <div className="surface-card h-100">
                  <h2 className="h5">Clases impartidas vs. canceladas</h2>
                  <BarChart label="Clases realizadas y canceladas por mes" labels={labels} series={[{ name: 'Impartidas', values: data.series.map((item) => item.completed), tone: 'sage' }, { name: 'Canceladas', values: data.series.map((item) => item.cancelled), tone: 'vermilion' }]} />
                </div>
              </Col>
            </Row>

            <div className="surface-card p-0 table-responsive mb-4">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Curso ({monthLong(data.month)})</th>
                    <th className="text-end">Pagos</th>
                    <th className="text-end">Cobrado</th>
                    <th className="text-end">Comisión</th>
                    <th className="text-end">Recibes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCourse.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-secondary text-center py-4">
                        Sin pagos en este mes.
                      </td>
                    </tr>
                  )}
                  {data.byCourse.map((row) => (
                    <tr key={row.title}>
                      <td>{row.title}</td>
                      <td className="text-end">{row.payments}</td>
                      <td className="text-end">{money(row.net)}</td>
                      <td className="text-end">{money(row.commission)}</td>
                      <td className="text-end">
                        <strong>{money(row.payout)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-secondary">
              En total has recibido <strong>{money(data.total.payout)}</strong> de {data.total.students} {data.total.students === 1 ? 'estudiante' : 'estudiantes'} (cobrado {money(data.total.net)}, comisión {money(data.total.commission)}).
              Si cancelas un curso ya pagado, el estudiante recibe un reembolso por las clases que no se dieron y se descuenta de tus ganancias.
            </p>
          </>
        )}
      </Container>
    </>
  )
}
