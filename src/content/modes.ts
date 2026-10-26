import type { TeachingMode } from '../types'

export const MODE_LABELS: Record<TeachingMode, string> = {
  virtual: 'Virtual',
  tutor_home: 'En casa del tutor',
  student_home: 'A domicilio',
}

export const MODE_OPTIONS = (Object.keys(MODE_LABELS) as TeachingMode[]).map((value) => ({ value, label: MODE_LABELS[value] }))
