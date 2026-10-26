import axios from 'axios'
import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Alert, Col, Form, Row, Spinner } from 'react-bootstrap'
import { LocationPicker } from '../ui/LocationPicker'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import type { AuthUser, Category, Gender, ProfileErrors, ProfilePayload } from '../../types'

interface ProfileFormProps {
  // onboarding: primer ingreso (el rol se elige aquí) · edit: el rol ya no se puede cambiar
  mode: 'onboarding' | 'edit'
  onSaved: () => void
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]

const MAX_PDF_BYTES = 2 * 1024 * 1024

function initialForm(user: AuthUser): ProfilePayload {
  return {
    role: user.role === 'tutor' ? 'tutor' : 'student',
    phone: user.phone ?? '',
    gender: user.gender ?? '',
    documentId: user.documentId ?? '',
    address: { text: user.address?.text ?? '', lat: user.address?.lat ?? null, lng: user.address?.lng ?? null },
    categories: user.categories,
    bio: user.tutor?.bio ?? '',
    hourlyRate: user.tutor?.hourlyRate ?? '',
    portfolioUrl: user.tutor?.portfolioUrl ?? '',
    cvFile: null,
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

export function ProfileForm({ mode, onSaved }: ProfileFormProps) {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState<ProfilePayload | null>(() => (user ? initialForm(user) : null))
  const [catalog, setCatalog] = useState<Category[] | null>(null)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<{ categories: Category[] }>('/categories')
      .then((res) => {
        if (!cancelled) setCatalog(res.data.categories)
      })
      .catch(() => {
        if (!cancelled) setCatalog([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!user || !form) return null

  const isTutor = form.role === 'tutor'

  const update = (changes: Partial<ProfilePayload>, ...errorKeys: string[]) => {
    setForm((current) => (current ? { ...current, ...changes } : current))
    if (errorKeys.length > 0) {
      setErrors((current) => {
        const next = { ...current }
        errorKeys.forEach((key) => delete next[key])
        return next
      })
    }
  }

  const onField =
    (field: keyof ProfilePayload) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      update({ [field]: event.target.value } as Partial<ProfilePayload>, field)

  // Solo permite dígitos y corta al largo exigido (teléfono: 8, DPI: 13)
  const onDigits = (field: 'phone' | 'documentId', length: number) => (event: ChangeEvent<HTMLInputElement>) =>
    update({ [field]: event.target.value.replace(/\D/g, '').slice(0, length) } as Partial<ProfilePayload>, field)

  const toggleCategory = (id: string) => {
    const selected = form.categories.includes(id)
    update({ categories: selected ? form.categories.filter((item) => item !== id) : [...form.categories, id] }, 'categories')
  }

  const onPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setErrors((current) => ({ ...current, cvFile: 'El archivo debe ser un PDF.' }))
      return
    }
    if (file.size > MAX_PDF_BYTES) {
      setErrors((current) => ({ ...current, cvFile: 'El PDF no debe superar los 2 MB.' }))
      return
    }
    update({ cvFile: { name: file.name, data: await readAsDataUrl(file) } }, 'cvFile', 'cv')
  }

  const validate = (): ProfileErrors => {
    const found: ProfileErrors = {}
    if (!/^\d{8}$/.test(form.phone)) found.phone = 'El teléfono debe tener exactamente 8 dígitos.'
    if (!form.gender) found.gender = 'Selecciona una opción.'
    if (!/^\d{13}$/.test(form.documentId)) found.documentId = 'El DPI debe tener exactamente 13 dígitos.'
    if (form.address.text.trim().length < 5) found.addressText = 'Escribe tu dirección.'
    if (form.address.lat === null || form.address.lng === null) found.location = 'Marca tu ubicación en el mapa.'
    if (form.categories.length < 1) found.categories = 'Elige al menos una categoría de interés.'
    if (isTutor) {
      if ((form.bio ?? '').trim().length < 30) found.bio = 'Cuéntanos un poco más (mínimo 30 caracteres).'
      const rate = Number(form.hourlyRate)
      if (!form.hourlyRate || !Number.isFinite(rate) || rate < 1) found.hourlyRate = 'Indica tu tarifa por hora.'
      if (!form.portfolioUrl?.trim() && !form.cvFile && !user.tutor?.hasCvFile) {
        found.cv = 'Adjunta tu hoja de vida en PDF o un enlace a tu portafolio.'
      }
    }
    return found
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    setFailed(false)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      const payload = mode === 'onboarding' ? form : { ...form, role: undefined }
      const { data } = await api.put<{ user: AuthUser }>('/profile', payload)
      setUser(data.user)
      onSaved()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        setErrors((error.response.data as { errors?: ProfileErrors }).errors ?? {})
      }
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const selectable = (catalog ?? []).flatMap((parent) =>
    parent.children.length > 0 ? [{ parent, items: parent.children }] : [{ parent, items: [parent] }],
  )

  const fieldError = (key: string) => <Form.Control.Feedback type="invalid">{errors[key]}</Form.Control.Feedback>

  return (
    <Form onSubmit={handleSubmit} noValidate className="profile-form">
      {failed && (
        <Alert variant="danger" role="alert">
          No pudimos guardar tu perfil. Revisa los campos marcados e inténtalo de nuevo.
        </Alert>
      )}

      {mode === 'onboarding' && (
        <section className="surface-card">
          <h2 className="h5">¿Cómo quieres usar Neko Sensei?</h2>
          <div className="role-picker mt-3 mb-0" role="radiogroup" aria-label="Rol principal">
            {(
              [
                { value: 'student', icon: 'bi-mortarboard', title: 'Estudiante', text: 'Busco tutores y reservo clases.' },
                { value: 'tutor', icon: 'bi-person-workspace', title: 'Tutor', text: 'Ofrezco clases y gestiono mi agenda.' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={form.role === option.value}
                className={`role-option${form.role === option.value ? ' is-active' : ''}`}
                onClick={() => update({ role: option.value }, 'role')}
              >
                <i className={`bi ${option.icon}`} aria-hidden="true" />
                <strong>{option.title}</strong>
                <small>{option.text}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="surface-card">
        <h2 className="h5">Datos de contacto</h2>
        <Row className="g-3 mt-0">
          <Col md={6}>
            <Form.Group controlId="profile-phone">
              <Form.Label>Número de teléfono</Form.Label>
              <Form.Control
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={onDigits('phone', 8)}
                maxLength={8}
                placeholder="55551234"
                isInvalid={!!errors.phone}
              />
              <Form.Text className="text-secondary">Debe contener 8 dígitos, sin espacios ni guiones.</Form.Text>
              {fieldError('phone')}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="profile-gender">
              <Form.Label>Género</Form.Label>
              <Form.Select value={form.gender} onChange={onField('gender')} isInvalid={!!errors.gender}>
                <option value="">Selecciona una opción</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
              {fieldError('gender')}
            </Form.Group>
          </Col>
          <Col xs={12}>
            <Form.Group controlId="profile-document">
              <Form.Label>Documento de identificación personal (DPI)</Form.Label>
              <Form.Control
                inputMode="numeric"
                value={form.documentId}
                onChange={onDigits('documentId', 13)}
                maxLength={13}
                isInvalid={!!errors.documentId}
              />
              <Form.Text className="text-secondary">Debe contener 13 dígitos, sin espacios ni guiones.</Form.Text>
              {fieldError('documentId')}
            </Form.Group>
          </Col>
        </Row>
      </section>

      <section className="surface-card">
        <h2 className="h5">Ubicación</h2>
        <Form.Group controlId="profile-address" className="mt-3 mb-3">
          <Form.Label>Dirección de residencia</Form.Label>
          <Form.Control
            value={form.address.text}
            onChange={(event) => update({ address: { ...form.address, text: event.target.value } }, 'addressText')}
            maxLength={200}
            placeholder="Zona, colonia o calle"
            isInvalid={!!errors.addressText}
          />
          {fieldError('addressText')}
        </Form.Group>
        <LocationPicker
          value={form.address.lat !== null && form.address.lng !== null ? { lat: form.address.lat, lng: form.address.lng } : null}
          onChange={(point) => update({ address: { ...form.address, lat: point.lat, lng: point.lng } }, 'location')}
          invalid={!!errors.location}
        />
        {errors.location && <small className="text-danger d-block mt-1">{errors.location}</small>}
      </section>

      <section className="surface-card">
        <h2 className="h5">Afinidad de categorías</h2>
        <p className="text-secondary mb-3">Elige las áreas que te interesan{isTutor ? ' o en las que quieres enseñar' : ''}.</p>
        {catalog === null && <Spinner animation="border" size="sm" role="status" aria-label="Cargando categorías" />}
        {selectable.map(({ parent, items }) => (
          <div key={parent.id} className="category-group">
            <strong>{parent.name}</strong>
            <div className="chip-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={form.categories.includes(item.id)}
                  className={`chip${form.categories.includes(item.id) ? ' is-active' : ''}`}
                  onClick={() => toggleCategory(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        {errors.categories && <small className="text-danger d-block mt-2">{errors.categories}</small>}
      </section>

      {isTutor && (
        <section className="surface-card">
          <h2 className="h5">Perfil profesional</h2>
          <Row className="g-3 mt-0">
            <Col xs={12}>
              <Form.Group controlId="profile-bio">
                <Form.Label>Biografía profesional</Form.Label>
                <Form.Control as="textarea" rows={4} value={form.bio} onChange={onField('bio')} maxLength={1000} isInvalid={!!errors.bio} />
                {fieldError('bio')}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="profile-rate">
                <Form.Label>Tarifa base por hora (Q)</Form.Label>
                <Form.Control type="number" min={1} step="1" value={form.hourlyRate} onChange={onField('hourlyRate')} isInvalid={!!errors.hourlyRate} />
                {fieldError('hourlyRate')}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="profile-portfolio">
                <Form.Label>Enlace a tu portafolio (opcional si subes el PDF)</Form.Label>
                <Form.Control type="url" value={form.portfolioUrl} onChange={onField('portfolioUrl')} placeholder="https://" isInvalid={!!errors.portfolioUrl} />
                {fieldError('portfolioUrl')}
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="profile-cv">
                <Form.Label>Hoja de vida o credenciales (PDF, máx. 2 MB)</Form.Label>
                <Form.Control type="file" accept="application/pdf" onChange={onPdf} isInvalid={!!errors.cvFile || !!errors.cv} />
                <Form.Control.Feedback type="invalid">{errors.cvFile ?? errors.cv}</Form.Control.Feedback>
                {!form.cvFile && user.tutor?.cvFileName && (
                  <Form.Text className="text-secondary">Archivo actual: {user.tutor.cvFileName}. Sube otro para reemplazarlo.</Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
          <p className="text-secondary small mt-3 mb-0">El equipo administrador revisará tu perfil antes de que puedas publicar ofertas.</p>
        </section>
      )}

      <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
        {saving ? 'Guardando…' : mode === 'onboarding' ? 'Completar registro' : 'Guardar cambios'}
      </button>
    </Form>
  )
}
