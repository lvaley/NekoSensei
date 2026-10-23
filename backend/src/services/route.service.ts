import { distanceKm, round } from './geo.service'

type Point = { lat: number; lng: number }

export interface RouteInfo {
  // 'road': ruta por calles (OSRM). 'straight': solo línea recta, el servicio de rutas no respondió.
  source: 'road' | 'straight'
  straightKm: number
  roadKm: number | null
  roadMin: number | null
  // Puntos [lat, lng] para dibujar el trazo en el mapa
  geometry: Array<[number, number]>
}

// Servicio de rutas (OSRM). Se puede cambiar con OSRM_URL; se lee al usarlo para respetar el .env
const osrmUrl = () => (process.env.OSRM_URL ?? 'https://router.project-osrm.org').replace(/\/$/, '')
const TIMEOUT_MS = 5000
const CACHE_TTL_MS = 24 * 3600_000
const CACHE_MAX = 500

// Las rutas entre dos puntos no cambian de un momento a otro: se guardan en memoria para no abusar del servicio
const cache = new Map<string, { at: number; route: RouteInfo }>()

const key = (a: Point, b: Point) => [a.lat, a.lng, b.lat, b.lng].map((n) => n.toFixed(5)).join(',')

interface OsrmResponse {
  code?: string
  routes?: Array<{ distance: number; duration: number; geometry?: { coordinates?: Array<[number, number]> } }>
}

// Ruta en auto entre dos puntos: distancia y tiempo reales por calles y su trazo. Si el servicio falla,
// se devuelve la línea recta para que la pantalla siga funcionando.
export async function getRoute(from: Point, to: Point): Promise<RouteInfo> {
  const straightKm = round(distanceKm(from, to), 1)
  const fallback: RouteInfo = { source: 'straight', straightKm, roadKm: null, roadMin: null, geometry: [[from.lat, from.lng], [to.lat, to.lng]] }

  const id = key(from, to)
  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.route

  try {
    const url = `${osrmUrl()}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=simplified&geometries=geojson`
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) return fallback
    const data = (await response.json()) as OsrmResponse
    const best = data.code === 'Ok' ? data.routes?.[0] : undefined
    const coordinates = best?.geometry?.coordinates
    if (!best || !coordinates || coordinates.length < 2) return fallback

    const route: RouteInfo = {
      source: 'road',
      straightKm,
      roadKm: round(best.distance / 1000, 1),
      roadMin: Math.max(1, Math.round(best.duration / 60)),
      geometry: coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    }
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string)
    cache.set(id, { at: Date.now(), route })
    return route
  } catch {
    return fallback
  }
}
