import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Container } from 'react-bootstrap'
import { AdminNav } from '../components/ui/AdminNav'
import { PageHero } from '../components/ui/PageHero'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../services/api'
import type { Category } from '../types'
import { ListSkeleton } from '../components/ui/Skeleton'

type State = { kind: 'loading' } | { kind: 'ok'; categories: Category[] } | { kind: 'error' }

// Gestión del catálogo: CRUD de categorías y subcategorías
export function AdminCategories() {
  useDocumentTitle('Categorías')
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  // Formulario abierto para agregar una subcategoría a esta categoría
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [childName, setChildName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)

  const load = useCallback(() => {
    return api
      .get<{ categories: Category[] }>('/categories')
      .then((res) => setState({ kind: 'ok', categories: res.data.categories }))
      .catch(() => setState({ kind: 'error' }))
  }, [])

  useEffect(() => {
    let active = true
    api
      .get<{ categories: Category[] }>('/categories')
      .then((res) => {
        if (active) setState({ kind: 'ok', categories: res.data.categories })
      })
      .catch(() => {
        if (active) setState({ kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [])

  // Ejecuta una operación y recarga el catálogo; muestra el mensaje del servidor si falla
  const run = async (operation: () => Promise<unknown>) => {
    setError('')
    try {
      await operation()
      await load()
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(message ?? 'No se pudo completar la operación.')
    }
  }

  const addCategory = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      await api.post('/categories', { name: newName })
      setNewName('')
    })
  }

  const addChild = (event: FormEvent, parentId: string) => {
    event.preventDefault()
    void run(async () => {
      await api.post('/categories', { name: childName, parentId })
      setChildName('')
      setAddingTo(null)
    })
  }

  const saveName = (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    void run(async () => {
      await api.put(`/categories/${editing.id}`, { name: editing.name })
      setEditing(null)
    })
  }

  const toggleActive = (id: string, active: boolean) => run(() => api.put(`/categories/${id}`, { active: !active }))

  const remove = (id: string, name: string, hasChildren: boolean) => {
    const extra = hasChildren ? ' También se eliminarán sus subcategorías.' : ''
    if (window.confirm(`¿Eliminar "${name}"?${extra}`)) void run(() => api.delete(`/categories/${id}`))
  }

  const row = (item: { id: string; name: string; active: boolean }, hasChildren: boolean, isParent: boolean) =>
    editing?.id === item.id ? (
      <form onSubmit={saveName} className="category-row">
        <input
          className="form-control form-control-sm"
          value={editing.name}
          onChange={(event) => setEditing({ id: item.id, name: event.target.value })}
          aria-label="Nuevo nombre"
          maxLength={60}
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Guardar
        </button>
        <button type="button" className="btn btn-link btn-sm" onClick={() => setEditing(null)}>
          Cancelar
        </button>
      </form>
    ) : (
      <div className="category-row">
        <span className={`category-row__name${item.active ? '' : ' is-inactive'}`}>
          {item.name}
          {!item.active && <small className="ms-2">(oculta)</small>}
        </span>
        <div className="category-row__actions">
          {isParent && (
            <button type="button" className="btn btn-link btn-sm" onClick={() => { setAddingTo(item.id); setChildName('') }}>
              + Subcategoría
            </button>
          )}
          <button type="button" className="btn btn-link btn-sm" onClick={() => setEditing({ id: item.id, name: item.name })}>
            Renombrar
          </button>
          <button type="button" className="btn btn-link btn-sm" onClick={() => toggleActive(item.id, item.active)}>
            {item.active ? 'Ocultar' : 'Mostrar'}
          </button>
          <button type="button" className="btn btn-link btn-sm text-danger" onClick={() => remove(item.id, item.name, hasChildren)}>
            Eliminar
          </button>
        </div>
      </div>
    )

  return (
    <>
      <PageHero eyebrow="Administración" title="Catálogo de categorías" subtitle="Los tutores publicarán sus ofertas dentro de estas categorías." />
      <AdminNav />
      <Container className="page-container">
        {error && <Alert variant="danger">{error}</Alert>}
        {state.kind === 'loading' && <ListSkeleton label="Cargando" />}
        {state.kind === 'error' && <Alert variant="danger">No se pudo cargar el catálogo.</Alert>}

        {state.kind === 'ok' && (
          <>
            <form onSubmit={addCategory} className="surface-card category-add mb-4">
              <input
                className="form-control"
                placeholder="Nueva categoría (ej. Música)"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                aria-label="Nombre de la nueva categoría"
                maxLength={60}
              />
              <button type="submit" className="btn btn-primary" disabled={newName.trim().length < 2}>
                Agregar categoría
              </button>
            </form>

            <div className="d-grid gap-3">
              {state.categories.map((category) => (
                <div key={category.id} className="surface-card p-0 category-card">
                  <div className="category-card__head">{row(category, category.children.length > 0, true)}</div>
                  <ul className="list-unstyled mb-0">
                    {category.children.map((child) => (
                      <li key={child.id}>{row(child, false, false)}</li>
                    ))}
                    {addingTo === category.id && (
                      <li>
                        <form onSubmit={(event) => addChild(event, category.id)} className="category-row">
                          <input
                            className="form-control form-control-sm"
                            placeholder="Nombre de la subcategoría"
                            value={childName}
                            onChange={(event) => setChildName(event.target.value)}
                            aria-label="Nombre de la subcategoría"
                            maxLength={60}
                            autoFocus
                          />
                          <button type="submit" className="btn btn-primary btn-sm" disabled={childName.trim().length < 2}>
                            Agregar
                          </button>
                          <button type="button" className="btn btn-link btn-sm" onClick={() => setAddingTo(null)}>
                            Cancelar
                          </button>
                        </form>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </Container>
    </>
  )
}
