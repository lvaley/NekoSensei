import type { Types } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import type { EnrollmentStatus } from '../models/Enrollment'
import { expireOverdue } from './payments.service'

// Cupos ocupados por oferta: cuentan las inscripciones activas y las aceptadas que esperan el pago (una solicitud pendiente no reserva cupo)
const HOLDING: EnrollmentStatus[] = ['active', 'awaiting_payment']

export async function activeSeats(offerIds: Types.ObjectId[]): Promise<Map<string, number>> {
  await expireOverdue()
  const active = await Enrollment.find({ offer: { $in: offerIds }, status: { $in: HOLDING } }).select('offer')
  const seats = new Map<string, number>()
  for (const enrollment of active) seats.set(String(enrollment.offer), (seats.get(String(enrollment.offer)) ?? 0) + 1)
  return seats
}

export async function seatsTakenIn(offerId: Types.ObjectId): Promise<number> {
  await expireOverdue()
  return Enrollment.countDocuments({ offer: offerId, status: { $in: HOLDING } })
}
