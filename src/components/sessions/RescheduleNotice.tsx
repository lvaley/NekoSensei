import type { Reschedule } from '../../types'
import { formatDateTime } from '../../utils/dates'

interface RescheduleNoticeProps {
  reschedule: Reschedule
  viewerRole: 'student' | 'tutor'
}

// Estado de una solicitud de reagendar, redactado según quién la mira
export function RescheduleNotice({ reschedule, viewerRole }: RescheduleNoticeProps) {
  const isStudent = viewerRole === 'student'
  const proposed = reschedule.proposedStart ? formatDateTime(reschedule.proposedStart) : ''
  let tone = 'is-waiting'
  let text: string

  switch (reschedule.status) {
    case 'requested':
      text = isStudent ? 'Pediste reagendar esta clase. Esperando la respuesta del tutor.' : 'El estudiante pide reagendar esta clase.'
      break
    case 'proposed':
      text = isStudent ? `El tutor propone moverla a: ${proposed}.` : `Propusiste moverla a: ${proposed}. Esperando la respuesta del estudiante.`
      tone = isStudent ? 'is-action' : 'is-waiting'
      break
    case 'declined':
      text = isStudent ? 'El tutor no pudo reagendar la clase: se mantiene el horario original.' : 'Rechazaste la solicitud: la clase se mantiene.'
      tone = 'is-closed'
      break
    default:
      text = isStudent ? 'Rechazaste la propuesta: la clase se mantiene en su horario.' : 'El estudiante rechazó tu propuesta: la clase se mantiene.'
      tone = 'is-closed'
  }

  return (
    <div className={`reschedule-notice ${tone}`}>
      <strong>
        <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
        {text}
      </strong>
      {(reschedule.status === 'requested' || (reschedule.status === 'proposed' && !isStudent) || reschedule.status === 'rejected' || (reschedule.status === 'declined' && !isStudent)) && reschedule.reason && (
        <small>Motivo del estudiante: “{reschedule.reason}”</small>
      )}
      {reschedule.tutorNote && <small>Nota del tutor: “{reschedule.tutorNote}”</small>}
    </div>
  )
}
