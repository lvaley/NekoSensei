import { Button, Form } from 'react-bootstrap'
import type { AvailabilityWindow } from '../../types'
import { DAY_LONG, DAY_ORDER } from '../../utils/availability'

interface AvailabilityEditorProps {
  value: AvailabilityWindow[]
  onChange: (next: AvailabilityWindow[]) => void
  invalid?: boolean
}

const DEFAULT_WINDOW: AvailabilityWindow = { day: 1, start: '15:00', end: '18:00' }

// Editor de franjas semanales: cada fila es un día con su hora de inicio y fin
export function AvailabilityEditor({ value, onChange, invalid }: AvailabilityEditorProps) {
  const update = (index: number, patch: Partial<AvailabilityWindow>) => onChange(value.map((window, i) => (i === index ? { ...window, ...patch } : window)))

  return (
    <div className={`availability-editor${invalid ? ' is-invalid' : ''}`}>
      {value.length === 0 && <p className="text-secondary small mb-2">Aún no agregas horarios.</p>}
      {value.map((window, index) => (
        <div className="availability-editor__row" key={index}>
          <Form.Select aria-label="Día" value={window.day} onChange={(event) => update(index, { day: Number(event.target.value) })}>
            {DAY_ORDER.map((day) => (
              <option key={day} value={day}>
                {DAY_LONG[day]}
              </option>
            ))}
          </Form.Select>
          <Form.Control aria-label="Hora de inicio" type="time" step={900} value={window.start} onChange={(event) => update(index, { start: event.target.value })} />
          <span aria-hidden="true">a</span>
          <Form.Control aria-label="Hora de fin" type="time" step={900} value={window.end} onChange={(event) => update(index, { end: event.target.value })} />
          <Button variant="outline-danger" size="sm" aria-label="Quitar franja" onClick={() => onChange(value.filter((_, i) => i !== index))}>
            <i className="bi bi-trash" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button variant="outline-dark" size="sm" onClick={() => onChange([...value, value.length > 0 ? { ...(value[value.length - 1] as AvailabilityWindow), day: ((value[value.length - 1] as AvailabilityWindow).day + 1) % 7 } : DEFAULT_WINDOW])}>
        <i className="bi bi-plus-lg me-1" aria-hidden="true" />
        Agregar día y horario
      </Button>
    </div>
  )
}
