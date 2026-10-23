const LOCALE = 'es-GT'

// Clave de día en hora local (yyyy-mm-dd) para agrupar clases en el calendario
export function dayKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const formatTime = (value: string | Date) => new Date(value).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false })

export const formatDate = (value: string | Date) => new Date(value).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })

export const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

export const formatMonth = (value: Date) => value.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })

// Solo la primera letra en mayúscula ("octubre de 2026" → "Octubre de 2026")
export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

// "hace 5 min", "hace 3 h", "hace 2 d"
export function timeAgo(value: string | Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  if (minutes < 1440) return `hace ${Math.floor(minutes / 60)} h`
  return `hace ${Math.floor(minutes / 1440)} d`
}

const pad = (value: number) => String(value).padStart(2, '0')
// yyyy-mm-dd en hora local, el formato de <input type="date">
export const localDateString = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const tomorrow = () => localDateString(new Date(Date.now() + 86_400_000))
