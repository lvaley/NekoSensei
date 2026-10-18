import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, NOTICE_KEY, TOKEN_KEY } from '../services/api'
import type { AuthResponse, AuthUser } from '../types'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY))

  // Al abrir la app se valida el token guardado y se recupera el usuario
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return

    let cancelled = false
    api
      .get<{ user: AuthUser }>('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data.user)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loginWithGoogle = useCallback<AuthContextValue['loginWithGoogle']>(async (credential, role) => {
    const { data } = await api.post<AuthResponse>('/auth/google', { credential, role })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    try {
      sessionStorage.setItem(NOTICE_KEY, 'logout')
    } catch {
      // sin almacenamiento disponible: solo se omite el aviso
    }
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, loginWithGoogle, logout, setUser }), [user, loading, loginWithGoogle, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
