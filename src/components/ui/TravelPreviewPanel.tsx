import axios from 'axios'
import { useEffect, useState } from 'react'
import { Alert, Spinner } from 'react-bootstrap'
import { api } from '../../services/api'
import type { TravelPreview } from '../../types'
import { money } from '../../utils/money'
import { TravelInfo } from './TravelInfo'

// Carga y muestra el traslado de un curso o inscripción a domicilio: ruta, cobertura y costo estimado
export function TravelPreviewPanel({ url }: { url: string }) {
  const [result, setResult] = useState<{ url: string; data?: TravelPreview; error?: string } | null>(null)

  useEffect(() => {
    let active = true
    api
      .get<TravelPreview>(url)
      .then((res) => active && setResult({ url, data: res.data }))
      .catch((err) => active && setResult({ url, error: axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos calcular el traslado.' }))
    return () => {
      active = false
    }
  }, [url])

  if (result?.url !== url) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" /> Calculando la ruta…
      </div>
    )
  }
  if (!result.data) return <Alert variant="warning" className="mb-0">{result.error}</Alert>

  const { travel, price } = result.data
  return (
    <div>
      <TravelInfo travel={travel} />
      {price.perClass !== null && (
        <dl className="cost-summary mt-3">
          <div>
            <dt>
              Traslado estimado por clase
              <small>
                {money(price.feePerKm ?? 0)} × {travel.straightKm} km
              </small>
            </dt>
            <dd>{money(price.perClass)}</dd>
          </div>
          {price.totalSessions > 1 && price.course !== null && (
            <div className="cost-summary__total">
              <dt>
                Traslado en las {price.totalSessions} clases
              </dt>
              <dd>{money(price.course)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
