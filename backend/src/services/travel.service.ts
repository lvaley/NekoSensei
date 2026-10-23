import type { IOffer } from '../models/Offer'
import type { IAddress, IUser } from '../models/User'
import { distanceKm, round } from './geo.service'
import { getRoute } from './route.service'

export interface MapPoint {
  lat: number
  lng: number
  label: string
  // true: dirección exacta · false: zona aproximada (redondeada a ~1 km)
  exact: boolean
  address: string | null
}

export const exactPoint = (address: IAddress, label: string): MapPoint => ({ lat: address.lat, lng: address.lng, label, exact: true, address: address.text })
export const approxPoint = (address: IAddress, label: string): MapPoint => ({ lat: round(address.lat, 2), lng: round(address.lng, 2), label, exact: false, address: null })

// Traslado a domicilio entre el tutor y el estudiante, con su ruta, cobertura y costo estimado.
// Privacidad: el estudiante solo ve una zona aproximada del tutor; el tutor ve la dirección exacta del
// estudiante únicamente cuando la inscripción ya fue aceptada (antes, una zona aproximada).
export async function buildHomeTravel(args: { tutor: IUser; student: IUser; offer: IOffer | null; viewer: 'tutor' | 'student'; exactStudent: boolean; totalSessions: number }) {
  const { tutor, student, offer, viewer, exactStudent, totalSessions } = args
  if (!tutor.address || !student.address) return null

  const studentExact = viewer === 'student' || exactStudent
  const from = viewer === 'tutor' ? exactPoint(tutor.address, 'Tu punto de salida') : approxPoint(tutor.address, 'Zona del tutor (aproximada)')
  const to = studentExact ? exactPoint(student.address, viewer === 'tutor' ? 'Casa del estudiante' : 'Tu casa') : approxPoint(student.address, 'Zona del estudiante (aproximada)')

  const route = await getRoute(from, to)
  // Con direcciones reales se mide entre ellas (igual que el catálogo); con zonas aproximadas, entre lo que se ve
  const straightKm = from.exact && to.exact ? route.straightKm : viewer === 'student' ? round(distanceKm(tutor.address, student.address), 1) : route.straightKm
  const perClass = offer ? round(straightKm * offer.travelFeePerKm, 2) : null

  return {
    travel: {
      viewerTravels: viewer === 'tutor',
      from,
      to,
      straightKm,
      maxTravelKm: offer?.maxTravelKm ?? null,
      withinCoverage: offer ? straightKm <= offer.maxTravelKm : null,
      source: route.source,
      roadKm: route.roadKm,
      roadMin: route.roadMin,
      geometry: route.geometry,
    },
    price: { feePerKm: offer?.travelFeePerKm ?? null, perClass, totalSessions, course: perClass === null ? null : round(perClass * totalSessions, 2) },
  }
}
