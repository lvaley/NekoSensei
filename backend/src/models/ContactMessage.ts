import { model, Schema } from 'mongoose'

export const CONTACT_SUBJECTS = ['consulta', 'soporte', 'tutor', 'sugerencia', 'otro'] as const
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export interface IContactMessage {
  name: string
  email: string
  subject: ContactSubject
  message: string
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    subject: { type: String, required: true, enum: CONTACT_SUBJECTS },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)

export const ContactMessage = model<IContactMessage>('ContactMessage', contactMessageSchema)
