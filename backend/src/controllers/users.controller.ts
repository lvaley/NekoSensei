import type { Request, Response } from 'express'
import { User } from '../models/User'

// Listado de usuarios (solo administradores)
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await User.find().sort({ createdAt: -1 }).limit(200)
  res.json({
    users: users.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      suspended: !!user.suspended,
      createdAt: user.createdAt,
    })),
  })
}
