import { capitalize, dayKey, formatMonth } from '../../utils/dates'

interface CalendarProps {
  month: Date
  // Cantidad de clases programadas por día (yyyy-mm-dd)
  counts: Record<string, number>
  selected: string
  onSelect: (key: string) => void
  onMonthChange: (month: Date) => void
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Calendario mensual (la semana empieza en lunes) con marcas en los días que tienen clases
export function Calendar({ month, counts, selected, onSelect, onMonthChange }: CalendarProps) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const today = dayKey(new Date())

  const cells: (Date | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))]
  while (cells.length % 7 !== 0) cells.push(null)

  const shift = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1))

  return (
    <div className="calendar surface-card">
      <div className="calendar__head">
        <button type="button" className="calendar__nav" onClick={() => shift(-1)} aria-label="Mes anterior">
          <i className="bi bi-chevron-left" aria-hidden="true" />
        </button>
        <h2 className="h5 mb-0">{capitalize(formatMonth(month))}</h2>
        <button type="button" className="calendar__nav" onClick={() => shift(1)} aria-label="Mes siguiente">
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </div>
      <div className="calendar__grid" role="grid">
        {WEEKDAYS.map((label, index) => (
          <span key={index} className="calendar__weekday" aria-hidden="true">
            {label}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className="calendar__empty" />
          const key = dayKey(date)
          const count = counts[key] ?? 0
          return (
            <button
              key={key}
              type="button"
              className={`calendar__day${key === selected ? ' is-selected' : ''}${key === today ? ' is-today' : ''}${count > 0 ? ' has-classes' : ''}`}
              onClick={() => onSelect(key)}
              aria-label={`${date.getDate()}${count > 0 ? `, ${count} ${count === 1 ? 'clase' : 'clases'}` : ''}`}
              aria-pressed={key === selected}
            >
              {date.getDate()}
              {count > 0 && <span className="calendar__badge">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
