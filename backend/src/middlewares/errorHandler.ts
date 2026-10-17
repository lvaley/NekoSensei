import type { NextFunction, Request, Response } from 'express'

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Ruta no encontrada' })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err)
  res.status(500).json({ message: 'Error interno del servidor' })
}
