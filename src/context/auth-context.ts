import { createContext } from 'react'
import type { AuthUser, UserRole } from '../types'

export interface AuthContextValue {
  user: AuthUser | null
  // true mientras se valida la sesión guardada al abrir la aplicación
  loading: boolean
  // El rol solo se usa al crear la cuenta; en cuentas existentes se ignora
  loginWithGoogle: (credential: string, role?: Exclude<UserRole, 'admin'>) => Promise<AuthUser>
  logout: () => void
  // Actualiza el usuario en memoria (por ejemplo, después de guardar el perfil)
  setUser: (user: AuthUser) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
