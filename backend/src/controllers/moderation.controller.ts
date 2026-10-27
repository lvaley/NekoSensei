import { isValidObjectId } from 'mongoose'
import type { Request, Response } from 'express'
import { Report } from '../models/Report'
import { User } from '../models/User'
import { toSuspensionView } from '../serializers/user'
import { notify, notifyAdmins } from '../services/notify.service'
import { notifyReporterClosed } from './reports.controller'

async function targetUser(req: Request<{ id: string }>, res: Response) {
  const user = isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' })
    return null
  }
  return user
}

// Suspende una cuenta: la persona puede iniciar sesión, pero solo ve la pantalla de suspensión y la apelación
export async function suspendUser(req: Request<{ id: string }>, res: Response): Promise<void> {
  const user = await targetUser(req, res)
  if (!user) return
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
  if (reason.length < 10 || reason.length > 500) {
    res.status(400).json({ message: 'Indica el motivo de la suspensión (entre 10 y 500 caracteres).' })
    return
  }
  if (user.role === 'admin') {
    res.status(403).json({ message: 'No se puede suspender a un administrador.' })
    return
  }
  if (user.suspended) {
    res.status(409).json({ message: 'Esta cuenta ya está suspendida.' })
    return
  }

  const reportId = typeof req.body?.reportId === 'string' && isValidObjectId(req.body.reportId) ? req.body.reportId : undefined
  user.suspended = true
  user.suspension = { reason, suspendedAt: new Date(), suspendedBy: req.auth?.sub as never, report: reportId as never }
  await user.save()

  // Si la suspensión viene de una denuncia, esa denuncia (y las demás abiertas contra la misma persona) quedan resueltas
  const open = await Report.find({ reported: user._id, status: { $in: ['pending', 'reviewing'] } })
  for (const report of open) {
    report.status = 'resolved'
    report.adminNote = 'La cuenta denunciada fue suspendida.'
    report.resolvedBy = req.auth?.sub as never
    report.resolvedAt = new Date()
    await report.save()
    await notifyReporterClosed(report.reporter, 'resolved', report.adminNote)
  }
  res.json({ user: { id: String(user._id), suspended: true } })
}

// Reactiva una cuenta sin necesidad de apelación
export async function reactivateUser(req: Request<{ id: string }>, res: Response): Promise<void> {
  const user = await targetUser(req, res)
  if (!user) return
  if (!user.suspended) {
    res.status(409).json({ message: 'Esta cuenta no está suspendida.' })
    return
  }
  await lift(user)
  res.json({ user: { id: String(user._id), suspended: false } })
}

async function lift(user: InstanceType<typeof User>): Promise<void> {
  user.suspended = false
  user.suspension = undefined
  await user.save()
  await notify({ user: user._id, type: 'account_reactivated', title: 'Tu cuenta fue reactivada', message: 'Ya puedes usar Neko Sensei con normalidad. Recuerda respetar las normas de convivencia.', link: '/panel' })
}

// Cuentas suspendidas con su apelación (administrador); primero las que esperan respuesta
export async function listSuspensions(_req: Request, res: Response): Promise<void> {
  const users = await User.find({ suspended: true }).limit(200)
  const rank = (user: (typeof users)[number]) => (user.suspension?.appeal?.status === 'pending' ? 0 : 1)
  users.sort((a, b) => rank(a) - rank(b) || (b.suspension?.suspendedAt.getTime() ?? 0) - (a.suspension?.suspendedAt.getTime() ?? 0))
  res.json({
    suspensions: users.map((user) => ({ user: { id: String(user._id), name: user.name, email: user.email, role: user.role }, ...(user.suspension ? toSuspensionView(user.suspension) : {}) })),
  })
}

// El administrador acepta la apelación (la cuenta se reactiva) o la rechaza con una respuesta
export async function decideAppeal(req: Request<{ id: string }>, res: Response): Promise<void> {
  const user = await targetUser(req, res)
  if (!user) return
  const appeal = user.suspension?.appeal
  if (!user.suspended || !user.suspension || appeal?.status !== 'pending') {
    res.status(409).json({ message: 'Esta cuenta no tiene una apelación pendiente.' })
    return
  }
  const decision = req.body?.decision
  const response = typeof req.body?.response === 'string' ? req.body.response.trim() : ''
  if (decision !== 'accept' && decision !== 'reject') {
    res.status(400).json({ message: 'La decisión debe ser "accept" o "reject".' })
    return
  }
  if (decision === 'reject' && (response.length < 5 || response.length > 500)) {
    res.status(400).json({ message: 'Explica brevemente por qué se rechaza la apelación (entre 5 y 500 caracteres).' })
    return
  }

  if (decision === 'accept') {
    await lift(user)
  } else {
    appeal.status = 'rejected'
    appeal.response = response
    appeal.respondedAt = new Date()
    user.markModified('suspension')
    await user.save()
  }
  res.json({ user: { id: String(user._id), suspended: decision === 'reject' } })
}

// La persona suspendida expone su caso al administrador (una apelación a la vez)
export async function sendAppeal(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth?.sub)
  if (!user?.suspended || !user.suspension) {
    res.status(409).json({ message: 'Tu cuenta no está suspendida.' })
    return
  }
  if (user.suspension.appeal?.status === 'pending') {
    res.status(409).json({ message: 'Ya enviaste tu apelación: el administrador la está revisando.' })
    return
  }
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
  if (message.length < 20 || message.length > 1000) {
    res.status(400).json({ message: 'Expón tu caso con entre 20 y 1000 caracteres.' })
    return
  }

  user.suspension.appeal = { message, sentAt: new Date(), status: 'pending' }
  user.markModified('suspension')
  await user.save()
  await notifyAdmins({ type: 'appeal_received', title: 'Nueva apelación', message: `${user.name} apeló la suspensión de su cuenta.`, link: '/admin/denuncias' })
  res.status(201).json({ suspension: toSuspensionView(user.suspension) })
}
