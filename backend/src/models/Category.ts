import { model, Schema, Types } from 'mongoose'

// Iconos (Bootstrap Icons) que el administrador puede asignar a una categoría principal; si no elige, se usa el genérico
export const CATEGORY_ICONS = [
  'bi-translate', 'bi-trophy', 'bi-calculator', 'bi-flask', 'bi-laptop', 'bi-code-slash', 'bi-mortarboard', 'bi-music-note-beamed',
  'bi-palette', 'bi-book', 'bi-camera', 'bi-globe', 'bi-heart-pulse', 'bi-briefcase', 'bi-graph-up', 'bi-cup-hot',
  'bi-egg-fried', 'bi-tools', 'bi-lightbulb', 'bi-brush', 'bi-journal-bookmark', 'bi-chat-dots', 'bi-pencil', 'bi-controller',
  'bi-cpu', 'bi-bank', 'bi-tree', 'bi-rocket-takeoff', 'bi-openai', 'bi-shield-lock'
] as const
export const DEFAULT_CATEGORY_ICON = 'bi-journal-bookmark'
export const isCategoryIcon = (value: unknown): value is string => typeof value === 'string' && (CATEGORY_ICONS as readonly string[]).includes(value)

export interface ICategory {
  name: string
  // null = categoría principal; con valor = subcategoría de esa categoría
  parent: Types.ObjectId | null
  active: boolean
  icon: string
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    active: { type: Boolean, default: true },
    icon: { type: String, default: DEFAULT_CATEGORY_ICON },
  },
  { timestamps: true },
)

categorySchema.index({ name: 1, parent: 1 }, { unique: true })

export const Category = model<ICategory>('Category', categorySchema)
