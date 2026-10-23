import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Category } from '../models/Category'
import { CLASS_TYPES, COURSE_LEVELS, MAX_GROUP_SIZE, MAX_PER_WEEK, MAX_WEEKS, Offer, TEACHING_MODES } from '../models/Offer'
import type { ClassType, CourseLevel, TeachingMode } from '../models/Offer'
import { User } from '../models/User'
import { activeSeats } from '../services/seats.service'
import { toMinutes, validateWindows } from '../services/schedule.service'
import type { AvailabilityWindow } from '../models/Offer'

type OfferErrors = Record<string, string>

interface OfferBody {
  title?: unknown
  description?: unknown
  category?: unknown
  modes?: unknown
  hourlyRate?: unknown
  level?: unknown
  meetingUrl?: unknown
  availability?: unknown
  classType?: unknown
  maxStudents?: unknown
  weeks?: unknown
  sessionsPerWeek?: unknown
  totalSessions?: unknown
  sessionDurationMin?: unknown
  travelFeePerKm?: unknown
  maxTravelKm?: unknown
  active?: unknown
}

function toOfferView(offer: InstanceType<typeof Offer>, categoryName?: string, seatsTaken = 0) {
  return {
    id: String(offer._id),
    title: offer.title,
    description: offer.description,
    category: { id: String(offer.category), name: categoryName ?? '' },
    modes: offer.modes,
    hourlyRate: offer.hourlyRate,
    level: offer.level ?? 'basic',
    meetingUrl: offer.meetingUrl ?? '',
    availability: (offer.availability ?? []).map((window) => ({ day: window.day, start: window.start, end: window.end })),
    classType: offer.classType ?? 'individual',
    maxStudents: offer.maxStudents ?? 1,
    seatsTaken,
    weeks: offer.weeks ?? null,
    sessionsPerWeek: offer.sessionsPerWeek ?? null,
    totalSessions: offer.totalSessions ?? 1,
    sessionDurationMin: offer.sessionDurationMin ?? 60,
    travelFeePerKm: offer.travelFeePerKm,
    maxTravelKm: offer.maxTravelKm,
    active: offer.active,
    updatedAt: offer.updatedAt,
  }
}

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

async function validateOffer(body: OfferBody) {
  const errors: OfferErrors = {}
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (title.length < 5 || title.length > 80) errors.title = 'El título debe tener entre 5 y 80 caracteres.'

  const description = typeof body.description === 'string' ? body.description.trim() : ''
  if (description.length < 20 || description.length > 800) errors.description = 'La descripción debe tener entre 20 y 800 caracteres.'

  const categoryId = typeof body.category === 'string' ? body.category : ''
  const category = isValidObjectId(categoryId) ? await Category.findOne({ _id: categoryId, active: true }) : null
  if (!category) errors.category = 'Selecciona una categoría válida.'

  const modes = Array.isArray(body.modes) ? [...new Set(body.modes.filter((mode): mode is TeachingMode => TEACHING_MODES.includes(mode as TeachingMode)))] : []
  if (modes.length === 0) errors.modes = 'Elige al menos una modalidad.'

  const hourlyRate = Number(body.hourlyRate)
  if (!Number.isFinite(hourlyRate) || hourlyRate < 1 || hourlyRate > 10000) errors.hourlyRate = 'El precio por hora debe estar entre Q1 y Q10,000.'

  const level = COURSE_LEVELS.includes(body.level as CourseLevel) ? (body.level as CourseLevel) : null
  if (!level) errors.level = 'Elige el nivel del curso: básico, intermedio o avanzado.'

  // Virtual: el enlace de la reunión es obligatorio (solo http o https)
  let meetingUrl = ''
  if (modes.includes('virtual')) {
    meetingUrl = typeof body.meetingUrl === 'string' ? body.meetingUrl.trim() : ''
    if (!meetingUrl) errors.meetingUrl = 'Indica el enlace de la reunión (Meet, Zoom, Teams…).'
    else if (meetingUrl.length > 300 || !isWebUrl(meetingUrl)) errors.meetingUrl = 'Escribe un enlace válido que empiece con https://'
  }

  // Grupal: entre 2 y 20 cupos, solo para virtual y en casa del tutor (a domicilio es siempre 1 a 1)
  const rawClassType = body.classType ?? 'individual'
  const classType = CLASS_TYPES.includes(rawClassType as ClassType) ? (rawClassType as ClassType) : null
  if (!classType) errors.classType = 'Elige si la clase es individual o grupal.'
  let maxStudents = 1
  if (classType === 'group') {
    maxStudents = Number(body.maxStudents)
    if (modes.includes('student_home')) errors.classType = 'Las clases grupales no están disponibles a domicilio: quita esa modalidad o elige clase individual.'
    else if (!Number.isInteger(maxStudents) || maxStudents < 2 || maxStudents > MAX_GROUP_SIZE) errors.maxStudents = `Los cupos deben estar entre 2 y ${MAX_GROUP_SIZE}.`
  }

  // Plan: el tutor define las semanas del bloque y las clases por semana (el total sale de multiplicarlas).
  // Sin semanas se acepta solo el total de clases (cursos sin plan, que se agendan clase por clase).
  let weeks: number | undefined
  let sessionsPerWeek: number | undefined
  let totalSessions = Number(body.totalSessions)
  if (body.weeks !== undefined && body.weeks !== null && body.weeks !== '') {
    weeks = Number(body.weeks)
    sessionsPerWeek = Number(body.sessionsPerWeek)
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_WEEKS) errors.weeks = `Las semanas del plan deben estar entre 1 y ${MAX_WEEKS}.`
    if (!Number.isInteger(sessionsPerWeek) || sessionsPerWeek < 1 || sessionsPerWeek > MAX_PER_WEEK) errors.sessionsPerWeek = `Las clases por semana deben estar entre 1 y ${MAX_PER_WEEK}.`
    if (!errors.weeks && !errors.sessionsPerWeek) totalSessions = weeks * sessionsPerWeek
  } else if (!Number.isInteger(totalSessions) || totalSessions < 1 || totalSessions > MAX_WEEKS * MAX_PER_WEEK) {
    errors.weeks = 'Define cuántas semanas dura el plan.'
  }

  const sessionDurationMin = Number(body.sessionDurationMin)
  if (!Number.isInteger(sessionDurationMin) || sessionDurationMin < 30 || sessionDurationMin > 240 || sessionDurationMin % 15 !== 0) {
    errors.sessionDurationMin = 'Cada clase debe durar entre 30 y 240 minutos, en bloques de 15.'
  }

  // Días y horarios en que se imparte el curso (obligatorios)
  let availability: AvailabilityWindow[] = []
  if (!errors.sessionDurationMin) {
    const checked = validateWindows(body.availability, sessionDurationMin)
    if (checked.error) errors.availability = checked.error
    else availability = checked.windows
  }

  // Las franjas deben alcanzar para las clases por semana del plan
  if (sessionsPerWeek && availability.length > 0 && !errors.sessionDurationMin) {
    const capacity = availability.reduce((sum, window) => sum + Math.floor((toMinutes(window.end) - toMinutes(window.start)) / sessionDurationMin), 0)
    if (capacity < sessionsPerWeek) errors.sessionsPerWeek = `Tus horarios solo alcanzan para ${capacity} ${capacity === 1 ? 'clase' : 'clases'} por semana. Amplía las franjas o baja las clases por semana.`
  }

  let travelFeePerKm = 0
  let maxTravelKm = 0
  if (modes.includes('student_home')) {
    travelFeePerKm = Number(body.travelFeePerKm ?? 0)
    maxTravelKm = Number(body.maxTravelKm)
    if (!Number.isFinite(travelFeePerKm) || travelFeePerKm < 0 || travelFeePerKm > 100) errors.travelFeePerKm = 'La tarifa por km debe estar entre Q0 y Q100.'
    if (!Number.isFinite(maxTravelKm) || maxTravelKm < 1 || maxTravelKm > 100) errors.maxTravelKm = 'La distancia máxima debe estar entre 1 y 100 km.'
  }

  if (Object.keys(errors).length > 0 || !category || !level || !classType) return { errors }
  return {
    errors,
    data: { title, description, category: category._id, modes, hourlyRate, level, meetingUrl, availability, classType, maxStudents, weeks, sessionsPerWeek, totalSessions, sessionDurationMin, travelFeePerKm, maxTravelKm, active: body.active !== false },
    categoryName: category.name,
  }
}

// Solo los tutores aprobados pueden publicar ofertas
async function requireApprovedTutor(userId: string | undefined, res: Response) {
  const tutor = await User.findById(userId)
  if (tutor?.role !== 'tutor' || tutor.tutorProfile?.status !== 'approved') {
    res.status(403).json({ message: 'Tu perfil de tutor debe estar aprobado para gestionar ofertas.' })
    return null
  }
  return tutor
}

export async function listMyOffers(req: Request, res: Response): Promise<void> {
  const offers = await Offer.find({ tutor: req.auth?.sub }).sort({ createdAt: -1 })
  const categories = await Category.find({ _id: { $in: offers.map((offer) => offer.category) } })
  const nameById = new Map(categories.map((category) => [String(category._id), category.name]))
  const seats = await activeSeats(offers.map((offer) => offer._id))
  res.json({ offers: offers.map((offer) => toOfferView(offer, nameById.get(String(offer.category)), seats.get(String(offer._id)) ?? 0)) })
}

export async function createOffer(req: Request<unknown, unknown, OfferBody>, res: Response): Promise<void> {
  const tutor = await requireApprovedTutor(req.auth?.sub, res)
  if (!tutor) return

  const { errors, data, categoryName } = await validateOffer(req.body ?? {})
  if (!data) {
    res.status(400).json({ message: 'Revisa los datos de la oferta.', errors })
    return
  }
  if ((await Offer.countDocuments({ tutor: tutor._id })) >= 30) {
    res.status(400).json({ message: 'Alcanzaste el máximo de 30 ofertas.' })
    return
  }

  const offer = await Offer.create({ ...data, tutor: tutor._id })
  res.status(201).json({ offer: toOfferView(offer, categoryName) })
}

export async function updateOffer(req: Request<{ id: string }, unknown, OfferBody>, res: Response): Promise<void> {
  const tutor = await requireApprovedTutor(req.auth?.sub, res)
  if (!tutor) return

  const offer = isValidObjectId(req.params.id) ? await Offer.findOne({ _id: req.params.id, tutor: tutor._id }) : null
  if (!offer) {
    res.status(404).json({ message: 'Oferta no encontrada' })
    return
  }

  const { errors, data, categoryName } = await validateOffer(req.body ?? {})
  if (!data) {
    res.status(400).json({ message: 'Revisa los datos de la oferta.', errors })
    return
  }

  // No se pueden bajar los cupos por debajo de los estudiantes que ya están inscritos
  const seatsTaken = (await activeSeats([offer._id])).get(String(offer._id)) ?? 0
  if (data.classType === 'group' && data.maxStudents < seatsTaken) {
    res.status(400).json({ message: 'Revisa los datos de la oferta.', errors: { maxStudents: `Ya hay ${seatsTaken} estudiantes activos: los cupos no pueden ser menos.` } })
    return
  }

  offer.set(data)
  await offer.save()
  res.json({ offer: toOfferView(offer, categoryName, seatsTaken) })
}

export async function deleteOffer(req: Request<{ id: string }>, res: Response): Promise<void> {
  const offer = isValidObjectId(req.params.id) ? await Offer.findOneAndDelete({ _id: req.params.id, tutor: req.auth?.sub }) : null
  if (!offer) {
    res.status(404).json({ message: 'Oferta no encontrada' })
    return
  }
  res.status(204).end()
}
