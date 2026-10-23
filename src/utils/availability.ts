import type { AvailabilityWindow } from '../types'
import { formatDuration } from './course'

// Orden de la semana para mostrar: lunes a domingo (el número del día es 0 = domingo)
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const DAY_SHORT: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' }
export const DAY_LONG: Record<number, string> = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' }

export const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

// Días seguidos se acortan: [1,2,3,4,5] → "Lun–Vie"
function dayRuns(days: number[]): string {
  const ordered = DAY_ORDER.filter((day) => days.includes(day))
  const runs: number[][] = []
  for (const day of ordered) {
    const last = runs[runs.length - 1]
    if (last && DAY_ORDER.indexOf(day) === DAY_ORDER.indexOf(last[last.length - 1] as number) + 1) last.push(day)
    else runs.push([day])
  }
  return runs.map((run) => (run.length >= 3 ? `${DAY_SHORT[run[0] as number]}–${DAY_SHORT[run[run.length - 1] as number]}` : run.map((day) => DAY_SHORT[day]).join(', '))).join(', ')
}

// Resumen legible: "Lun–Vie 15:00–18:00 · Sáb 09:00–12:00"
export function summarizeAvailability(windows: AvailabilityWindow[]): string {
  const byRange = new Map<string, number[]>()
  for (const window of [...windows].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))) {
    const key = `${window.start}–${window.end}`
    byRange.set(key, [...(byRange.get(key) ?? []), window.day])
  }
  return [...byRange.entries()].map(([range, days]) => `${dayRuns(days)} ${range}`).join(' · ')
}

// Mismas reglas que el servidor: al menos una franja, sin solaparse y con espacio para una clase
export function validateAvailability(windows: AvailabilityWindow[], sessionDurationMin: number): string | null {
  if (windows.length === 0) return 'Agrega al menos un día y horario en que impartes el curso.'
  for (const window of windows) {
    if (!window.start || !window.end) return 'Completa la hora de inicio y fin de cada franja.'
    if (toMinutes(window.start) % 15 !== 0 || toMinutes(window.end) % 15 !== 0) return 'Las horas deben ser en bloques de 15 minutos.'
    if (toMinutes(window.end) - toMinutes(window.start) < sessionDurationMin) return `Cada franja debe durar al menos lo que una clase (${formatDuration(sessionDurationMin)}).`
  }
  const sorted = [...windows].sort((a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start))
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1] as AvailabilityWindow
    const current = sorted[i] as AvailabilityWindow
    if (current.day === previous.day && toMinutes(current.start) < toMinutes(previous.end)) return 'Hay franjas del mismo día que se solapan.'
  }
  return null
}
