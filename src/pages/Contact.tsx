import axios from 'axios'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Alert, Col, Container, Form, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/ui/PageHero'
import { SITE } from '../config/site'
import { CONTACT_INFO, CONTACT_LIMITS, CONTACT_SUBJECTS } from '../content/contact'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { ContactErrors, ContactPayload } from '../types'

type Status = 'idle' | 'sending' | 'success' | 'error'

interface Channel {
  icon: string
  title: string
  text: string
  href?: string
  to?: string
  external?: boolean
}

function ChannelContent({ channel }: { channel: Channel }) {
  return (
    <>
      <i className={`bi ${channel.icon} contact-channel__icon`} aria-hidden="true" />
      <span className="contact-channel__text">
        <strong>{channel.title}</strong>
        <small>{channel.text}</small>
      </span>
      <i className="bi bi-arrow-right contact-channel__arrow" aria-hidden="true" />
    </>
  )
}

const EMPTY_FORM: ContactPayload = { name: '', email: '', subject: '', message: '', website: '' }
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form: ContactPayload): ContactErrors {
  const errors: ContactErrors = {}
  const name = form.name.trim()
  const message = form.message.trim()
  if (name.length < CONTACT_LIMITS.nameMin) errors.name = 'Escribe tu nombre.'
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Escribe un correo electrónico válido.'
  if (!form.subject) errors.subject = 'Selecciona un motivo de contacto.'
  if (message.length < CONTACT_LIMITS.messageMin) {
    errors.message = `El mensaje debe tener al menos ${CONTACT_LIMITS.messageMin} caracteres.`
  }
  return errors
}

export function Contact() {
  useDocumentTitle('Contacto')

  const [form, setForm] = useState<ContactPayload>(EMPTY_FORM)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<Status>('idle')

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setStatus('sending')
    try {
      await api.post('/contact', form)
      setForm(EMPTY_FORM)
      setStatus('success')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        setErrors((error.response.data as { errors?: ContactErrors }).errors ?? {})
      }
      setStatus('error')
    }
  }

  const channels: Channel[] = [
    { icon: 'bi-envelope', title: 'Correo', text: SITE.email.replace('mailto:', ''), href: SITE.email },
    { icon: 'bi-question-circle', title: 'Preguntas frecuentes', text: 'Quizá ya tenemos tu respuesta', to: '/ayuda' },
  ]

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Hablemos"
        subtitle="¿Quieres aprender, enseñar o resolver una duda? Escríbenos: nuestro equipo te responde rápido y te acompaña en cada paso."
      />

      <Container className="page-container">
        <Row className="g-4 g-lg-5">
          <Col lg={5}>
            <div className="contact-channels">
              <span className="eyebrow">Escríbenos directamente</span>
              <ul className="list-unstyled mb-0">
                {channels.map((channel) => (
                  <li key={channel.title}>
                    {channel.to ? (
                      <Link to={channel.to} className="contact-channel">
                        <ChannelContent channel={channel} />
                      </Link>
                    ) : (
                      <a
                        href={channel.href}
                        className="contact-channel"
                        {...(channel.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      >
                        <ChannelContent channel={channel} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card contact-info">
              <span className="eyebrow">Antes de escribirnos</span>
              <ul className="list-unstyled mb-0">
                {CONTACT_INFO.map((item) => (
                  <li key={item.title}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.text}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Col>

          <Col lg={7}>
            <Form className="surface-card contact-form" onSubmit={handleSubmit} noValidate>
              {status === 'success' && (
                <Alert variant="success" role="status">
                  ¡Mensaje enviado! Te responderemos pronto al correo que indicaste.
                </Alert>
              )}
              {status === 'error' && (
                <Alert variant="danger" role="alert">
                  No pudimos enviar tu mensaje. Revisa los datos e inténtalo de nuevo, o escríbenos por WhatsApp.
                </Alert>
              )}

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="contact-name">
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      maxLength={CONTACT_LIMITS.nameMax}
                      autoComplete="name"
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="contact-email">
                    <Form.Label>Correo electrónico</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="contact-subject">
                    <Form.Label>Motivo</Form.Label>
                    <Form.Select name="subject" value={form.subject} onChange={handleChange} isInvalid={!!errors.subject}>
                      <option value="">Selecciona una opción</option>
                      {CONTACT_SUBJECTS.map((subject) => (
                        <option key={subject.value} value={subject.value}>
                          {subject.label}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.subject}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="contact-message">
                    <Form.Label>Mensaje</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      maxLength={CONTACT_LIMITS.messageMax}
                      isInvalid={!!errors.message}
                    />
                    <Form.Control.Feedback type="invalid">{errors.message}</Form.Control.Feedback>
                    <Form.Text className="text-secondary">
                      {form.message.length}/{CONTACT_LIMITS.messageMax}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* Campo señuelo anti-spam: oculto para personas */}
              <div className="contact-form__trap" aria-hidden="true">
                <label htmlFor="contact-website">No llenar este campo</label>
                <input id="contact-website" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={status === 'sending'}>
                {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  )
}
