import type { NextFunction, Request, Response } from 'express'
import { User } from '../models/User'
import type { UserRole } from '../models/User'
import { verifyToken } from '../services/token.service'

function readToken(req: Request): string | undefined {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined
}

async function authenticate(req: Request, res: Response, next: NextFunction, allowSuspended: boolean): Promise<void> {
  const token = readToken(req)
  if (!token) {
    res.status(401).json({ message: 'Autenticación requerida' })
    return
  }

  try {
    req.auth = verifyToken(token)
  } catch {
    res.status(401).json({ message: 'Sesión inválida o expirada' })
    return
  }

  // Una cuenta suspendida solo puede consultar su sesión y apelar: el resto de la API le responde 403
  if (!allowSuspended) {
    const user = await User.findById(req.auth.sub).select('suspended')
    if (user?.suspended) {
      res.status(403).json({ code: 'account_suspended', message: 'Tu cuenta está suspendida.' })
      return
    }
  }
  next()
}

// Exige un JWT válido en el header Authorization: Bearer <token> y una cuenta que no esté suspendida
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  authenticate(req, res, next, false).catch(next)
}

// Igual que requireAuth, pero deja pasar a las cuentas suspendidas (ver la sesión y enviar la apelación)
export function requireAuthAllowSuspended(req: Request, res: Response, next: NextFunction): void {
  authenticate(req, res, next, true).catch(next)
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
