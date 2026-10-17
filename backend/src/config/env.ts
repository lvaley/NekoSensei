import dotenv from 'dotenv'

dotenv.config()

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI'),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  // Se usarán en la v0.2 (autenticación). La duración del JWT es configurable por entorno.
  jwtSecret: process.env.JWT_SECRET ?? 'cambiar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
} as const
