import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { CLASS_TYPE_HINTS, CLASS_TYPE_OPTIONS, MAX_GROUP_SIZE, MIN_GROUP_SIZE } from '../content/classTypes'
import { LEVEL_HINTS, LEVEL_OPTIONS } from '../content/levels'
import { MODE_LABELS, MODE_OPTIONS } from '../content/modes'
import { ClassTypeBadge } from '../components/ui/ClassTypeBadge'
import { LevelBadge } from '../components/ui/LevelBadge'
import { AvailabilityEditor } from '../components/ui/AvailabilityEditor'
import { PageHero } from '../components/ui/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { Category, MyOffer, OfferPayload, TeachingMode } from '../types'
import { summarizeAvailability, validateAvailability } from '../utils/availability'
import { classesLabel, courseTotal, formatDuration, scopeLabel } from '../utils/course'
import { money } from '../utils/money'
import { ListSkeleton } from '../components/ui/Skeleton'

const emptyForm = (rate?: number): OfferPayload => ({
  title: '',
  description: '',
  category: '',
  modes: ['virtual'],
  hourlyRate: rate ?? '',
  level: 'basic',
  meetingUrl: '',
  availability: [],
  classType: 'individual',
  maxStudents: '',
  weeks: 4,
  sessionsPerWeek: 2,
  sessionDurationMin: 60,
  travelFeePerKm: '',
  maxTravelKm: '',
  active: true,
})

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function validate(form: OfferPayload): Record<string, string> {
  const errors: Record<string, string> = {}
  if (form.title.trim().length < 5 || form.title.trim().length > 80) errors.title = 'El título debe tener entre 5 y 80 caracteres.'
  if (form.description.trim().length < 20 || form.description.trim().length > 800) errors.description = 'La descripción debe tener entre 20 y 800 caracteres.'
  if (!form.category) errors.category = 'Selecciona una categoría.'
  const weeks = Number(form.weeks)
  if (form.weeks === '' || !Number.isInteger(weeks) || weeks < 1 || weeks > 26) errors.weeks = 'Indica entre 1 y 26 semanas.'
  const perWeek = Number(form.sessionsPerWeek)
  if (form.sessionsPerWeek === '' || !Number.isInteger(perWeek) || perWeek < 1 || perWeek > 7) errors.sessionsPerWeek = 'Indica entre 1 y 7 clases por semana.'
  if (form.modes.length === 0) errors.modes = 'Elige al menos una modalidad.'
  const rate = Number(form.hourlyRate)
  if (form.hourlyRate === '' || rate < 1 || rate > 10000) errors.hourlyRate = 'El precio debe estar entre Q1 y Q10,000.'
  const availabilityError = validateAvailability(form.availability, form.sessionDurationMin)
  if (availabilityError) errors.availability = availabilityError
  if (form.modes.includes('virtual')) {
    const link = form.meetingUrl.trim()
    if (!link) errors.meetingUrl = 'Indica el enlace de la reunión (Meet, Zoom, Teams…).'
    else if (!isWebUrl(link) || link.length > 300) errors.meetingUrl = 'Escribe un enlace válido que empiece con https://'
  }
  if (form.classType === 'group') {
    const seats = Number(form.maxStudents)
    if (form.modes.includes('student_home')) errors.classType = 'Las clases grupales no están disponibles a domicilio.'
    else if (form.maxStudents === '' || !Number.isInteger(seats) || seats < MIN_GROUP_SIZE || seats > MAX_GROUP_SIZE) errors.maxStudents = `Indica entre ${MIN_GROUP_SIZE} y ${MAX_GROUP_SIZE} cupos.`
  }
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
      level: offer.level,
      meetingUrl: offer.meetingUrl,
      availability: offer.availability,
      classType: offer.classType,
      maxStudents: offer.classType === 'group' ? offer.maxStudents : '',
      // Los cursos anteriores sin plan se convierten: una clase por semana durante tantas semanas como clases tenían
      weeks: offer.weeks ?? Math.min(26, offer.totalSessions),
      sessionsPerWeek: offer.sessionsPerWeek ?? 1,
      sessionDurationMin: offer.sessionDurationMin,
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

  // A domicilio es siempre 1 a 1: al elegir esa modalidad la clase pasa a individual
  const toggleMode = (mode: TeachingMode) => {
    const modes = form.modes.includes(mode) ? form.modes.filter((item) => item !== mode) : [...form.modes, mode]
    update(modes.includes('student_home') ? { modes, classType: 'individual', maxStudents: '' } : { modes })
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0 || !editing) return

    setSaving(true)
    const body = { ...form, meetingUrl: form.modes.includes('virtual') ? form.meetingUrl.trim() : '', maxStudents: form.classType === 'group' ? Number(form.maxStudents) : 1, travelFeePerKm: form.modes.includes('student_home') ? Number(form.travelFeePerKm || 0) : 0, maxTravelKm: form.modes.includes('student_home') ? Number(form.maxTravelKm) : 0 }
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

  const planSessions = (Number(form.weeks) || 0) * (Number(form.sessionsPerWeek) || 0)
  const err = (field: string) => errors[field] && <Form.Control.Feedback type="invalid" className="d-block">{errors[field]}</Form.Control.Feedback>

  return (
    <>
      <PageHero eyebrow="Tutor" title="Mis ofertas" subtitle="Convierte tu conocimiento en ingresos: publica tus cursos, fija tu precio y elige cómo enseñar, en línea o a domicilio." />
      <Container className="page-container">
        {!approved && (
          <Alert variant="warning">
            {user?.tutor?.status === 'inactive' ? (
              <>
                <strong>Tu cuenta de tutor está inactiva.</strong> No puedes gestionar ofertas hasta que te reactiven. <Link to="/panel">Solicitar reactivación</Link>
              </>
            ) : (
              <>
                <strong>Tu perfil aún no está aprobado.</strong> Podrás publicar ofertas en cuanto el equipo lo revise. <Link to="/panel">Ver estado</Link>
              </>
            )}
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
        {!offers && !loadError && <ListSkeleton label="Cargando ofertas" />}
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
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge-soft">{offer.category.name}</span>
                    <LevelBadge level={offer.level} />
                    <ClassTypeBadge classType={offer.classType} maxStudents={offer.maxStudents} seatsLeft={offer.classType === 'group' ? Math.max(0, offer.maxStudents - offer.seatsTaken) : null} />
                  </div>
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
                  <strong>{money(offer.hourlyRate)}</strong>/hora · {scopeLabel(offer)}
                </p>
                {offer.availability.length > 0 ? (
                  <p className="offer-card__schedule">
                    <i className="bi bi-clock me-2" aria-hidden="true" />
                    {summarizeAvailability(offer.availability)}
                  </p>
                ) : (
                  <p className="offer-card__travel is-out">
                    <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
                    Define los días y horarios: edita la oferta para agregarlos.
                  </p>
                )}
                {offer.modes.includes('virtual') && !offer.meetingUrl && (
                  <p className="offer-card__travel is-out">
                    <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
                    Falta el enlace de la reunión virtual: edita la oferta para agregarlo.
                  </p>
                )}
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
                <Form.Label>Nivel del curso</Form.Label>
                <div className="chip-list mt-0">
                  {LEVEL_OPTIONS.map((option) => (
                    <button key={option.value} type="button" className={`chip${form.level === option.value ? ' is-active' : ''}`} aria-pressed={form.level === option.value} onClick={() => update({ level: option.value })}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <small className="text-secondary d-block mt-1">{LEVEL_HINTS[form.level]}</small>
              </Col>
              <Col xs={6} md={3}>
                <Form.Label htmlFor="o-weeks">Semanas del plan</Form.Label>
                <Form.Control id="o-weeks" type="number" inputMode="numeric" min={1} max={26} value={form.weeks} onChange={(event) => update({ weeks: event.target.value === '' ? '' : Number(event.target.value) })} isInvalid={!!errors.weeks} />
                {err('weeks')}
              </Col>
              <Col xs={6} md={3}>
                <Form.Label htmlFor="o-perweek">Clases por semana</Form.Label>
                <Form.Control id="o-perweek" type="number" inputMode="numeric" min={1} max={7} value={form.sessionsPerWeek} onChange={(event) => update({ sessionsPerWeek: event.target.value === '' ? '' : Number(event.target.value) })} isInvalid={!!errors.sessionsPerWeek} />
                {err('sessionsPerWeek')}
              </Col>
              <Col xs={6} md={3}>
                <Form.Label htmlFor="o-duration">Duración de cada clase</Form.Label>
                <Form.Select id="o-duration" value={form.sessionDurationMin} onChange={(event) => update({ sessionDurationMin: Number(event.target.value) })}>
                  {[30, 45, 60, 90, 120, 150, 180, 240].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatDuration(minutes)}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={3} className="d-flex align-items-end">
                <p className="offer-card__scope w-100 mb-0">
                  <span>
                    {classesLabel(planSessions)} · {formatDuration(planSessions * form.sessionDurationMin)}
                    <small>{form.hourlyRate === '' ? 'Define el precio por hora' : `Precio del bloque: ${money(courseTotal(Number(form.hourlyRate), planSessions, form.sessionDurationMin))}`}</small>
                  </span>
                </p>
              </Col>
              <Col xs={12}>
                <small className="text-secondary">
                  El estudiante contrata un bloque de {Number(form.weeks) || 0} semanas y elige sus días y horas fijos de cada semana dentro de los horarios de abajo. Paga cuando aceptas su solicitud y las clases se agendan solas. Puede renovar al terminar.
                </small>
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
              <Col xs={12}>
                <Form.Label>Tipo de clase</Form.Label>
                <div className="chip-list mt-0">
                  {CLASS_TYPE_OPTIONS.map((option) => {
                    const blocked = option.value === 'group' && form.modes.includes('student_home')
                    return (
                      <button key={option.value} type="button" className={`chip${form.classType === option.value ? ' is-active' : ''}`} aria-pressed={form.classType === option.value} disabled={blocked} onClick={() => update({ classType: option.value, maxStudents: option.value === 'group' ? form.maxStudents || 5 : '' })}>
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <small className="text-secondary d-block mt-1">
                  {form.modes.includes('student_home') ? 'A domicilio solo se dan clases individuales. Para una clase grupal usa modalidad virtual o en tu casa.' : CLASS_TYPE_HINTS[form.classType]}
                </small>
                {err('classType')}
              </Col>
              {form.classType === 'group' && (
                <Col xs={12} md={6}>
                  <Form.Label htmlFor="o-seats">Cupos del grupo (máx. {MAX_GROUP_SIZE})</Form.Label>
                  <Form.Control id="o-seats" type="number" inputMode="numeric" min={MIN_GROUP_SIZE} max={MAX_GROUP_SIZE} value={form.maxStudents} onChange={(event) => update({ maxStudents: event.target.value === '' ? '' : Number(event.target.value) })} isInvalid={!!errors.maxStudents} />
                  {err('maxStudents')}
                </Col>
              )}
              <Col xs={12}>
                <Form.Label>Días y horarios en que impartes el curso</Form.Label>
                <AvailabilityEditor value={form.availability} onChange={(availability) => update({ availability })} invalid={!!errors.availability} />
                <small className="text-secondary d-block mt-1">
                  Las clases solo se podrán agendar dentro de estas franjas (hora de Guatemala).
                  {form.modes.includes('student_home') && ' A domicilio, el estudiante elige fecha y hora, y solo verá horarios que dejen tiempo de traslado entre tus clases.'}
                </small>
                {err('availability')}
              </Col>
              {form.modes.includes('virtual') && (
                <Col xs={12}>
                  <Form.Label htmlFor="o-link">Enlace de la reunión virtual</Form.Label>
                  <Form.Control id="o-link" type="url" inputMode="url" maxLength={300} value={form.meetingUrl} onChange={(event) => update({ meetingUrl: event.target.value })} isInvalid={!!errors.meetingUrl} placeholder="https://meet.google.com/abc-defg-hij" />
                  <small className="text-secondary d-block mt-1">Solo lo verán tus estudiantes con inscripción activa, no es público.</small>
                  {err('meetingUrl')}
                </Col>
              )}
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
