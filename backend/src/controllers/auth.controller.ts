import type { Request, Response } from 'express'
import { env } from '../config/env'
import { SELF_ASSIGNABLE_ROLES, User } from '../models/User'
import type { IUser, UserRole } from '../models/User'
import { verifyGoogleToken } from '../services/google.service'
import { signToken } from '../services/token.service'

interface GoogleLoginBody {
  credential?: unknown
  role?: unknown
}

function toPublicUser(user: IUser & { _id: unknown }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
  }
}

// Inicio de sesión / registro con Google. El rol solo se acepta al crear la cuenta.
export async function googleLogin(req: Request<unknown, unknown, GoogleLoginBody>, res: Response): Promise<void> {
  if (!env.googleClientId) {
    res.status(503).json({ message: 'El inicio de sesión con Google no está configurado' })
    return
  }

  const credential = typeof req.body?.credential === 'string' ? req.body.credential : ''
  if (!credential) {
    res.status(400).json({ message: 'Falta la credencial de Google' })
    return
  }

  let profile
  try {
    profile = await verifyGoogleToken(credential)
  } catch {
    res.status(401).json({ message: 'No se pudo verificar tu cuenta de Google' })
    return
  }

  const requestedRole = req.body?.role as UserRole
  const chosenRole: UserRole = SELF_ASSIGNABLE_ROLES.includes(requestedRole) ? requestedRole : 'student'

  let user = await User.findOne({ googleId: profile.googleId })
  if (!user) {
    user = await User.create({ ...profile, role: chosenRole })
  } else {
    user.name = profile.name
    user.picture = profile.picture
  }

  // Los correos configurados en ADMIN_EMAILS siempre son administradores
  if (env.adminEmails.includes(user.email) && user.role !== 'admin') {
    user.role = 'admin'
  }
  await user.save()

  const token = signToken({ sub: String(user._id), role: user.role })
  res.json({ token, user: toPublicUser(user) })
}

// Devuelve el usuario de la sesión actual (el rol se lee de la base de datos)
export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth?.sub)
  if (!user) {
    res.status(401).json({ message: 'Sesión inválida o expirada' })
    return
  }
  res.json({ user: toPublicUser(user) })
}
