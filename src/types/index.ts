export type UserRole = 'student' | 'tutor' | 'admin'

export type TeachingMode = 'virtual' | 'tutor_home' | 'student_home'

export interface HealthResponse {
  status: 'ok'
  database: 'connected' | 'disconnected'
  timestamp: string
}

// Sección de un documento legal (política de privacidad, términos y condiciones)
export interface LegalSection {
  id: string
  title: string
  paragraphs?: string[]
  items?: string[]
}

// Pregunta frecuente
export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategory {
  id: string
  title: string
  items: FaqItem[]
}

// Formulario de contacto
export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
  website: string // campo señuelo anti-spam, siempre vacío para personas
}

export type ContactErrors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>

// Autenticación
export interface AuthUser {
  id: string
  name: string
  email: string
  picture?: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

// Usuario tal como lo lista el panel de administración
export interface AdminUser extends AuthUser {
  createdAt: string
}
