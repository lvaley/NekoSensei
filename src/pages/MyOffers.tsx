import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { MODE_LABELS, MODE_OPTIONS } from '../content/modes'
import { PageHero } from '../components/ui/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { Category, MyOffer, OfferPayload, TeachingMode } from '../types'
import { money } from '../utils/money'

const emptyForm = (rate?: number): OfferPayload => ({
  title: '',
  description: '',
  category: '',
  modes: ['virtual'],
  hourlyRate: rate ?? '',
  travelFeePerKm: '',
  maxTravelKm: '',
  active: true,
})

function validate(form: OfferPayload): Record<string, string> {
  const errors: Record<string, string> = {}
  if (form.title.trim().length < 5 || form.title.trim().length > 80) errors.title = 'El título debe tener entre 5 y 80 caracteres.'
  if (form.description.trim().length < 20 || form.description.trim().length > 800) errors.description = 'La descripción debe tener entre 20 y 800 caracteres.'
  if (!form.category) errors.category = 'Selecciona una categoría.'
  if (form.modes.length === 0) errors.modes = 'Elige al menos una modalidad.'
  const rate = Number(form.hourlyRate)
  if (form.hourlyRate === '' || rate < 1 || rate > 10000) errors.hourlyRate = 'El precio debe estar entre Q1 y Q10,000.'
  if (form.modes.includes('student_home')) {
    const km = Number(form.maxTravelKm)
    const fee = Number(form.travelFeePerKm || 0)
    if (form.maxTravelKm === '' || km < 1 || km > 100) errors.maxTravelKm = 'Indica una distancia entre 1 y 100 km.'
    if (fee < 0 || fee > 100) errors.travelFeePerKm = 'La tarifa debe estar entre Q0 y Q100.'
  }
  return errors
}

export function MyOffers() {
  useDocumentTitle('Mis ofertas')
  const { user } = useAuth()
  const approved = user?.tutor?.status === 'approved'

  const [offers, setOffers] = useState<MyOffer[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadError, setLoadError] = useState(false)
  const [editing, setEditing] = useState<{ id: string | null } | null>(null)
  const [form, setForm] = useState<OfferPayload>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<MyOffer | null>(null)

  const load = useCallback(() => {
    api
      .get<{ offers: MyOffer[] }>('/my/offers')
      .then((res) => setOffers(res.data.offers))
      .catch(() => setLoadError(true))
  }, [])

  useEffect(() => {
    load()
    api
      .get<{ categories: Category[] }>('/public/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => undefined)
  }, [load])

  const openNew = () => {
    setForm(emptyForm(user?.tutor?.hourlyRate))
    setErrors({})
    setEditing({ id: null })
  }

  const openEdit = (offer: MyOffer) => {
    setForm({
      title: offer.title,
      description: offer.description,
      category: offer.category.id,
      modes: offer.modes,
      hourlyRate: offer.hourlyRate,
      travelFeePerKm: offer.travelFeePerKm || '',
      maxTravelKm: offer.maxTravelKm || '',
      active: offer.active,
    })
    setErrors({})
    setEditing({ id: offer.id })
  }

  const update = (patch: Partial<OfferPayload>) => {
    setForm((previous) => ({ ...previous, ...patch }))
    // Al corregir un campo se quita su mensaje de error
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in patch) && key !== 'form')))
  }

  const toggleMode = (mode: TeachingMode) =>
    update({ modes: form.modes.includes(mode) ? form.modes.filter((item) => item !== mode) : [...form.modes, mode] })

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0 || !editing) return

    setSaving(true)
    const body = { ...form, travelFeePerKm: form.modes.includes('student_home') ? Number(form.travelFeePerKm || 0) : 0, maxTravelKm: form.modes.includes('student_home') ? Number(form.maxTravelKm) : 0 }
    try {
      if (editing.id) await api.put(`/my/offers/${editing.id}`, body)
      else await api.post('/my/offers', body)
      setEditing(null)
      load()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) setErrors(error.response.data.errors)
      else setErrors({ form: axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : 'No pudimos guardar la oferta.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (offer: MyOffer) => {
    await api.put(`/my/offers/${offer.id}`, { ...offer, category: offer.category.id, active: !offer.active }).catch(() => undefined)
    load()
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    await api.delete(`/my/offers/${toDelete.id}`).catch(() => undefined)
    setToDelete(null)
    load()
  }

  const err = (field: string) => errors[field] && <Form.Control.Feedback type="invalid" className="d-block">{errors[field]}</Form.Control.Feedback>

  return (
    <>
      <PageHero eyebrow="Tutor" title="Mis ofertas" subtitle="Publica los cursos que ofreces: precio, modalidades y si viajas a domicilio." />
      <Container className="page-container">
        {!approved && (
          <Alert variant="warning">
            <strong>Tu perfil aún no está aprobado.</strong> Podrás publicar ofertas en cuanto el equipo lo revise. <Link to="/panel">Ver estado</Link>
          </Alert>
        )}
        {approved && (
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <p className="text-secondary mb-0">{offers ? `${offers.length} de 30 ofertas` : ''}</p>
            <Button variant="primary" onClick={openNew}>
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />
              Nueva oferta
            </Button>
          </div>
        )}
        {loadError && <Alert variant="danger">No pudimos cargar tus ofertas.</Alert>}
        {!offers && !loadError && <Spinner animation="border" role="status" aria-label="Cargando ofertas" className="d-block mx-auto my-5" />}
        {offers && offers.length === 0 && approved && (
          <div className="surface-card text-center">
            <h2 className="h5">Aún no tienes ofertas</h2>
            <p className="text-secondary mb-3">Crea tu primer curso para aparecer en las búsquedas de los estudiantes.</p>
            <Button variant="primary" onClick={openNew}>
              Crear mi primera oferta
            </Button>
          </div>
        )}
        <Row className="g-4">
          {offers?.map((offer) => (
            <Col md={6} key={offer.id}>
              <article className={`surface-card offer-card${offer.active ? '' : ' is-inactive'}`}>
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <span className="badge-soft">{offer.category.name}</span>
                  <span className={`status-dot ${offer.active ? 'is-on' : ''}`}>{offer.active ? 'Publicada' : 'Oculta'}</span>
                </div>
                <h2 className="h5 mt-2">{offer.title}</h2>
                <p className="text-secondary">{offer.description}</p>
                <div className="mode-list mb-2">
                  {offer.modes.map((mode) => (
                    <span key={mode} className="mode-pill">
                      {MODE_LABELS[mode]}
                    </span>
                  ))}
                </div>
                <p className="mb-1">
                  <strong>{money(offer.hourlyRate)}</strong>/hora
                </p>
                {offer.modes.includes('student_home') && (
                  <p className="offer-card__travel">
                    A domicilio: {money(offer.travelFeePerKm)} por km, hasta {offer.maxTravelKm} km
                  </p>
                )}
                <div className="d-flex gap-2 flex-wrap mt-3">
                  <Button size="sm" variant="outline-dark" onClick={() => openEdit(offer)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => toggleActive(offer)}>
                    {offer.active ? 'Ocultar' : 'Publicar'}
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => setToDelete(offer)}>
                    Eliminar
                  </Button>
                </div>
              </article>
            </Col>
          ))}
        </Row>
      </Container>

      <Modal show={!!editing} onHide={() => setEditing(null)} size="lg" centered backdrop="static">
        <Form onSubmit={onSubmit} noValidate>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5">
              {editing?.id ? 'Editar oferta' : 'Nueva oferta'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {errors.form && <Alert variant="danger">{errors.form}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label htmlFor="o-title">Título</Form.Label>
                <Form.Control id="o-title" value={form.title} onChange={(event) => update({ title: event.target.value })} maxLength={80} isInvalid={!!errors.title} placeholder="Ej. Inglés conversacional para principiantes" />
                {err('title')}
              </Col>
              <Col xs={12}>
                <Form.Label htmlFor="o-desc">Descripción</Form.Label>
                <Form.Control id="o-desc" as="textarea" rows={4} value={form.description} onChange={(event) => update({ description: event.target.value })} maxLength={800} isInvalid={!!errors.description} placeholder="Qué aprenderá el estudiante, nivel, material…" />
                {err('description')}
              </Col>
              <Col md={7}>
                <Form.Label htmlFor="o-cat">Categoría</Form.Label>
                <Form.Select id="o-cat" value={form.category} onChange={(event) => update({ category: event.target.value })} isInvalid={!!errors.category}>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((parent) => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name} (general)</option>
                      {parent.children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Form.Select>
                {err('category')}
              </Col>
              <Col md={5}>
                <Form.Label htmlFor="o-rate">Precio por hora (Q)</Form.Label>
                <Form.Control id="o-rate" type="number" inputMode="numeric" min={1} value={form.hourlyRate} onChange={(event) => update({ hourlyRate: event.target.value === '' ? '' : Number(event.target.value) })} isInvalid={!!errors.hourlyRate} />
                {err('hourlyRate')}
              </Col>
              <Col xs={12}>
                <Form.Label>Modalidades</Form.Label>
                <div className="chip-list mt-0">
                  {MODE_OPTIONS.map((option) => (
                    <button key={option.value} type="button" className={`chip${form.modes.includes(option.value) ? ' is-active' : ''}`} aria-pressed={form.modes.includes(option.value)} onClick={() => toggleMode(option.value)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                {err('modes')}
              </Col>
              {form.modes.includes('student_home') && (
                <>
                  <Col xs={6}>
                    <Form.Label htmlFor="o-fee">Tarifa de traslado (Q por km)</Form.Label>
                    <Form.Control id="o-fee" type="number" inputMode="decimal" min={0} step="0.5" value={form.travelFeePerKm} onChange={(event) => update({ travelFeePerKm: event.target.value === '' ? '' : Number(event.target.value) })} isInvalid={!!errors.travelFeePerKm} placeholder="0 si no cobras" />
                    {err('travelFeePerKm')}
                  </Col>
                  <Col xs={6}>
                    <Form.Label htmlFor="o-km">Distancia máxima (km)</Form.Label>
                    <Form.Control id="o-km" type="number" inputMode="numeric" min={1} value={form.maxTravelKm} onChange={(event) => update({ maxTravelKm: event.target.value === '' ? '' : Number(event.target.value) })} isInvalid={!!errors.maxTravelKm} />
                    {err('maxTravelKm')}
                  </Col>
                  <Col xs={12}>
                    <small className="text-secondary">El estudiante verá la distancia desde tu ubicación y el traslado estimado (km × tarifa) solo si está dentro de tu alcance.</small>
                  </Col>
                </>
              )}
              <Col xs={12}>
                <Form.Check id="o-active" type="switch" label="Publicada (visible en las búsquedas)" checked={form.active} onChange={(event) => update({ active: event.target.checked })} />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar oferta'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!toDelete} onHide={() => setToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Eliminar oferta
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Eliminar <strong>{toDelete?.title}</strong>? Esta acción no se puede deshacer. Si solo quieres dejar de mostrarla, usa "Ocultar".
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
