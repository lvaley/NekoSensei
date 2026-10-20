import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { markerPin } from './mapIcon'

export interface LatLng {
  lat: number
  lng: number
}

interface LocationPickerProps {
  value: LatLng | null
  onChange: (value: LatLng) => void
  invalid?: boolean
}

// Ciudad de Guatemala: vista inicial cuando aún no hay ubicación marcada
const DEFAULT_CENTER: LatLng = { lat: 14.6349, lng: -90.5069 }

function ClickHandler({ onChange }: { onChange: (value: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap()
  if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15))
  return null
}

// Mapa interactivo: se toca el mapa o se arrastra el marcador para fijar la ubicación
export function LocationPicker({ value, onChange, invalid }: LocationPickerProps) {
  const [geoError, setGeoError] = useState('')

  const useMyLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no permite obtener la ubicación.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => onChange({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setGeoError('No pudimos obtener tu ubicación. Márcala directamente en el mapa.'),
    )
  }

  const center = value ?? DEFAULT_CENTER

  return (
    <div>
      <div className={`location-picker${invalid ? ' is-invalid' : ''}`}>
        <MapContainer center={[center.lat, center.lng]} zoom={value ? 15 : 12} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          <Recenter value={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={markerPin}
              draggable
              eventHandlers={{
                dragend(event) {
                  const position = (event.target as L.Marker).getLatLng()
                  onChange({ lat: position.lat, lng: position.lng })
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
        <button type="button" className="btn btn-dark btn-sm" onClick={useMyLocation}>
          <i className="bi bi-crosshair me-2" aria-hidden="true" />
          Usar mi ubicación
        </button>
        <small className="text-secondary">
          {value ? `Ubicación fijada: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Toca el mapa para marcar tu ubicación.'}
        </small>
      </div>
      {geoError && <small className="text-danger d-block mt-1">{geoError}</small>}
    </div>
  )
}
