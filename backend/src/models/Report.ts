import { model, Schema, Types } from 'mongoose'

export const REPORT_REASONS = ['acoso', 'fraude', 'contenido_inapropiado', 'incumplimiento', 'suplantacion', 'otro'] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const REPORT_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

// Denuncia de un estudiante o tutor contra otra persona con la que tiene (o tuvo) una inscripción
export interface IReport {
  reporter: Types.ObjectId
  reported: Types.ObjectId
  reason: ReportReason
  detail: string
  status: ReportStatus
  adminNote?: string
  resolvedBy?: Types.ObjectId
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reported: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    detail: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: { type: String, enum: REPORT_STATUSES, default: 'pending', index: true },
    adminNote: { type: String, trim: true, maxlength: 500 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
)

export const Report = model<IReport>('Report', reportSchema)
