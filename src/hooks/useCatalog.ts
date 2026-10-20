import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from './useAuth'

// Consulta un endpoint público del catálogo con los filtros de la URL. Si la persona tiene dirección
// registrada se envía como origen para calcular distancias y costo de traslado.
export function useCatalog<T>(path: string, params: URLSearchParams) {
  const { user } = useAuth()
  const lat = user?.address?.lat
  const lng = user?.address?.lng

  const query = useMemo(() => {
    const merged = new URLSearchParams(params)
    if (lat !== undefined && lng !== undefined) {
      merged.set('lat', String(lat))
      merged.set('lng', String(lng))
    } else {
      merged.delete('maxKm')
    }
    return merged.toString()
  }, [params, lat, lng])

  // El resultado se guarda junto a la consulta que lo produjo; si no coincide con la actual, se está cargando
  const key = `${path}?${query}`
  const [result, setResult] = useState<{ key: string; data: T | null; error: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get<T>(`${path}${query ? `?${query}` : ''}`)
      .then((res) => {
        if (!cancelled) setResult({ key, data: res.data, error: false })
      })
      .catch(() => {
        if (!cancelled) setResult({ key, data: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [path, query, key])

  const current = result?.key === key ? result : null
  return {
    // Mientras llega la consulta nueva se conserva el último resultado para que la lista no parpadee
    data: current ? current.data : (result?.data ?? null),
    loading: current === null,
    error: current?.error ?? false,
    hasOrigin: lat !== undefined && lng !== undefined,
  }
}
