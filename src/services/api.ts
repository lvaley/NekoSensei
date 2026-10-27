import axios from 'axios'

export const TOKEN_KEY = 'tutorias_token'
// Aviso que se muestra una sola vez en el login: 'logout' (cierre voluntario) o 'expired' (token inválido)
export const NOTICE_KEY = 'tutorias_session_notice'

// Evento que se emite cuando el servidor responde que la cuenta fue suspendida
export const SUSPENDED_EVENT = 'tutorias:account-suspended'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  timeout: 15000,
})

// Todas las peticiones llevan el JWT en el header Authorization (requisito del proyecto)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token es inválido o expiró, se fuerza el cierre de sesión y se redirige al login
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Solo cuenta como sesión vencida si había un token guardado
      if (localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_KEY)
        sessionStorage.setItem(NOTICE_KEY, 'expired')
        window.location.assign('/login')
      }
    }
    // Cuenta suspendida a mitad de sesión: se avisa a la app para que relea la sesión y muestre la pantalla de suspensión
    if (axios.isAxiosError(error) && error.response?.status === 403 && error.response.data?.code === 'account_suspended') {
      window.dispatchEvent(new Event(SUSPENDED_EVENT))
    }
    return Promise.reject(error)
  },
)
