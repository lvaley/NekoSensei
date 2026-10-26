import { model, Schema, Types } from 'mongoose'

export const MAX_MESSAGE = 1000

export interface IMessage {
  conversation: Types.ObjectId
  sender: Types.ObjectId
  text: string
  // Confirmación de lectura: la fecha en que la otra persona lo vio
  readAt: Date | null
  createdAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, minlength: 1, maxlength: MAX_MESSAGE },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const Message = model<IMessage>('Message', messageSchema)
