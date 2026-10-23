import type { SessionTravel } from '../../types'
import { RouteMap } from './RouteMap'

// Mapa de la ruta y datos del traslado (km, minutos, cobertura) con los avisos de privacidad que correspondan
export function TravelInfo({ travel }: { travel: SessionTravel }) {
  const approximate = !travel.from.exact || !travel.to.exact
  return (
    <>
      <RouteMap travel={travel} />
      <ul className="session-detail__stats">
        {travel.source === 'road' && travel.roadKm !== null ? (
          <>
            <li>
              <strong>{travel.roadKm} km</strong> por carretera
            </li>
            <li>
              <strong>≈ {travel.roadMin} min</strong> en auto
            </li>
          </>
        ) : (
          <li>
            <strong>{travel.straightKm} km</strong> en línea recta · la ruta por calles no está disponible ahora
          </li>
        )}
        {travel.source === 'road' && <li>{travel.straightKm} km en línea recta (base de la cobertura y la tarifa)</li>}
        {travel.maxTravelKm !== null && (
          <li className={travel.withinCoverage ? 'is-ok' : 'is-warn'}>
            {travel.withinCoverage ? 'Dentro' : 'Fuera'} de la zona de cobertura del curso (hasta {travel.maxTravelKm} km)
          </li>
        )}
      </ul>
      {approximate && (
        <p className="text-secondary small mb-0">
          {!travel.to.exact ? 'Antes de aceptar ves una zona aproximada de la casa del estudiante; la dirección exacta aparece cuando aceptas la solicitud.' : 'Por privacidad ves una zona aproximada del punto de salida del tutor.'} Los kilómetros y minutos son estimados.
        </p>
      )}
    </>
  )
}
