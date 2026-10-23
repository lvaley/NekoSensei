import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MODE_LABELS } from '../../content/modes'
import type { Enrollment, EnrollmentStatus } from '../../types'
import { DAY_SHORT } from '../../utils/availability'
import { scopeLabel } from '../../utils/course'
import { formatDate, formatDateTime } from '../../utils/dates'
import { money } from '../../utils/money'
import { Avatar } from '../ui/Avatar'
import { ClassTypeBadge } from '../ui/ClassTypeBadge'
import { LevelBadge } from '../ui/LevelBadge'

const STATUS_LABEL: Record<EnrollmentStatus, { text: string; className: string }> = {
  pending: { text: 'Pendiente', className: 'is-pending' },
  awaiting_payment: { text: 'Por pagar', className: 'is-pending' },
  active: { text: 'Activo', className: 'is-active' },
  rejected: { text: 'Rechazada', className: 'is-closed' },
  cancelled: { text: 'Cancelada', className: 'is-closed' },
  finished: { text: 'Finalizado', className: 'is-closed' },
  expired: { text: 'Vencida', className: 'is-closed' },
}

interface EnrollmentCardProps {
  enrollment: Enrollment
  // Desde qué lado se mira: el estudiante ve al tutor y el tutor ve al estudiante
  viewerRole: 'student' | 'tutor'
  children?: ReactNode
}

export function EnrollmentCard({ enrollment, viewerRole, children }: EnrollmentCardProps) {
  const other = viewerRole === 'student' ? enrollment.tutor : enrollment.student
  const status = STATUS_LABEL[enrollment.status]

  return (
    <article className="surface-card enrollment-card">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div className="d-flex flex-wrap gap-2">
          <span className="badge-soft">{enrollment.offer.category || 'Curso'}</span>
          <LevelBadge level={enrollment.offer.level} />
          <ClassTypeBadge classType={enrollment.offer.classType} maxStudents={enrollment.offer.maxStudents} />
        </div>
        <span className={`enrollment-status ${status.className}`}>{status.text}</span>
      </div>
      <h3 className="h5 mt-2">{enrollment.offer.title}</h3>
      <div className="d-flex align-items-center gap-2 mb-2">
        <Avatar name={other.name} picture={other.picture} size={32} />
        {viewerRole === 'student' ? <Link to={`/tutores/${other.id}`}>{other.name}</Link> : <span>{other.name}</span>}
      </div>
      <p className="text-secondary small mb-2">
        {MODE_LABELS[enrollment.mode]} · {money(enrollment.offer.hourlyRate)}/hora
      </p>
      <p className="small mb-2">
        <i className="bi bi-collection me-1" aria-hidden="true" />
        {scopeLabel(enrollment.offer)}
      </p>
      {enrollment.plan && enrollment.plan.weeklySlots.length > 0 && (
        <p className="small mb-2">
          <i className="bi bi-calendar-week me-1" aria-hidden="true" />
          Cada semana: <strong>{enrollment.plan.weeklySlots.map((slot) => `${DAY_SHORT[slot.day]} ${slot.start}`).join(' · ')}</strong>
          {enrollment.plan.startDate && enrollment.status !== 'active' && <> · desde el {formatDate(enrollment.plan.startDate)}</>}
        </p>
      )}
      {enrollment.plan && enrollment.plan.cycle > 1 && (
        <p className="small mb-2">
          <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
          Bloque {enrollment.plan.cycle} (renovado)
        </p>
      )}
      {enrollment.charge && (
        <p className="offer-card__travel">
          <i className="bi bi-credit-card me-1" aria-hidden="true" />
          {viewerRole === 'student' ? (enrollment.charge.kind === 'renewal' ? 'Renovación por pagar' : 'Pago pendiente') : enrollment.charge.kind === 'renewal' ? 'Renovación esperando pago' : 'Esperando el pago del estudiante'}: <strong>{money(enrollment.charge.total)}</strong> · vence {formatDateTime(enrollment.charge.dueAt)}
        </p>
      )}
      {enrollment.note && <p className="enrollment-card__note">“{enrollment.note}”</p>}
      {enrollment.status === 'rejected' && enrollment.decisionNote && <p className="offer-card__travel is-out">Motivo: {enrollment.decisionNote}</p>}
      {enrollment.status === 'active' && (
        <div className="mb-2">
          <div className="progress course-progress" role="progressbar" aria-label="Clases del curso" aria-valuenow={enrollment.sessionsCompleted} aria-valuemin={0} aria-valuemax={enrollment.offer.totalSessions}>
            <div className="progress-bar" style={{ width: `${Math.min(100, (enrollment.sessionsCompleted / enrollment.offer.totalSessions) * 100)}%` }} />
          </div>
          <small className="text-secondary">
            {enrollment.sessionsCompleted} de {enrollment.offer.totalSessions} realizadas · {enrollment.sessionsUsed} agendadas o realizadas
          </small>
        </div>
      )}
      {enrollment.status === 'active' && (
        <p className="small mb-2">
          <i className="bi bi-calendar-event me-1" aria-hidden="true" />
          {enrollment.nextSession ? <>Próxima clase: <strong>{formatDateTime(enrollment.nextSession)}</strong></> : (viewerRole === 'student' && enrollment.mode !== 'student_home' ? 'Tu tutor agendará tus clases' : viewerRole === 'tutor' && enrollment.mode === 'student_home' ? 'El estudiante elegirá la fecha y hora' : 'Aún sin clases agendadas')}
        </p>
      )}
      {enrollment.status === 'active' && enrollment.mode === 'virtual' && (
        <p className="small mb-2">
          <i className="bi bi-camera-video me-1" aria-hidden="true" />
          {enrollment.meetingUrl ? (
            <a href={enrollment.meetingUrl} target="_blank" rel="noopener noreferrer">
              Enlace de la reunión
            </a>
          ) : (
            'El tutor aún no ha compartido el enlace'
          )}
        </p>
      )}
      {children && <div className="d-flex gap-2 flex-wrap mt-auto pt-3">{children}</div>}
    </article>
  )
}
