import { model, Schema, Types } from 'mongoose'

// Pago de un bloque de clases. Nunca se guarda el número completo de la tarjeta ni el CVV:
// solo la marca y los últimos 4 dígitos.
export const PAYMENT_STATUSES = ['paid', 'failed'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export interface IPayment {
  enrollment: Types.ObjectId
  student: Types.ObjectId
  tutor: Types.ObjectId
  offerTitle: string
  // Número de bloque que se pagó (1 = el primero; 2, 3… son renovaciones)
  cycle: number
  kind: 'initial' | 'renewal'
  classes: number
  travel: number
  amount: number
  sessions: number
  status: PaymentStatus
  failureReason?: string
  cardBrand: string
  cardLast4: string
  // Reembolso al estudiante cuando el tutor cancela un bloque ya pagado (parte de las clases no realizadas)
  refundedAmount?: number
  refundedAt?: Date
  createdAt: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offerTitle: { type: String, required: true },
    cycle: { type: Number, default: 1 },
    kind: { type: String, enum: ['initial', 'renewal'], required: true },
    classes: { type: Number, required: true },
    travel: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    sessions: { type: Number, default: 0 },
    status: { type: String, enum: PAYMENT_STATUSES, required: true },
    failureReason: { type: String },
    cardBrand: { type: String, default: '' },
    cardLast4: { type: String, default: '' },
    refundedAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const Payment = model<IPayment>('Payment', paymentSchema)
