import { useCallback, useEffect, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import type { AppNotification } from '../../types'
import { timeAgo } from '../../utils/dates'

const POLL_MS = 30_000

// Campanita del header: avisos para dar continuidad a solicitudes (inscripciones, clases, reagendar…)
export function NotificationBell() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ notifications: AppNotification[]; unread: number }>('/notifications')
      setItems(data.notifications)
      setUnread(data.unread)
    } catch {
      // Sin conexión: se conserva lo último que se vio
    }
  }, [])

  useEffect(() => {
    const first = window.setTimeout(load, 0)
    const timer = window.setInterval(load, POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [load])

  const open = async (item: AppNotification) => {
    navigate(item.link)
    if (item.read) return
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)))
    setUnread((count) => Math.max(0, count - 1))
    try {
      await api.patch(`/notifications/${item.id}/read`)
    } catch {
      await load()
    }
  }

  const readAll = async () => {
    setItems((current) => current.map((entry) => ({ ...entry, read: true })))
    setUnread(0)
    try {
      await api.patch('/notifications/read-all')
    } catch {
      await load()
    }
  }

  return (
    <Dropdown align="end" className="notification-bell" onToggle={(show) => show && load()}>
      <Dropdown.Toggle variant="link" className="notification-bell__button" aria-label={unread > 0 ? `Notificaciones: ${unread} sin leer` : 'Notificaciones'}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && <span className="notification-bell__badge">{unread > 9 ? '9+' : unread}</span>}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-bell__menu">
        <div className="notification-bell__head">
          <strong>Notificaciones</strong>
          {unread > 0 && (
            <button type="button" className="notification-bell__all" onClick={readAll}>
              Marcar todas como leídas
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="notification-bell__empty">Todavía no tienes notificaciones.</p>
        ) : (
          <ul className="notification-bell__list">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" className={`notification-bell__item${item.read ? '' : ' is-unread'}`} onClick={() => open(item)}>
                  <span className="notification-bell__title">{item.title}</span>
                  <span className="notification-bell__text">{item.message}</span>
                  <span className="notification-bell__time">{timeAgo(item.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}
