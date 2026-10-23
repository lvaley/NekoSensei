import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Enrollment } from '../models/Enrollment'
import { Offer } from '../models/Offer'
import { Session } from '../models/Session'
import { User } from '../models/User'
import { distanceKm, round } from '../services/geo.service'
import { getRoute } from '../services/route.service'
import { approxPoint, exactPoint } from '../services/travel.service'
import type { MapPoint } from '../services/travel.service'
import { toSessionViews } from './sessions.controller'
import type { SessionDoc } from './sessions.controller'

const MIN_MS = 60_000

// Detalle de una clase para quien participa en ella: curso, costo, enlace o dirección, y el traslado con su ruta
export async function getSessionDetail(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = req.auth?.sub
  const session = isValidObjectId(req.params.id) ? await Session.findById(req.params.id) : null
  if (!session || (String(session.tutor) !== userId && String(session.student) !== userId)) {
    res.status(404).json({ message: 'Clase no encontrada' })
    return
  }
  const viewerIsTutor = String(session.tutor) === userId
  const enrollment = await Enrollment.findById(session.enrollment)
  if (!enrollment) {
    res.status(404).json({ message: 'Clase no encontrada' })
    return
  }
  const [offer, tutor, student] = await Promise.all([Offer.findById(enrollment.offer), User.findById(session.tutor), User.findById(session.student)])
  if (!tutor || !student) {
    res.status(404).json({ message: 'Clase no encontrada' })
    return
  }

  // Los estudiantes de la clase grupal solo los ve el tutor
  let students: Array<{ id: string; name: string }> | undefined
  if (viewerIsTutor && enrollment.classType === 'group') {
    const mates = await Session.find({ offer: session.offer, start: session.start, durationMin: session.durationMin, status: session.status })
    const users = await User.find({ _id: { $in: mates.map((item) => item.student) } })
    students = users.map((user) => ({ id: String(user._id), name: user.name }))
  }

  const [view] = await toSessionViews([session as unknown as SessionDoc])
  const number = (await Session.countDocuments({ enrollment: enrollment._id, status: { $in: ['scheduled', 'completed'] }, start: { $lte: session.start } })) || 1

  const classCost = round((enrollment.hourlyRate * session.durationMin) / 60, 2)
  const live = session.status === 'scheduled'

  // Ubicación y traslado: solo mientras la clase está programada
  let place: { kind: typeof enrollment.mode; meetingUrl: string | null; address: string | null } = { kind: enrollment.mode, meetingUrl: view?.meetingUrl ?? null, address: null }
  let travel = null as null | {
    viewerTravels: boolean
    from: MapPoint
    to: MapPoint
    straightKm: number
    maxTravelKm: number | null
    withinCoverage: boolean | null
    source: 'road' | 'straight'
    roadKm: number | null
    roadMin: number | null
    geometry: Array<[number, number]>
  }
  let travelCost: number | null = null

  if (live && enrollment.mode === 'student_home' && tutor.address && student.address) {
    // El tutor viaja a la casa del estudiante
    const from = viewerIsTutor ? exactPoint(tutor.address, 'Tu punto de salida') : approxPoint(tutor.address, 'Zona del tutor (aproximada)')
    const to = exactPoint(student.address, viewerIsTutor ? 'Casa del estudiante' : 'Tu casa')
    const route = await getRoute(from, to)
    // La cobertura y la tarifa usan siempre la distancia en línea recta entre las direcciones reales (igual que el catálogo)
    const straightKm = round(distanceKm(tutor.address, student.address), 1)
    place = { ...place, address: student.address.text }
    travel = { viewerTravels: viewerIsTutor, from, to, straightKm, maxTravelKm: offer?.maxTravelKm ?? null, withinCoverage: offer ? straightKm <= offer.maxTravelKm : null, source: route.source, roadKm: route.roadKm, roadMin: route.roadMin, geometry: route.geometry }
    travelCost = offer ? round(straightKm * offer.travelFeePerKm, 2) : null
  } else if (live && enrollment.mode === 'tutor_home' && tutor.address) {
    // El estudiante va a la casa del tutor: necesita la dirección para asistir
    place = { ...place, address: tutor.address.text }
    if (!viewerIsTutor && student.address) {
      const from = exactPoint(student.address, 'Tu punto de salida')
      const to = exactPoint(tutor.address, 'Casa del tutor')
      const route = await getRoute(from, to)
      travel = { viewerTravels: true, from, to, straightKm: route.straightKm, maxTravelKm: null, withinCoverage: null, source: route.source, roadKm: route.roadKm, roadMin: route.roadMin, geometry: route.geometry }
    }
  }

  res.json({
    detail: {
      ...view,
      category: enrollment.categoryName,
      description: offer?.description ?? null,
      level: enrollment.level ?? 'basic',
      maxStudents: enrollment.maxStudents ?? 1,
      classNumber: number,
      totalSessions: enrollment.totalSessions ?? 1,
      students,
      place,
      travel,
      price: { hourlyRate: enrollment.hourlyRate, classCost, travelFeePerKm: enrollment.mode === 'student_home' ? (offer?.travelFeePerKm ?? null) : null, travelCost, total: travelCost === null ? classCost : round(classCost + travelCost, 2) },
      endsAt: new Date(session.start.getTime() + session.durationMin * MIN_MS),
    },
  })
}
