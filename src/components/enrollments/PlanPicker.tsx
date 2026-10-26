import axios from 'axios'
import { useEffect, useState } from 'react'
import { Alert, Form, Spinner } from 'react-bootstrap'
import { api } from '../../services/api'
import type { PlanSlotsResponse, PublicOffer, TeachingMode, WeeklySlot } from '../../types'
import { DAY_LONG, DAY_SHORT } from '../../utils/availability'
import { classesLabel } from '../../utils/course'
import { localDateString, tomorrow } from '../../utils/dates'
import { money } from '../../utils/money'

export interface PlanChoice {
  startDate: string
  slots: Array<WeeklySlot | null>
}


// Primera y última fecha de clase del plan (cada día elegido, a partir de la fecha de inicio)
function span(startDate: string, weeks: number, slots: WeeklySlot[]): { first: Date; last: Date } | null {
  if (slots.length === 0) return null
  const [y, m, d] = startDate.split('-').map(Number) as [number, number, number]
  const base = new Date(y, m - 1, d)
  const dates = slots.map((slot) => {
    const offset = (slot.day - base.getDay() + 7) % 7
    return new Date(y, m - 1, d + offset)
  })
  const first = new Date(Math.min(...dates.map((item) => item.getTime())))
  const last = new Date(Math.max(...dates.map((item) => item.getTime())))
  last.setDate(last.getDate() + (weeks - 1) * 7)
  return { first, last }
}

const fmt = (date: Date) => date.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })

interface PlanPickerProps {
  offer: PublicOffer
  mode: TeachingMode
  // Los horarios fijos solo se eligen en clases individuales con franjas definidas
  needsSlots: boolean
  value: PlanChoice
  onChange: (value: PlanChoice) => void
}

// Plan de un curso: fecha de inicio, días y horas fijos de cada semana, y el precio del bloque
export function PlanPicker({ offer, mode, needsSlots, value, onChange }: PlanPickerProps) {
  const [limits] = useState(() => ({ min: tomorrow(), max: localDateString(new Date(Date.now() + 60 * 86_400_000)) }))
  const key = `${offer.id}|${mode}|${value.startDate}`
  const [result, setResult] = useState<{ key: string; data?: PlanSlotsResponse; error?: string } | null>(null)

  useEffect(() => {
    let active = true
    api
      .get<PlanSlotsResponse>(`/offers/${offer.id}/plan-slots`, { params: { mode, startDate: value.startDate } })
      .then((res) => active && setResult({ key, data: res.data }))
      .catch((err) => active && setResult({ key, error: axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos cargar los horarios.' }))
    return () => {
      active = false
    }
  }, [key, offer.id, mode, value.startDate])

  const ready = result?.key === key ? result : null
  const data = ready?.data
  const chosen = value.slots.filter((slot): slot is WeeklySlot => slot !== null)
  const range = data && offer.weeks && chosen.length === value.slots.length ? span(value.startDate, offer.weeks, chosen) : null

  const setSlot = (index: number, raw: string) => {
    const slots = [...value.slots]
    if (!raw) slots[index] = null
    else {
      const [day, start] = raw.split('|') as [string, string]
      slots[index] = { day: Number(day), start }
    }
    onChange({ ...value, slots })
  }

  return (
    <div className="d-grid gap-3">
      {needsSlots && (
        <>
          <div>
            <Form.Label htmlFor={`start-${offer.id}`}>Fecha de inicio</Form.Label>
            <Form.Control id={`start-${offer.id}`} type="date" min={limits.min} max={limits.max} value={value.startDate} onChange={(event) => event.target.value && onChange({ startDate: event.target.value, slots: value.slots.map(() => null) })} />
          </div>

          {!ready && (
            <div className="text-center py-2">
              <Spinner animation="border" size="sm" /> Buscando horarios libres…
            </div>
          )}
          {ready?.error && <Alert variant="warning" className="mb-0">{ready.error}</Alert>}
          {data && (
            <div className="d-grid gap-2">
              <Form.Label className="mb-0">
                Elige tus {offer.sessionsPerWeek === 1 ? 'día y hora fijos' : `${offer.sessionsPerWeek} días y horas fijos`} de cada semana
              </Form.Label>
              {data.days.length === 0 && <Alert variant="warning" className="mb-0">No hay horarios libres desde esa fecha. Prueba con otra fecha de inicio.</Alert>}
              {value.slots.map((slot, index) => {
                const taken = new Set(value.slots.filter((item, i) => item && i !== index).map((item) => `${(item as WeeklySlot).day}|${(item as WeeklySlot).start}`))
                return (
                  <Form.Select key={index} aria-label={`Horario fijo ${index + 1}`} value={slot ? `${slot.day}|${slot.start}` : ''} onChange={(event) => setSlot(index, event.target.value)}>
                    <option value="">Horario {index + 1}…</option>
                    {data.days.map((entry) => (
                      <optgroup key={entry.day} label={DAY_LONG[entry.day]}>
                        {entry.starts.map((start) => (
                          <option key={start} value={`${entry.day}|${start}`} disabled={taken.has(`${entry.day}|${start}`)}>
                            {DAY_SHORT[entry.day]} {start}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Form.Select>
                )
              })}
              {range && (
                <small className="text-secondary">
                  Tu primera clase sería el <strong>{fmt(range.first)}</strong> y la última el <strong>{fmt(range.last)}</strong>.
                </small>
              )}
            </div>
          )}
        </>
      )}

      {data && (
        <div className="surface-card p-3">
          <div className="d-flex justify-content-between"><span>{classesLabel(data.quote.sessions)}</span><strong>{money(data.quote.classes)}</strong></div>
          {data.quote.travel > 0 && <div className="d-flex justify-content-between"><span>Traslado</span><strong>{money(data.quote.travel)}</strong></div>}
          <div className="d-flex justify-content-between border-top mt-2 pt-2"><span>Total del bloque</span><strong>{money(data.quote.total)}</strong></div>
          <small className="text-secondary d-block mt-2">No pagas ahora: cuando el tutor acepte tendrás 48 horas para pagar y tus clases se agendarán solas.</small>
        </div>
      )}
    </div>
  )
}
