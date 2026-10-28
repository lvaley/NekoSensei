import { model, Schema, Types } from 'mongoose'

// Aviso para un usuario (campanita del header). Se genera en el servidor cuando algo requiere su atención.
export const NOTIFICATION_TYPES = [
  'enrollment_requested',
  'enrollment_accepted',
  'enrollment_rejected',
  'enrollment_cancelled',
  'enrollment_finished',
  'payment_required',
  'payment_received',
  'payment_expired',
  'payment_refunded',
  'session_scheduled',
  'session_cancelled',
  'reschedule_requested',
  'reschedule_proposed',
  'reschedule_declined',
  'reschedule_accepted',
  'reschedule_rejected',
  'review_received',
  'report_received',
  'report_closed',
  'appeal_received',
  'account_reactivated',
  'tutor_application',
  'tutor_inactivated',
  'tutor_reactivated',
  'tutor_reactivation_request',
  'contact_message',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface INotification {
  user: Types.ObjectId
  type: NotificationType
  title: string
  message: string
  // Ruta del frontend a la que lleva el aviso
  link: string
  read: boolean
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 400 },
    link: { type: String, default: '/panel', maxlength: 100 },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const Notification = model<INotification>('Notification', notificationSchema)
