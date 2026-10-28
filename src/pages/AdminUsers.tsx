import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Container, Table } from 'react-bootstrap'
import { AdminNav } from '../components/ui/AdminNav'
import { PageHero } from '../components/ui/PageHero'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { AdminUser } from '../types'
import { ListSkeleton } from '../components/ui/Skeleton'
import { TextPromptModal } from '../components/ui/TextPromptModal'

const ROLE_LABEL = { student: 'Estudiante', tutor: 'Tutor', admin: 'Administrador' } as const

type State = { kind: 'loading' } | { kind: 'ok'; users: AdminUser[] } | { kind: 'error' }

// Panel solo para administradores: lista de usuarios registrados
export function AdminUsers() {
  useDocumentTitle('Administración')
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [suspending, setSuspending] = useState<AdminUser | null>(null)

  const load = useCallback(() => {
    return api
      .get<{ users: AdminUser[] }>('/users')
      .then((res) => setState({ kind: 'ok', users: res.data.users }))
      .catch(() => setState({ kind: 'error' }))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const reactivate = async (user: AdminUser) => {
    if (!window.confirm(`¿Reactivar la cuenta de ${user.name}?`)) return
    await api.post(`/admin/users/${user.id}/reactivate`)
    await load()
  }

  return (
    <>
      <PageHero eyebrow="Administración" title="Usuarios registrados" subtitle="Toda tu comunidad en un vistazo: cuentas, roles y estado, con control para mantenerla segura." />
      <AdminNav />
      <Container className="page-container">
        {state.kind === 'loading' && <ListSkeleton label="Cargando" />}
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
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{ROLE_LABEL[user.role]}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString('es-GT')}</td>
                    <td>{user.suspended ? <span className="enrollment-status is-closed">Suspendida</span> : <span className="enrollment-status is-active">Activa</span>}</td>
                    <td className="text-end">
                      {user.role !== 'admin' &&
                        (user.suspended ? (
                          <Button size="sm" variant="outline-dark" onClick={() => void reactivate(user)}>
                            Reactivar
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline-danger" onClick={() => setSuspending(user)}>
                            Suspender
                          </Button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Container>
      {suspending && (
        <TextPromptModal
          title={`Suspender a ${suspending.name}`}
          intro="La persona podrá iniciar sesión, pero solo verá este motivo y un formulario de apelación."
          label="Motivo de la suspensión"
          placeholder="Se muestra a la persona suspendida."
          minLength={10}
          maxLength={500}
          confirmLabel="Suspender cuenta"
          confirmVariant="danger"
          onSubmit={async (reason) => {
            await api.post(`/admin/users/${suspending.id}/suspend`, { reason })
            setSuspending(null)
            await load()
          }}
          onClose={() => setSuspending(null)}
        />
      )}
    </>
  )
}
