import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '../models/User'
import { verifyToken } from '../services/token.service'

// Exige un JWT válido en el header Authorization: Bearer <token>
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    res.status(401).json({ message: 'Autenticación requerida' })
    return
  }

  try {
    req.auth = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ message: 'Sesión inválida o expirada' })
  }
}

// Debe usarse después de requireAuth: restringe el acceso a ciertos roles
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ message: 'No tienes permisos para esta acción' })
      return
    }
    next()
  }
}
