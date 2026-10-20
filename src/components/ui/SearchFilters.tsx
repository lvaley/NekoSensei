import { useEffect, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { MODE_OPTIONS } from '../../content/modes'
import { api } from '../../services/api'
import type { Category } from '../../types'

interface SearchFiltersProps {
  params: URLSearchParams
  onChange: (next: URLSearchParams) => void
  // Muestra el filtro de distancia (solo si se conoce la dirección de la persona)
  showDistance: boolean
  total?: number
}

// Barra de filtros del catálogo. El estado vive en la URL (?q=&category=&mode=&maxPrice=&maxKm=)
export function SearchFilters({ params, onChange, showDistance, total }: SearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [text, setText] = useState(params.get('q') ?? '')
  const urlText = params.get('q') ?? ''

  useEffect(() => {
    api
      .get<{ categories: Category[] }>('/public/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => undefined)
  }, [])

  // Escribir en el buscador actualiza la URL con una pequeña pausa para no consultar en cada tecla
  useEffect(() => {
    if (text.trim() === urlText) return
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params)
      if (text.trim()) next.set('q', text.trim())
      else next.delete('q')
      onChange(next)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [text, urlText, params, onChange])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    onChange(next)
  }

  const hasFilters = ['q', 'category', 'mode', 'maxPrice', 'maxKm'].some((key) => params.has(key))
  const clear = () => {
    setText('')
    onChange(new URLSearchParams())
  }

  return (
    <div className="surface-card filter-bar">
      <Row className="g-3">
        <Col lg={showDistance ? 3 : 4}>
          <Form.Label htmlFor="f-q">Buscar</Form.Label>
          <Form.Control id="f-q" type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Inglés, matemática, nombre del tutor…" />
        </Col>
        <Col sm={6} lg={showDistance ? 2 : 3}>
          <Form.Label htmlFor="f-category">Categoría</Form.Label>
          <Form.Select id="f-category" value={params.get('category') ?? ''} onChange={(event) => setParam('category', event.target.value)}>
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col sm={6} lg={2}>
          <Form.Label htmlFor="f-mode">Modalidad</Form.Label>
          <Form.Select id="f-mode" value={params.get('mode') ?? ''} onChange={(event) => setParam('mode', event.target.value)}>
            <option value="">Todas</option>
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} lg={showDistance ? 2 : 3}>
          <Form.Label htmlFor="f-price">Precio máx. (Q)</Form.Label>
          <Form.Control
            id="f-price"
            type="number"
            inputMode="numeric"
            min={1}
            value={params.get('maxPrice') ?? ''}
            onChange={(event) => setParam('maxPrice', event.target.value)}
            placeholder="Sin límite"
          />
        </Col>
        {showDistance && (
          <Col xs={6} lg={3}>
            <Form.Label htmlFor="f-km">Distancia máx. (km)</Form.Label>
            <Form.Control id="f-km" type="number" inputMode="numeric" min={1} value={params.get('maxKm') ?? ''} onChange={(event) => setParam('maxKm', event.target.value)} placeholder="Sin límite" />
          </Col>
        )}
      </Row>
      <div className="filter-bar__footer">
        <small className="text-secondary">{total === undefined ? 'Buscando…' : `${total} resultado${total === 1 ? '' : 's'}`}</small>
        {hasFilters && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={clear}>
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
