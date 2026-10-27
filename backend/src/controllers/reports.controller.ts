import { isValidObjectId } from 'mongoose'
import type { Request, Response } from 'express'
import { Enrollment } from '../models/Enrollment'
import { Report, REPORT_REASONS, REPORT_STATUSES } from '../models/Report'
import type { ReportReason, ReportStatus } from '../models/Report'
import { User } from '../models/User'
import { notify, notifyAdmins } from '../services/notify.service'

export const REASON_LABELS: Record<ReportReason, string> = {
  acoso: 'Acoso o trato irrespetuoso',
  fraude: 'Fraude o cobros indebidos',
  contenido_inapropiado: 'Contenido inapropiado',
  incumplimiento: 'Incumplimiento de lo acordado',
  suplantacion: 'Suplantación de identidad',
  otro: 'Otro motivo',
}

// Un estudiante o tutor denuncia a la otra persona de una inscripción en común
export async function createReport(req: Request, res: Response): Promise<void> {
  const me = req.auth?.sub as string
  const targetId = typeof req.body?.userId === 'string' ? req.body.userId : ''
  const reason = req.body?.reason as ReportReason
  const detail = typeof req.body?.detail === 'string' ? req.body.detail.trim() : ''

  if (!REPORT_REASONS.includes(reason)) {
    res.status(400).json({ message: 'Elige el motivo de la denuncia.' })
    return
  }
  if (detail.length < 10 || detail.length > 1000) {
    res.status(400).json({ message: 'Describe lo ocurrido con entre 10 y 1000 caracteres.' })
    return
  }
  if (!isValidObjectId(targetId) || targetId === me) {
    res.status(404).json({ message: 'No puedes denunciar a esta persona.' })
    return
  }

  const target = await User.findById(targetId)
  const shared = target && (target.role === 'student' || target.role === 'tutor') && (await Enrollment.exists(req.auth?.role === 'tutor' ? { tutor: me, student: targetId } : { student: me, tutor: targetId }))
  if (!target || !shared) {
    res.status(404).json({ message: 'Solo puedes denunciar a personas con las que tienes una inscripción.' })
    return
  }
  if (await Report.exists({ reporter: me, reported: targetId, status: { $in: ['pending', 'reviewing'] } })) {
    res.status(409).json({ message: 'Ya tienes una denuncia abierta contra esta persona. El equipo la está revisando.' })
    return
  }

  const report = await Report.create({ reporter: me, reported: targetId, reason, detail })
  const reporter = await User.findById(me)
  await notifyAdmins({ type: 'report_received', title: 'Nueva denuncia', message: `${reporter?.name ?? 'Alguien'} denunció a ${target.name}: ${REASON_LABELS[reason]}.`, link: '/admin/denuncias' })
  res.status(201).json({ report: { id: String(report._id), status: report.status } })
}

// Bandeja de denuncias (administrador), con el historial de la persona denunciada
export async function listReports(req: Request, res: Response): Promise<void> {
  const status = typeof req.query.status === 'string' ? (req.query.status as ReportStatus) : undefined
  const filter = status && REPORT_STATUSES.includes(status) ? { status } : {}
  const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(200)

  const ids = [...new Set(reports.flatMap((report) => [String(report.reporter), String(report.reported)]))]
  const users = new Map((await User.find({ _id: { $in: ids } })).map((user) => [String(user._id), user]))
  const against = new Map<string, number>()
  for (const report of await Report.find({ reported: { $in: ids } }).select('reported')) against.set(String(report.reported), (against.get(String(report.reported)) ?? 0) + 1)
  const view = (id: string) => {
    const user = users.get(id)
    return { id, name: user?.name ?? 'Usuario eliminado', email: user?.email ?? '', role: user?.role ?? 'student', suspended: !!user?.suspended }
  }

  res.json({
    reports: reports.map((report) => ({
      id: String(report._id),
      reason: report.reason,
      reasonLabel: REASON_LABELS[report.reason],
      detail: report.detail,
      status: report.status,
      adminNote: report.adminNote,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      reporter: view(String(report.reporter)),
      reported: { ...view(String(report.reported)), totalReports: against.get(String(report.reported)) ?? 0 },
    })),
  })
}

// El administrador cambia el estado de una denuncia: en revisión, resuelta o descartada (estas dos con nota para la persona que denunció)
export async function updateReport(req: Request<{ id: string }>, res: Response): Promise<void> {
  const report = isValidObjectId(req.params.id) ? await Report.findById(req.params.id) : null
  if (!report) {
    res.status(404).json({ message: 'Denuncia no encontrada' })
    return
  }
  const status = req.body?.status as ReportStatus
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : ''
  if (!['reviewing', 'resolved', 'dismissed'].includes(status)) {
    res.status(400).json({ message: 'El estado debe ser "reviewing", "resolved" o "dismissed".' })
    return
  }
  const closing = status === 'resolved' || status === 'dismissed'
  if (closing && (note.length < 5 || note.length > 500)) {
    res.status(400).json({ message: 'Escribe una nota de entre 5 y 500 caracteres para cerrar la denuncia.' })
    return
  }
  if (report.status === 'resolved' || report.status === 'dismissed') {
    res.status(409).json({ message: 'Esta denuncia ya está cerrada.' })
    return
  }

  report.status = status
  if (closing) {
    report.adminNote = note
    report.resolvedBy = req.auth?.sub as never
    report.resolvedAt = new Date()
  }
  await report.save()
  if (closing) await notifyReporterClosed(report.reporter, status, note)
  res.json({ report: { id: String(report._id), status: report.status } })
}

export async function notifyReporterClosed(reporter: unknown, status: ReportStatus, note: string): Promise<void> {
  await notify({
    user: reporter as string,
    type: 'report_closed',
    title: status === 'resolved' ? 'Tu denuncia fue atendida' : 'Tu denuncia fue revisada',
    message: `${status === 'resolved' ? 'El equipo tomó medidas.' : 'El equipo no encontró motivo para actuar.'} ${note}`,
    link: '/panel',
  })
}
