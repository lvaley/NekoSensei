import { OAuth2Client } from 'google-auth-library'
import { env } from '../config/env'

export interface GoogleProfile {
  googleId: string
  email: string
  name: string
  picture?: string
}

const client = new OAuth2Client(env.googleClientId)

// Valida el ID token que entrega Google al frontend y devuelve el perfil verificado
export async function verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
  const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId })
  const payload = ticket.getPayload()

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new Error('Cuenta de Google sin correo verificado')
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email,
    picture: payload.picture,
  }
}
