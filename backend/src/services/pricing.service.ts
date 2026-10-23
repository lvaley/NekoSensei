import type { IOffer } from '../models/Offer'
import type { IUser } from '../models/User'
import { distanceKm, round } from './geo.service'

// Precio de un bloque de clases: tarifa por hora × horas del bloque, más el traslado de cada clase si es a domicilio
export function planQuote(args: { hourlyRate: number; sessions: number; durationMin: number; mode: string; offer: IOffer | null; tutor: IUser | null; student: IUser | null }) {
  const { hourlyRate, sessions, durationMin, mode, offer, tutor, student } = args
  const classes = round((hourlyRate * sessions * durationMin) / 60, 2)
  let travel = 0
  if (mode === 'student_home' && offer && tutor?.address && student?.address) travel = round(round(distanceKm(tutor.address, student.address), 1) * offer.travelFeePerKm * sessions, 2)
  return { classes, travel, total: round(classes + travel, 2) }
}
