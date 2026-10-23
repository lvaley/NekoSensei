import { CLASS_TYPE_LABELS } from '../../content/classTypes'
import type { ClassType } from '../../types'

interface ClassTypeBadgeProps {
  classType: ClassType
  // Para grupos: cupos totales y cuántos quedan (si se conocen)
  maxStudents?: number
  seatsLeft?: number | null
}

// Etiqueta del tipo de clase: "Individual" o "Grupal · quedan 3 de 8 cupos"
export function ClassTypeBadge({ classType, maxStudents, seatsLeft }: ClassTypeBadgeProps) {
  const isGroup = classType === 'group'
  let detail = ''
  if (isGroup && maxStudents) {
    if (seatsLeft === 0) detail = ' · sin cupos'
    else if (seatsLeft !== null && seatsLeft !== undefined) detail = ` · quedan ${seatsLeft} de ${maxStudents}`
    else detail = ` · hasta ${maxStudents}`
  }
  return (
    <span className={`class-type-badge${isGroup ? ' is-group' : ''}${seatsLeft === 0 ? ' is-full' : ''}`}>
      <i className={`bi ${isGroup ? 'bi-people' : 'bi-person'}`} aria-hidden="true" />
      {CLASS_TYPE_LABELS[classType]}
      {detail}
    </span>
  )
}
