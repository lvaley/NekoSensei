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
  // Presente solo si el administrador suspendió la cuenta
  suspension?: Suspension
}

export interface Appeal {
  message: string
  sentAt: string
  status: 'pending' | 'rejected'
  response?: string
  respondedAt?: string
}

export interface Suspension {
  reason: string
  suspendedAt: string
  appeal?: Appeal
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
  suspended: boolean
  createdAt: string
}

export type ReportReason = 'acoso' | 'fraude' | 'contenido_inapropiado' | 'incumplimiento' | 'suplantacion' | 'otro'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

// Denuncia tal como la ve el administrador
export interface AdminReport {
  id: string
  reason: ReportReason
  reasonLabel: string
  detail: string
  status: ReportStatus
  adminNote?: string
  createdAt: string
  resolvedAt?: string
  reporter: { id: string; name: string; email: string; role: UserRole; suspended: boolean }
  reported: { id: string; name: string; email: string; role: UserRole; suspended: boolean; totalReports: number }
}

export interface AdminSuspension extends Suspension {
  user: { id: string; name: string; email: string; role: UserRole }
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

// ── Catálogo público: tutores, cursos (ofertas) y búsqueda ──
export type CourseLevel = 'basic' | 'intermediate' | 'advanced'
export type ClassType = 'individual' | 'group'

// Franja semanal en que se imparte un curso (hora de Guatemala): day 0 = domingo … 6 = sábado
export interface AvailabilityWindow {
  day: number
  start: string
  end: string
}

export interface MapPoint {
  lat: number
  lng: number
}

export interface PublicOffer {
  id: string
  title: string
  description: string
  category: { id: string; name: string }
  modes: TeachingMode[]
  hourlyRate: number
  level: CourseLevel
  availability: AvailabilityWindow[]
  classType: ClassType
  maxStudents: number
  // Cupos libres de un grupo (null en clases individuales)
  seatsLeft: number | null
  // Plan: semanas y clases por semana (null en cursos sin plan)
  weeks: number | null
  sessionsPerWeek: number | null
  totalSessions: number
  sessionDurationMin: number
  travelFeePerKm: number
  maxTravelKm: number
  tutor: { id: string; name: string; picture?: string; rating: number | null; reviewCount: number }
  // Solo vienen con valor si se conoce la dirección de quien consulta
  distanceKm: number | null
  inTravelRange: boolean | null
  travelCost: number | null
}

export interface PublicTutor {
  id: string
  name: string
  picture?: string
  bio: string
  hourlyRate: number
  fromPrice: number
  categories: string[]
  offerCount: number
  // Calificación promedio (1–5) y cantidad de reseñas; rating es null si aún no tiene
  rating: number | null
  reviewCount: number
  location: MapPoint | null
  distanceKm: number | null
}

export interface TutorDetail {
  tutor: Omit<PublicTutor, 'fromPrice' | 'offerCount'> & { portfolioUrl?: string }
  offers: PublicOffer[]
}

// Oferta tal como la ve su tutor en "Mis ofertas"
export interface MyOffer {
  id: string
  title: string
  description: string
  category: { id: string; name: string }
  modes: TeachingMode[]
  hourlyRate: number
  level: CourseLevel
  // Enlace de la reunión (solo lo ve el tutor y los inscritos activos en modalidad virtual)
  meetingUrl: string
  availability: AvailabilityWindow[]
  classType: ClassType
  maxStudents: number
  seatsTaken: number
  weeks: number | null
  sessionsPerWeek: number | null
  totalSessions: number
  sessionDurationMin: number
  travelFeePerKm: number
  maxTravelKm: number
  active: boolean
}

export interface OfferPayload {
  title: string
  description: string
  category: string
  modes: TeachingMode[]
  hourlyRate: number | ''
  level: CourseLevel
  meetingUrl: string
  availability: AvailabilityWindow[]
  classType: ClassType
  maxStudents: number | ''
  weeks: number | ''
  sessionsPerWeek: number | ''
  sessionDurationMin: number
  travelFeePerKm: number | ''
  maxTravelKm: number | ''
  active: boolean
}

// ── Inscripciones (suscripción a un curso) y agenda ──
export type EnrollmentStatus = 'pending' | 'awaiting_payment' | 'active' | 'rejected' | 'cancelled' | 'finished' | 'expired'

export interface WeeklySlot {
  day: number
  start: string
}

export interface EnrollmentPlan {
  weeks: number
  sessionsPerWeek: number
  weeklySlots: WeeklySlot[]
  startDate: string | null
  cycle: number
}

export interface EnrollmentCharge {
  kind: 'initial' | 'renewal'
  classes: number
  travel: number
  total: number
  dueAt: string
  startDate: string
}

// Horarios fijos disponibles y precio de un plan, antes de solicitarlo
export interface PlanSlotsResponse {
  needsSlots: boolean
  weeks: number | null
  sessionsPerWeek: number | null
  durationMin: number
  startDate: string
  days: Array<{ day: number; starts: string[] }>
  quote: { classes: number; travel: number; total: number; sessions: number }
}

export interface PaymentRecord {
  id: string
  offerTitle: string
  enrollmentId: string
  cycle: number
  kind: 'initial' | 'renewal'
  classes: number
  travel: number
  amount: number
  sessions: number
  status: 'paid' | 'failed'
  failureReason: string | null
  card: { brand: string; last4: string } | null
  other: string
  createdAt: string
}

export interface PersonRef {
  id: string
  name: string
  picture?: string
}

export interface Enrollment {
  id: string
  status: EnrollmentStatus
  mode: TeachingMode
  note?: string
  decisionNote?: string
  createdAt: string
  offer: { id: string; title: string; category: string; hourlyRate: number; level: CourseLevel; classType: ClassType; maxStudents: number; totalSessions: number; sessionDurationMin: number; weeks: number | null; sessionsPerWeek: number | null }
  // Plan contratado: semanas, clases por semana y horarios fijos (null en cursos sin plan)
  plan: EnrollmentPlan | null
  // Cobro pendiente: el primer pago tras la aceptación, o una renovación
  charge: EnrollmentCharge | null
  canRenew: boolean
  // Clases agendadas o realizadas (sin contar canceladas) y cuántas ya se realizaron
  sessionsUsed: number
  sessionsCompleted: number
  tutor: PersonRef
  student: PersonRef
  nextSession: string | null
  // Reseña del estudiante a este curso y si ya puede escribirla (tras una clase realizada)
  review: { rating: number; comment: string; createdAt: string } | null
  canReview: boolean
  // Solo en inscripciones activas virtuales; null si aún no hay enlace
  meetingUrl: string | null
}

export interface TutorReview {
  id: string
  rating: number
  comment: string
  offerTitle: string
  student: string
  createdAt: string
}

export interface TutorReviewsResponse {
  average: number | null
  count: number
  reviews: TutorReview[]
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export type RescheduleStatus = 'requested' | 'proposed' | 'declined' | 'rejected'

// Solicitud de reagendar una clase a domicilio
export interface Reschedule {
  status: RescheduleStatus
  reason: string
  requestedAt: string
  proposedStart: string | null
  tutorNote: string | null
}

export interface ClassSession {
  id: string
  enrollmentId: string
  title: string
  mode?: TeachingMode
  start: string
  end: string
  durationMin: number
  status: SessionStatus
  note?: string
  tutor: { id: string; name: string }
  student: { id: string; name: string }
  meetingUrl: string | null
  reschedule: Reschedule | null
  rescheduleCount: number
  classType: ClassType
  // Solo en la agenda del tutor para clases grupales: todos los asistentes
  students?: Array<{ id: string; name: string }>
}

// Horarios en que se puede agendar una clase de una inscripción
export interface SlotsResponse {
  // false en ofertas antiguas sin franjas: el horario se elige libremente
  hasSchedule: boolean
  durationMin: number
  slots: string[]
}

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  link: string
  read: boolean
  createdAt: string
}

export interface MapPoint {
  lat: number
  lng: number
  label: string
  // true: dirección exacta · false: zona aproximada
  exact: boolean
  address: string | null
}

export interface SessionTravel {
  // true si quien consulta es quien se desplaza (en casa del tutor: el estudiante; a domicilio: el tutor)
  viewerTravels: boolean
  from: MapPoint
  to: MapPoint
  straightKm: number
  maxTravelKm: number | null
  withinCoverage: boolean | null
  // 'road': ruta real por calles · 'straight': solo línea recta (el servicio de rutas no respondió)
  source: 'road' | 'straight'
  roadKm: number | null
  roadMin: number | null
  geometry: Array<[number, number]>
}

export interface SessionDetail extends ClassSession {
  category: string
  description: string | null
  level: CourseLevel
  maxStudents: number
  classNumber: number
  totalSessions: number
  place: { kind: TeachingMode; meetingUrl: string | null; address: string | null }
  travel: SessionTravel | null
  price: { hourlyRate: number; classCost: number; travelFeePerKm: number | null; travelCost: number | null; total: number }
}

// Traslado a domicilio calculado antes de solicitar o aceptar una inscripción
export interface TravelPreview {
  travel: SessionTravel
  price: { feePerKm: number | null; perClass: number | null; totalSessions: number; course: number | null }
}

// ── Chat ──
export interface ChatPerson {
  id: string
  name: string
  picture?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  text: string
  readAt: string | null
  createdAt: string
}

export interface ConversationSummary {
  id: string
  other: ChatPerson
  lastText: string
  lastMessageAt: string | null
  unread: number
}

// Mensaje enviado desde el formulario de contacto, tal como lo ve el administrador
export interface AdminContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
}
