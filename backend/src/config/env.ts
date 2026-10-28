import dotenv from 'dotenv'

dotenv.config()

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`)
  }
  return value
}

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI'),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  // Autenticación: la duración del JWT es configurable por entorno (ej. 15m, 1h, 7d)
  jwtSecret: process.env.JWT_SECRET ?? 'cambiar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  // Client ID de Google (público). Se crea en Google Cloud Console > Credenciales
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  // Correos que reciben el rol administrador al iniciar sesión (separados por coma)
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  // Comisión de la plataforma sobre lo cobrado (0.10 = 10 %). Se calcula al generar los reportes
  commissionRate: Math.min(1, Math.max(0, Number(process.env.COMMISSION_RATE ?? 0.1) || 0)),
} as const

if (env.nodeEnv === 'production' && env.jwtSecret === 'cambiar-en-produccion') {
  throw new Error('JWT_SECRET debe configurarse en producción')
}

export { env }
