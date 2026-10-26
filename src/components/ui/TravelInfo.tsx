import type { SessionTravel } from '../../types'
import { RouteMap } from './RouteMap'

// Mapa de la ruta y datos del traslado (km, minutos, cobertura) con los avisos de privacidad que correspondan
export function TravelInfo({ travel }: { travel: SessionTravel }) {
  const approximate = !travel.from.exact || !travel.to.exact
  const byRoad = travel.source === 'road' && travel.roadKm !== null

  return (
    <>
      <RouteMap travel={travel} />

      <dl className="travel-stats">
        {byRoad && (
          <>
            <div>
              <dt>recorrido aprox.</dt>
              <dd>
                {travel.roadKm}
                <small> km</small>
              </dd>
            </div>
            <div>
              <dt>tiempo aprox.</dt>
              <dd>
                ≈ {travel.roadMin}
                <small> min</small>
              </dd>
            </div>
          </>
        )}
        <div className="is-base">
          <dt>
            en línea recta{byRoad && <span>Zona de cobertura y costo del traslado</span>}
          </dt>
          <dd>
            {travel.straightKm}
            <small> km</small>
          </dd>
        </div>
      </dl>
      {!byRoad && <p className="text-secondary small mb-2">La ruta por calles no está disponible ahora; el costo se calcula con la distancia en línea recta.</p>}

      {(travel.maxTravelKm !== null || approximate) && (
        <div className="travel-notes">
          {travel.maxTravelKm !== null && (
            <p className={`travel-coverage ${travel.withinCoverage ? 'is-ok' : 'is-warn'}`}>
              <i className={`bi ${travel.withinCoverage ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} aria-hidden="true" />
              <span>
                {travel.withinCoverage ? 'Dentro' : 'Fuera'} de la zona de cobertura del curso <small>(hasta {travel.maxTravelKm} km)</small>
              </span>
            </p>
          )}
          {approximate && (
            <p className="travel-privacy">
              {!travel.to.exact ? 'Antes de aceptar ves una zona aproximada de la casa del estudiante; la dirección exacta aparece cuando aceptas la solicitud.' : 'Por privacidad ves una zona aproximada del punto de salida del tutor.'} Los kilómetros y minutos son estimados.
            </p>
          )}
        </div>
      )}
    </>
  )
}
