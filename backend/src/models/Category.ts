import { model, Schema, Types } from 'mongoose'

export interface ICategory {
  name: string
  // null = categoría principal; con valor = subcategoría de esa categoría
  parent: Types.ObjectId | null
  active: boolean
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

categorySchema.index({ name: 1, parent: 1 }, { unique: true })

export const Category = model<ICategory>('Category', categorySchema)
