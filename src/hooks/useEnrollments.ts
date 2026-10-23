import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import type { Enrollment } from '../types'

// Inscripciones de la sesión actual (como estudiante o como tutor, según el rol)
export function useEnrollments(enabled = true) {
  const [items, setItems] = useState<Enrollment[] | null>(null)
  const [error, setError] = useState(false)

  const reload = useCallback(() => {
    if (!enabled) return Promise.resolve()
    return api
      .get<{ enrollments: Enrollment[] }>('/enrollments')
      .then((res) => {
        setItems(res.data.enrollments)
        setError(false)
      })
      .catch(() => setError(true))
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, error, reload }
}
