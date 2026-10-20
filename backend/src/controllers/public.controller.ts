import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Category } from '../models/Category'
import { Offer, TEACHING_MODES } from '../models/Offer'
import type { IOffer, TeachingMode } from '../models/Offer'
import { User } from '../models/User'
import type { IUser } from '../models/User'
import { distanceKm, round } from '../services/geo.service'

interface Filters {
  q: string
  categoryIds: string[] | null
  maxPrice: number | null
  mode: TeachingMode | null
  origin: { lat: number; lng: number } | null
  maxKm: number | null
}

function numberParam(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// Lee los filtros de búsqueda de la URL (?q=&category=&maxPrice=&mode=&lat=&lng=&maxKm=)
async function readFilters(req: Request): Promise<Filters> {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase().slice(0, 60) : ''

  // Elegir una categoría principal incluye también sus subcategorías
  let categoryIds: string[] | null = null
  const category = typeof req.query.category === 'string' ? req.query.category : ''
  if (isValidObjectId(category)) {
    const children = await Category.find({ parent: category, active: true })
    categoryIds = [category, ...children.map((child) => String(child._id))]
  }

  const mode = TEACHING_MODES.includes(req.query.mode as TeachingMode) ? (req.query.mode as TeachingMode) : null
  const lat = numberParam(req.query.lat)
  const lng = numberParam(req.query.lng)
  const origin = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null

  return { q, categoryIds, maxPrice: numberParam(req.query.maxPrice), mode, origin, maxKm: numberParam(req.query.maxKm) }
}

type TutorDoc = IUser & { _id: unknown }

// Distancia aproximada y costo de traslado de una oferta hacia el estudiante
function travelInfo(offer: IOffer, tutor: TutorDoc, origin: Filters['origin']) {
  const km = origin && tutor.address ? round(distanceKm(origin, tutor.address), 1) : null
  const offersTravel = offer.modes.includes('student_home')
  const inRange = km !== null && offersTravel ? km <= offer.maxTravelKm : null
  const travelCost = km !== null && offersTravel && inRange ? round(km * offer.travelFeePerKm, 2) : null
  return { distanceKm: km, inTravelRange: inRange, travelCost }
}

// La ubicación exacta es privada: el mapa público usa coordenadas redondeadas (~1 km)
function publicLocation(tutor: TutorDoc) {
  return tutor.address ? { lat: round(tutor.address.lat, 2), lng: round(tutor.address.lng, 2) } : null
}

async function approvedTutors(): Promise<Map<string, TutorDoc>> {
  const tutors = await User.find({ role: 'tutor', 'tutorProfile.status': 'approved' }).limit(500)
  return new Map(tutors.map((tutor) => [String(tutor._id), tutor as unknown as TutorDoc]))
}

function offerMatches(offer: IOffer, filters: Filters): boolean {
  if (filters.categoryIds && !filters.categoryIds.includes(String(offer.category))) return false
  if (filters.mode && !offer.modes.includes(filters.mode)) return false
  if (filters.maxPrice !== null && offer.hourlyRate > filters.maxPrice) return false
  return true
}

function toOfferView(offer: IOffer & { _id: unknown }, tutor: TutorDoc, categoryName: string, filters: Filters) {
  return {
    id: String(offer._id),
    title: offer.title,
    description: offer.description,
    category: { id: String(offer.category), name: categoryName },
    modes: offer.modes,
    hourlyRate: offer.hourlyRate,
    travelFeePerKm: offer.travelFeePerKm,
    maxTravelKm: offer.maxTravelKm,
    tutor: { id: String(tutor._id), name: tutor.name, picture: tutor.picture },
    ...travelInfo(offer, tutor, filters.origin),
  }
}

async function categoryNames(ids: unknown[]): Promise<Map<string, string>> {
  const categories = await Category.find({ _id: { $in: ids } })
  return new Map(categories.map((category) => [String(category._id), category.name]))
}

// Cursos: ofertas activas de tutores aprobados, con filtros y distancia/traslado
export async function listOffers(req: Request, res: Response): Promise<void> {
  const filters = await readFilters(req)
  const tutors = await approvedTutors()
  const offers = await Offer.find({ active: true, tutor: { $in: [...tutors.keys()] } }).sort({ createdAt: -1 }).limit(500)
  const names = await categoryNames(offers.map((offer) => offer.category))

  let views = offers
    .filter((offer) => offerMatches(offer, filters))
    .map((offer) => toOfferView(offer, tutors.get(String(offer.tutor)) as TutorDoc, names.get(String(offer.category)) ?? '', filters))
    .filter((view) => !filters.q || `${view.title} ${view.description} ${view.tutor.name} ${view.category.name}`.toLowerCase().includes(filters.q))
    .filter((view) => filters.maxKm === null || view.distanceKm === null || view.distanceKm <= filters.maxKm)

  if (filters.origin) views = views.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  res.json({ offers: views })
}

// Directorio de tutores aprobados con filtros. Con filtros de categoría, modalidad o precio solo salen
// los tutores que tengan al menos una oferta activa que los cumpla.
export async function listTutors(req: Request, res: Response): Promise<void> {
  const filters = await readFilters(req)
  const tutors = await approvedTutors()
  const offers = await Offer.find({ active: true, tutor: { $in: [...tutors.keys()] } })
  const offersByTutor = new Map<string, IOffer[]>()
  for (const offer of offers) offersByTutor.set(String(offer.tutor), [...(offersByTutor.get(String(offer.tutor)) ?? []), offer])

  const hasOfferFilter = filters.categoryIds !== null || filters.mode !== null
  const allCategoryIds = new Set<string>()
  tutors.forEach((tutor) => tutor.categories.forEach((id) => allCategoryIds.add(String(id))))
  const names = await categoryNames([...allCategoryIds])

  let views = [...tutors.values()]
    .map((tutor) => {
      const tutorOffers = offersByTutor.get(String(tutor._id)) ?? []
      const matching = tutorOffers.filter((offer) => offerMatches(offer, filters))
      const km = filters.origin && tutor.address ? round(distanceKm(filters.origin, tutor.address), 1) : null
      const prices = (matching.length > 0 ? matching : tutorOffers).map((offer) => offer.hourlyRate)
      return {
        tutor,
        matching,
        view: {
          id: String(tutor._id),
          name: tutor.name,
          picture: tutor.picture,
          bio: tutor.tutorProfile?.bio ?? '',
          hourlyRate: tutor.tutorProfile?.hourlyRate ?? 0,
          fromPrice: prices.length > 0 ? Math.min(...prices) : tutor.tutorProfile?.hourlyRate ?? 0,
          categories: tutor.categories.map((id) => names.get(String(id))).filter(Boolean),
          offerCount: tutorOffers.length,
          location: publicLocation(tutor),
          distanceKm: km,
        },
      }
    })
    .filter(({ tutor, matching, view }) => {
      if (hasOfferFilter && matching.length === 0) return false
      if (filters.maxPrice !== null && !hasOfferFilter && (tutor.tutorProfile?.hourlyRate ?? 0) > filters.maxPrice && matching.length === 0) return false
      if (filters.q && !`${view.name} ${view.bio} ${view.categories.join(' ')}`.toLowerCase().includes(filters.q)) return false
      if (filters.maxKm !== null && view.distanceKm !== null && view.distanceKm > filters.maxKm) return false
      return true
    })
    .map(({ view }) => view)

  if (filters.origin) views = views.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  res.json({ tutors: views })
}

// Perfil público de un tutor aprobado, con sus ofertas activas
export async function getTutor(req: Request<{ id: string }>, res: Response): Promise<void> {
  const tutor = isValidObjectId(req.params.id) ? await User.findOne({ _id: req.params.id, role: 'tutor', 'tutorProfile.status': 'approved' }) : null
  if (!tutor) {
    res.status(404).json({ message: 'Tutor no encontrado' })
    return
  }

  const filters = await readFilters(req)
  const offers = await Offer.find({ tutor: tutor._id, active: true }).sort({ createdAt: -1 })
  const names = await categoryNames([...tutor.categories, ...offers.map((offer) => offer.category)])
  const doc = tutor as unknown as TutorDoc

  res.json({
    tutor: {
      id: String(tutor._id),
      name: tutor.name,
      picture: tutor.picture,
      bio: tutor.tutorProfile?.bio ?? '',
      hourlyRate: tutor.tutorProfile?.hourlyRate ?? 0,
      portfolioUrl: tutor.tutorProfile?.portfolioUrl,
      categories: tutor.categories.map((id) => names.get(String(id))).filter(Boolean),
      location: publicLocation(doc),
      distanceKm: filters.origin && tutor.address ? round(distanceKm(filters.origin, tutor.address), 1) : null,
    },
    offers: offers.map((offer) => toOfferView(offer, doc, names.get(String(offer.category)) ?? '', filters)),
  })
}
