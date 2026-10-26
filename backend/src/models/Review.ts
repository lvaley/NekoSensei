import { model, Schema, Types } from 'mongoose'

// Reseña de un estudiante a su tutor tras al menos una clase realizada. Una por inscripción y no se edita:
// queda registrada tal cual para auditoría.
export const MIN_COMMENT = 10
export const MAX_COMMENT = 500

export interface IReview {
  tutor: Types.ObjectId
  student: Types.ObjectId
  enrollment: Types.ObjectId
  offerTitle: string
  rating: number
  comment: string
  createdAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
    offerTitle: { type: String, required: true, maxlength: 120 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: MIN_COMMENT, maxlength: MAX_COMMENT },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const Review = model<IReview>('Review', reviewSchema)
