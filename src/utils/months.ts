// "2026-10" → "oct 26" (etiqueta corta para los ejes de las gráficas)
export function monthShort(key: string): string {
  const [year = 0, month = 1] = key.split('-').map(Number)
  const label = new Date(year, month - 1, 1).toLocaleDateString('es-GT', { month: 'short' }).replace('.', '')
  return `${label} ${String(year).slice(2)}`
}

// "2026-10" → "octubre de 2026"
export function monthLong(key: string): string {
  const [year = 0, month = 1] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })
}

// Mes actual en hora de Guatemala (UTC−6), igual que el servidor
export function currentMonthKey(): string {
  const now = new Date(Date.now() - 6 * 3_600_000)
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}
