import { model, Schema, Types } from 'mongoose'

// Modalidades de clase: virtual, en casa del tutor o en casa del estudiante (esta última puede tener costo de traslado)
export const TEACHING_MODES = ['virtual', 'tutor_home', 'student_home'] as const
export type TeachingMode = (typeof TEACHING_MODES)[number]

export interface IOffer {
  tutor: Types.ObjectId
  title: string
  description: string
  category: Types.ObjectId
  modes: TeachingMode[]
  // Precio por hora de la clase (en quetzales)
  hourlyRate: number
  // Solo aplica a la modalidad "en casa del estudiante": tarifa por km y distancia máxima que el tutor viaja
  travelFeePerKm: number
  maxTravelKm: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const offerSchema = new Schema<IOffer>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 800 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    modes: { type: [{ type: String, enum: TEACHING_MODES }], validate: (value: string[]) => value.length > 0 },
    hourlyRate: { type: Number, required: true, min: 1, max: 10000 },
    travelFeePerKm: { type: Number, default: 0, min: 0, max: 100 },
    maxTravelKm: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Offer = model<IOffer>('Offer', offerSchema)
