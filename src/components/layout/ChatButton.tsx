import { Link } from 'react-router-dom'
import { useChat } from '../../hooks/useChat'

// Acceso a los mensajes, junto a la campanita, con el número de mensajes sin leer
export function ChatButton() {
  const { unread } = useChat()
  return (
    <Link to="/mensajes" className="btn btn-link notification-bell__button" aria-label={unread > 0 ? `Mensajes: ${unread} sin leer` : 'Mensajes'}>
      <i className="bi bi-chat-dots" style={{ fontSize: '1.3rem' }} aria-hidden="true" />
      {unread > 0 && <span className="notification-bell__badge">{unread > 9 ? '9+' : unread}</span>}
    </Link>
  )
}
