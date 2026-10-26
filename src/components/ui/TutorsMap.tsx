import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import type { PublicTutor } from '../../types'
import { markerPin } from './mapIcon'
import { money } from '../../utils/money'

const GUATEMALA_CITY: [number, number] = [14.6349, -90.5069]

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14)
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 })
  }, [map, points])
  return null
}

// Mapa con un marcador por tutor (ubicación aproximada, redondeada para proteger su dirección)
export function TutorsMap({ tutors }: { tutors: PublicTutor[] }) {
  const located = tutors.filter((tutor) => tutor.location)
  const points = located.map((tutor) => [tutor.location!.lat, tutor.location!.lng] as [number, number])

  return (
    <div className="tutors-map">
      <MapContainer center={GUATEMALA_CITY} zoom={11} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />
        {located.map((tutor) => (
          <Marker key={tutor.id} position={[tutor.location!.lat, tutor.location!.lng]} icon={markerPin}>
            <Popup>
              <strong>{tutor.name}</strong>
              <br />
              Desde {money(tutor.fromPrice)}/hora
              {tutor.distanceKm !== null && <> · a {tutor.distanceKm} km</>}
              <br />
              <Link to={`/tutores/${tutor.id}`}>Ver perfil</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
