import type { CourseLevel } from '../types'

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  basic: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

// Para quién está pensado cada nivel (se muestra como ayuda al crear la oferta)
export const LEVEL_HINTS: Record<CourseLevel, string> = {
  basic: 'Para quien empieza desde cero.',
  intermediate: 'Para quien ya domina lo básico.',
  advanced: 'Para quien busca profundizar o perfeccionarse.',
}

export const LEVEL_ORDER: CourseLevel[] = ['basic', 'intermediate', 'advanced']

export const LEVEL_OPTIONS = LEVEL_ORDER.map((value) => ({ value, label: LEVEL_LABELS[value] }))
