import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'
import type { UserRole } from '../models/User'

export interface TokenPayload {
  sub: string
  role: UserRole
}

// La duración (JWT_EXPIRES_IN) se lee del entorno: 15m, 1h, 7d...
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] })
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret)
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') {
    throw new Error('Token con formato inválido')
  }
  return { sub: decoded.sub, role: decoded.role as UserRole }
}
