import type { ClassType } from '../types'

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  individual: 'Individual',
  group: 'Grupal',
}

export const CLASS_TYPE_HINTS: Record<ClassType, string> = {
  individual: 'Un estudiante por inscripción, clases 1 a 1.',
  group: 'Varios estudiantes comparten las mismas clases. Tú defines los cupos.',
}

export const CLASS_TYPE_OPTIONS = (Object.keys(CLASS_TYPE_LABELS) as ClassType[]).map((value) => ({ value, label: CLASS_TYPE_LABELS[value] }))

export const MIN_GROUP_SIZE = 2
export const MAX_GROUP_SIZE = 20
