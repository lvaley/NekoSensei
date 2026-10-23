// "60" → "1 h", "90" → "1 h 30 min", "45" → "45 min"
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export const classesLabel = (total: number) => `${total} ${total === 1 ? 'clase' : 'clases'}`

// Resumen del alcance de un curso: "5 clases de 1 h · 5 h en total"
export function courseScope(totalSessions: number, sessionDurationMin: number): string {
  const base = `${classesLabel(totalSessions)} de ${formatDuration(sessionDurationMin)}`
  return totalSessions > 1 ? `${base} · ${formatDuration(totalSessions * sessionDurationMin)} en total` : base
}

// Costo estimado del curso completo (sin traslado): precio por hora × horas totales
export const courseTotal = (hourlyRate: number, totalSessions: number, sessionDurationMin: number) => (hourlyRate * totalSessions * sessionDurationMin) / 60

interface ScopeInfo {
  weeks?: number | null
  sessionsPerWeek?: number | null
  totalSessions: number
  sessionDurationMin: number
}

export const weeksLabel = (total: number) => `${total} ${total === 1 ? 'semana' : 'semanas'}`

// Alcance de un curso: con plan, "4 semanas · 2 clases por semana de 1 h · 8 clases (8 h en total)"; sin plan, el resumen de siempre
export function scopeLabel(info: ScopeInfo): string {
  if (!info.weeks || !info.sessionsPerWeek) return courseScope(info.totalSessions, info.sessionDurationMin)
  const perWeek = `${classesLabel(info.sessionsPerWeek)} por semana de ${formatDuration(info.sessionDurationMin)}`
  return `${weeksLabel(info.weeks)} · ${perWeek} · ${classesLabel(info.totalSessions)} (${formatDuration(info.totalSessions * info.sessionDurationMin)} en total)`
}
