import type { Request, Response } from 'express'
import { isDbConnected } from '../config/db'

export function getHealth(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    database: isDbConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
}
