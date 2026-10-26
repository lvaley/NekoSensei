import { model, Schema, Types } from 'mongoose'

// Canal privado entre un estudiante y un tutor (uno por pareja)
export interface IConversation {
  student: Types.ObjectId
  tutor: Types.ObjectId
  lastText: string
  lastMessageAt: Date | null
  createdAt: Date
}

const conversationSchema = new Schema<IConversation>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastText: { type: String, default: '', maxlength: 120 },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)
conversationSchema.index({ student: 1, tutor: 1 }, { unique: true })

export const Conversation = model<IConversation>('Conversation', conversationSchema)
