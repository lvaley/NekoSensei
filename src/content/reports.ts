import type { ReportReason, ReportStatus } from '../types'

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  acoso: 'Acoso o trato irrespetuoso',
  fraude: 'Fraude o cobros indebidos',
  contenido_inapropiado: 'Contenido inapropiado',
  incumplimiento: 'Incumplimiento de lo acordado',
  suplantacion: 'Suplantación de identidad',
  otro: 'Otro motivo',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, { text: string; className: string }> = {
  pending: { text: 'Pendiente', className: 'is-pending' },
  reviewing: { text: 'En revisión', className: 'is-pending' },
  resolved: { text: 'Resuelta', className: 'is-active' },
  dismissed: { text: 'Descartada', className: 'is-closed' },
}
