export const CONTACT_SUBJECTS = [
  { value: 'consulta', label: 'Consulta general' },
  { value: 'soporte', label: 'Soporte técnico' },
  { value: 'tutor', label: 'Quiero ser tutor' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'otro', label: 'Otro' },
]

export const CONTACT_LIMITS = { nameMin: 2, nameMax: 80, messageMin: 10, messageMax: 2000 }

// Información útil mostrada junto al formulario (ajustar a los datos reales)
export const CONTACT_INFO = [
  { icon: 'bi-clock', title: 'Tiempo de respuesta', text: 'Respondemos en un máximo de 24 horas hábiles.' },
  { icon: 'bi-calendar-week', title: 'Horario de atención', text: 'Lunes a viernes, de 8:00 a 18:00 (hora de Guatemala).' },
]
