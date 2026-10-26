import axios from 'axios'
import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

interface MessageButtonProps {
  // Persona a la que se le quiere escribir (tutor para el estudiante, estudiante para el tutor)
  userId: string
  label?: string
  variant?: string
  size?: 'sm' | 'lg'
  onError?: (message: string) => void
}

// Abre (o crea) la conversación con esa persona y lleva a Mensajes
export function MessageButton({ userId, label = 'Enviar mensaje', variant = 'outline-dark', size = 'sm', onError }: MessageButtonProps) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const open = async () => {
    setBusy(true)
    try {
      const { data } = await api.post<{ id: string }>('/conversations', { userId })
      navigate(`/mensajes/${data.id}`)
    } catch (err) {
      onError?.(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos abrir la conversación.')
      setBusy(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={open} disabled={busy}>
      <i className="bi bi-chat-dots me-1" aria-hidden="true" />
      {label}
    </Button>
  )
}
