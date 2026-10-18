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

// Autenticación y perfil
export type Gender = 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir'

export type TutorStatus = 'pending' | 'approved' | 'rejected'

export interface Address {
  text: string
  lat: number
  lng: number
}

export interface TutorProfile {
  bio: string
  hourlyRate: number
  portfolioUrl?: string
  cvFileName?: string
  hasCvFile: boolean
  status: TutorStatus
  reviewNote?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  picture?: string
  role: UserRole
  onboardingCompleted: boolean
  phone?: string
  gender?: Gender
  documentId?: string
  address?: Address
  categories: string[]
  tutor?: TutorProfile
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

// Usuario tal como lo lista el panel de administración
export interface AdminUser {
  id: string
  name: string
  email: string
  picture?: string
  role: UserRole
  createdAt: string
}

// Catálogo de categorías (dos niveles: categoría y subcategorías)
export interface CategoryChild {
  id: string
  name: string
  active: boolean
}

export interface Category extends CategoryChild {
  children: CategoryChild[]
}

// Solicitud de tutor en la bandeja de revisión
export interface TutorApplication {
  id: string
  name: string
  email: string
  picture?: string
  phone?: string
  documentId?: string
  address?: string
  bio?: string
  hourlyRate?: number
  portfolioUrl?: string
  cvFileName?: string
  status: TutorStatus
  reviewNote?: string
  categories: string[]
  updatedAt: string
}

// Datos que se envían al completar u editar el perfil
export interface ProfilePayload {
  role?: Exclude<UserRole, 'admin'>
  phone: string
  gender: Gender | ''
  documentId: string
  address: { text: string; lat: number | null; lng: number | null }
  categories: string[]
  bio?: string
  hourlyRate?: number | ''
  portfolioUrl?: string
  cvFile?: { name: string; data: string } | null
}

export type ProfileErrors = Record<string, string>
