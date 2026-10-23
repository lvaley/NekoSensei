import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { SessionTravel } from '../../types'
import { markerPin } from './mapIcon'

function FitRoute({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    // El mapa vive dentro de un modal que se anima: se recalcula su tamaño antes de encuadrar la ruta
    const timer = window.setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(points, { padding: [40, 40], maxZoom: 16 })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [map, points])
  return null
}

// Mapa con el punto de salida, el destino y el trazo de la ruta (continuo si es por calles, punteado si es línea recta)
export function RouteMap({ travel }: { travel: SessionTravel }) {
  const points = travel.geometry.length >= 2 ? travel.geometry : ([[travel.from.lat, travel.from.lng], [travel.to.lat, travel.to.lng]] as Array<[number, number]>)
  return (
    <div className="route-map">
      <MapContainer center={[travel.from.lat, travel.from.lng]} zoom={13} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitRoute points={points} />
        <Polyline positions={points} pathOptions={{ color: '#c0392b', weight: 5, opacity: 0.85, dashArray: travel.source === 'straight' ? '8 10' : undefined }} />
        {[travel.from, travel.to].map((point, index) => (
          <Marker key={index} position={[point.lat, point.lng]} icon={markerPin}>
            <Tooltip permanent direction="top" offset={[0, -36]}>
              {index === 0 ? 'Salida' : 'Destino'}: {point.label}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
