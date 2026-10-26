import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Alert, Button, Container } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { ChatMessage, ChatPerson, ConversationSummary } from '../types'
import { capitalize, dayKey, formatDate, formatTime, timeAgo } from '../utils/dates'
import { LinesSkeleton, ListSkeleton } from '../components/ui/Skeleton'

interface Thread {
  id: string
  other: ChatPerson
  messages: ChatMessage[]
  hasMore: boolean
}

// Mensajes privados entre estudiante y tutor: lista de conversaciones y chat en tiempo real
export function Messages() {
  useDocumentTitle('Mensajes')
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, refreshUnread } = useChat()
  const me = user?.id ?? ''

  const [list, setList] = useState<ConversationSummary[] | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null)
  const [text, setText] = useState('')
  const [sendError, setSendError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const openId = useRef<string | undefined>(id)
  useEffect(() => {
    openId.current = id
  }, [id])

  const loadList = useCallback(async () => {
    try {
      const { data } = await api.get<{ conversations: ConversationSummary[] }>('/conversations')
      setList(data.conversations)
    } catch {
      setList((current) => current ?? [])
    }
  }, [])

  useEffect(() => {
    const first = window.setTimeout(loadList, 0)
    return () => window.clearTimeout(first)
  }, [loadList])

  // Abre la conversación elegida: datos de la otra persona, mensajes recientes y marca lo recibido como leído
  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([api.get<{ id: string; other: ChatPerson }>(`/conversations/${id}`), api.get<{ messages: ChatMessage[]; hasMore: boolean }>(`/conversations/${id}/messages`)])
      .then(([info, messages]) => {
        if (!active) return
        setThread({ id, other: info.data.other, messages: messages.data.messages, hasMore: messages.data.hasMore })
        setLoadError(null)
        return api.post(`/conversations/${id}/read`).then(() => {
          refreshUnread()
          void loadList()
        })
      })
      .catch((err) => active && setLoadError({ id, message: axios.isAxiosError(err) && err.response?.status === 404 ? 'No encontramos esta conversación.' : 'No pudimos cargar la conversación.' }))
    return () => {
      active = false
    }
  }, [id, refreshUnread, loadList])

  // Mensajes nuevos y confirmaciones de lectura en vivo
  useEffect(() => {
    if (!socket) return
    const onNew = (message: ChatMessage) => {
      void loadList()
      if (message.conversationId !== openId.current) return
      setThread((current) => (current && current.id === message.conversationId && !current.messages.some((item) => item.id === message.id) ? { ...current, messages: [...current.messages, message] } : current))
      if (message.senderId !== me) {
        // La conversación está abierta: se lee al instante
        socket.emit('messages:read', { conversationId: message.conversationId }, () => {
          refreshUnread()
          void loadList()
        })
      }
    }
    const onRead = (payload: { conversationId: string; readAt: string }) => {
      setThread((current) => (current && current.id === payload.conversationId ? { ...current, messages: current.messages.map((item) => (item.senderId === me && !item.readAt ? { ...item, readAt: payload.readAt } : item)) } : current))
    }
    socket.on('message:new', onNew)
    socket.on('messages:read', onRead)
    return () => {
      socket.off('message:new', onNew)
      socket.off('messages:read', onRead)
    }
  }, [socket, me, loadList, refreshUnread])

  const lastId = thread?.messages[thread.messages.length - 1]?.id
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lastId, thread?.id])

  const current = thread && thread.id === id ? thread : null
  const failed = loadError && loadError.id === id ? loadError.message : ''

  const loadOlder = async () => {
    if (!current || current.messages.length === 0) return
    const before = current.messages[0]?.createdAt
    const { data } = await api.get<{ messages: ChatMessage[]; hasMore: boolean }>(`/conversations/${current.id}/messages`, { params: { before } })
    setThread((old) => (old && old.id === current.id ? { ...old, messages: [...data.messages, ...old.messages], hasMore: data.hasMore } : old))
  }

  const send = async (event?: FormEvent) => {
    event?.preventDefault()
    const body = text.trim()
    if (!current || !body || sending) return
    setSending(true)
    setSendError('')
    try {
      const { data } = await api.post<{ message: ChatMessage }>(`/conversations/${current.id}/messages`, { text: body })
      setText('')
      // Si el socket aún no entregó el mensaje, se agrega aquí
      setThread((old) => (old && old.id === current.id && !old.messages.some((item) => item.id === data.message.id) ? { ...old, messages: [...old.messages, data.message] } : old))
      void loadList()
    } catch (err) {
      setSendError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No pudimos enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      void send()
      event.preventDefault()
    }
  }

  return (
    <Container className="page-container">
      <h1 className="h2 mb-3">Mensajes</h1>
      <div className={`chat${id ? ' has-thread' : ''}`}>
        <aside className="chat__list surface-card" aria-label="Conversaciones">
          {!list && (
            <div className="p-3">
              <ListSkeleton rows={5} label="Cargando conversaciones" />
            </div>
          )}
          {list && list.length === 0 && (
            <p className="text-secondary p-3 mb-0">
              Aún no tienes conversaciones. {user?.role === 'student' ? <>Entra al perfil de un <Link to="/tutores">tutor</Link> y pulsa “Enviar mensaje” para resolver tus dudas.</> : 'Cuando un estudiante te escriba, aparecerá aquí.'}
            </p>
          )}
          {list?.map((item) => (
            <button key={item.id} type="button" className={`chat__item${item.id === id ? ' is-active' : ''}`} onClick={() => navigate(`/mensajes/${item.id}`)}>
              <Avatar name={item.other.name} picture={item.other.picture} size={40} />
              <span className="chat__item-body">
                <span className="d-flex justify-content-between gap-2">
                  <strong className="text-truncate">{item.other.name}</strong>
                  {item.lastMessageAt && <small className="text-secondary flex-shrink-0">{timeAgo(item.lastMessageAt)}</small>}
                </span>
                <span className="d-flex justify-content-between gap-2">
                  <small className="text-secondary text-truncate">{item.lastText}</small>
                  {item.unread > 0 && <span className="chat__unread">{item.unread}</span>}
                </span>
              </span>
            </button>
          ))}
        </aside>

        <section className="chat__thread surface-card" aria-label="Conversación">
          {!id && (
            <div className="chat__empty">
              <i className="bi bi-chat-dots" aria-hidden="true" />
              <p className="mb-0">Elige una conversación para ver los mensajes.</p>
            </div>
          )}
          {id && failed && (
            <div className="p-3">
              <Alert variant="warning" className="mb-0">{failed}</Alert>
            </div>
          )}
          {id && !failed && !current && (
            <div className="p-3">
              <LinesSkeleton lines={4} label="Cargando conversación" />
            </div>
          )}
          {current && (
            <>
              <header className="chat__header">
                <button type="button" className="btn btn-link d-lg-none p-0 me-1" onClick={() => navigate('/mensajes')} aria-label="Volver a las conversaciones">
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                </button>
                <Avatar name={current.other.name} picture={current.other.picture} size={36} />
                <strong>{current.other.name}</strong>
              </header>
              <div className="chat__messages">
                {current.hasMore && (
                  <Button variant="link" size="sm" className="d-block mx-auto" onClick={loadOlder}>
                    Ver mensajes anteriores
                  </Button>
                )}
                {current.messages.length === 0 && <p className="text-secondary text-center my-4">Escribe el primer mensaje.</p>}
                {current.messages.map((message, index) => {
                  // Los mensajes se agrupan por día con un separador
                  const previous = current.messages[index - 1]
                  const separator = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
                  const mine = message.senderId === me
                  return (
                    <div key={message.id}>
                      {separator && <div className="chat__day">{capitalize(formatDate(message.createdAt))}</div>}
                      <div className={`chat__bubble${mine ? ' is-mine' : ''}`}>
                        <span className="chat__text">{message.text}</span>
                        <span className="chat__meta">
                          {formatTime(message.createdAt)}
                          {mine && <i className={`bi ms-1 ${message.readAt ? 'bi-check2-all is-read' : 'bi-check2'}`} title={message.readAt ? 'Leído' : 'Enviado'} aria-label={message.readAt ? 'Leído' : 'Enviado'} />}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              {sendError && <Alert variant="danger" className="m-2 py-1 small">{sendError}</Alert>}
              <form className="chat__form" onSubmit={send}>
                <textarea className="form-control" rows={1} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={onKey} placeholder="Escribe un mensaje…" aria-label="Mensaje" />
                <Button type="submit" variant="primary" disabled={sending || text.trim() === ''} aria-label="Enviar">
                  <i className="bi bi-send" aria-hidden="true" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </Container>
  )
}
