import { useEffect, useState } from 'react'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { api } from '../services/api'
import type { HealthResponse } from '../types'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error' }

export function Status() {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    api
      .get<HealthResponse>('/health')
      .then((res) => {
        if (!cancelled) setState({ kind: 'ok', data: res.data })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Container className="page-container">
      <div className="surface-card">
        <h1 className="h4 mb-3">Estado del sistema</h1>
        {state.kind === 'loading' && <Spinner animation="border" role="status" />}
        {state.kind === 'error' && (
          <Alert variant="danger" className="mb-0">
            No se pudo conectar con el backend.
          </Alert>
        )}
        {state.kind === 'ok' && (
          <Alert variant="success" className="mb-0">
            API: <strong>{state.data.status}</strong> · Base de datos:{' '}
            <strong>{state.data.database}</strong>
          </Alert>
        )}
      </div>
    </Container>
  )
}
