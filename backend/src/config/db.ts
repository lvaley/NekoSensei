import mongoose from 'mongoose'
import { env } from './env'

export async function connectDB(): Promise<void> {
  await mongoose.connect(env.mongoUri)
  console.log('MongoDB conectado')
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1
}
