import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Category } from '../models/Category'
import { Offer, TEACHING_MODES } from '../models/Offer'
import type { TeachingMode } from '../models/Offer'
import { User } from '../models/User'

type OfferErrors = Record<string, string>

interface OfferBody {
  title?: unknown
  description?: unknown
  category?: unknown
  modes?: unknown
  hourlyRate?: unknown
  travelFeePerKm?: unknown
  maxTravelKm?: unknown
  active?: unknown
}

function toOfferView(offer: InstanceType<typeof Offer>, categoryName?: string) {
  return {
    id: String(offer._id),
    title: offer.title,
    description: offer.description,
    category: { id: String(offer.category), name: categoryName ?? '' },
    modes: offer.modes,
    hourlyRate: offer.hourlyRate,
    travelFeePerKm: offer.travelFeePerKm,
    maxTravelKm: offer.maxTravelKm,
    active: offer.active,
    updatedAt: offer.updatedAt,
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

  let travelFeePerKm = 0
  let maxTravelKm = 0
  if (modes.includes('student_home')) {
    travelFeePerKm = Number(body.travelFeePerKm ?? 0)
    maxTravelKm = Number(body.maxTravelKm)
    if (!Number.isFinite(travelFeePerKm) || travelFeePerKm < 0 || travelFeePerKm > 100) errors.travelFeePerKm = 'La tarifa por km debe estar entre Q0 y Q100.'
    if (!Number.isFinite(maxTravelKm) || maxTravelKm < 1 || maxTravelKm > 100) errors.maxTravelKm = 'La distancia máxima debe estar entre 1 y 100 km.'
  }

  if (Object.keys(errors).length > 0 || !category) return { errors }
  return {
    errors,
    data: { title, description, category: category._id, modes, hourlyRate, travelFeePerKm, maxTravelKm, active: body.active !== false },
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
  res.json({ offers: offers.map((offer) => toOfferView(offer, nameById.get(String(offer.category)))) })
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

  offer.set(data)
  await offer.save()
  res.json({ offer: toOfferView(offer, categoryName) })
}

export async function deleteOffer(req: Request<{ id: string }>, res: Response): Promise<void> {
  const offer = isValidObjectId(req.params.id) ? await Offer.findOneAndDelete({ _id: req.params.id, tutor: req.auth?.sub }) : null
  if (!offer) {
    res.status(404).json({ message: 'Oferta no encontrada' })
    return
  }
  res.status(204).end()
}
