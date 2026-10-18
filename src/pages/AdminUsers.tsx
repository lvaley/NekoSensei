import { useEffect, useState } from 'react'
import { Alert, Container, Spinner, Table } from 'react-bootstrap'
import { PageHero } from '../components/ui/PageHero'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { AdminUser } from '../types'

const ROLE_LABEL = { student: 'Estudiante', tutor: 'Tutor', admin: 'Administrador' } as const

type State = { kind: 'loading' } | { kind: 'ok'; users: AdminUser[] } | { kind: 'error' }

// Panel solo para administradores: lista de usuarios registrados
export function AdminUsers() {
  useDocumentTitle('Administración')
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    api
      .get<{ users: AdminUser[] }>('/users')
      .then((res) => {
        if (!cancelled) setState({ kind: 'ok', users: res.data.users })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHero eyebrow="Administración" title="Usuarios registrados" subtitle="Cuentas creadas en la plataforma y su rol." />
      <Container className="page-container">
        {state.kind === 'loading' && <Spinner animation="border" role="status" />}
        {state.kind === 'error' && <Alert variant="danger">No se pudo cargar la lista de usuarios.</Alert>}
        {state.kind === 'ok' && (
          <div className="surface-card p-0 table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {state.users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{ROLE_LABEL[user.role]}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString('es-GT')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Container>
    </>
  )
}
