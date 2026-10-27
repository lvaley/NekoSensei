import { Router } from 'express'
import { getMe, googleLogin } from '../controllers/auth.controller'
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categories.controller'
import { cancelEnrollment, createEnrollment, decideEnrollment, finishEnrollment, listEnrollments, listSlots } from '../controllers/enrollments.controller'
import { declineReschedule, proposeReschedule, requestReschedule, rescheduleSlots, respondReschedule } from '../controllers/reschedule.controller'
import { listPayments, payEnrollment, planSlots, renewEnrollment } from '../controllers/payments.controller'
import { enrollmentTravel, previewOfferTravel } from '../controllers/travel.controller'
import { getSessionDetail } from '../controllers/sessionDetail.controller'
import { cancelSession, completeSession, createSession, listSessions } from '../controllers/sessions.controller'
import { createOffer, deleteOffer, listMyOffers, updateOffer } from '../controllers/offers.controller'
import { getTutor, listOffers, listTutors } from '../controllers/public.controller'
import { getPublicStats } from '../controllers/stats.controller'
import { createContactMessage, listContactMessages } from '../controllers/contact.controller'
import { getHealth } from '../controllers/health.controller'
import { updateProfile } from '../controllers/profile.controller'
import { downloadTutorCv, listTutorApplications, reviewTutor } from '../controllers/tutors.controller'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notifications.controller'
import { getConversation, listConversations, listMessages, openConversation, postMessage, readConversation, unreadCount } from '../controllers/chat.controller'
import { createReview, listTutorReviews } from '../controllers/reviews.controller'
import { listUsers } from '../controllers/users.controller'
import { createReport, listReports, updateReport } from '../controllers/reports.controller'
import { decideAppeal, listSuspensions, reactivateUser, sendAppeal, suspendUser } from '../controllers/moderation.controller'
import { getAdminOverview } from '../controllers/overview.controller'
import { requireAuth, requireAuthAllowSuspended, requireRole } from '../middlewares/auth'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.post('/contact', createContactMessage)
apiRouter.get('/admin/overview', requireAuth, requireRole('admin'), getAdminOverview)
apiRouter.get('/admin/contact-messages', requireAuth, requireRole('admin'), listContactMessages)

// Catálogo público: categorías activas, tutores aprobados y cursos (ofertas) con filtros
apiRouter.get('/public/categories', listCategories)
apiRouter.get('/public/stats', getPublicStats)
apiRouter.get('/tutors', listTutors)
apiRouter.get('/tutors/:id', getTutor)
apiRouter.get('/tutors/:id/reviews', listTutorReviews)
apiRouter.get('/offers', listOffers)

// Autenticación
apiRouter.post('/auth/google', googleLogin)
apiRouter.get('/auth/me', requireAuthAllowSuspended, getMe)

// Cuenta suspendida: la única acción permitida es apelar
apiRouter.post('/suspension/appeal', requireAuthAllowSuspended, sendAppeal)

// Denuncias entre estudiantes y tutores, y moderación (administrador)
apiRouter.post('/reports', requireAuth, requireRole('student', 'tutor'), createReport)
apiRouter.get('/admin/reports', requireAuth, requireRole('admin'), listReports)
apiRouter.patch('/admin/reports/:id', requireAuth, requireRole('admin'), updateReport)
apiRouter.get('/admin/suspensions', requireAuth, requireRole('admin'), listSuspensions)
apiRouter.post('/admin/users/:id/suspend', requireAuth, requireRole('admin'), suspendUser)
apiRouter.post('/admin/users/:id/reactivate', requireAuth, requireRole('admin'), reactivateUser)
apiRouter.patch('/admin/users/:id/appeal', requireAuth, requireRole('admin'), decideAppeal)

// Rutas protegidas por rol
apiRouter.get('/users', requireAuth, requireRole('admin'), listUsers)

// Perfil y onboarding
apiRouter.put('/profile', requireAuth, updateProfile)

// Catálogo de categorías: lectura para cualquier sesión, gestión solo para administradores
apiRouter.get('/categories', requireAuth, listCategories)
apiRouter.post('/categories', requireAuth, requireRole('admin'), createCategory)
apiRouter.put('/categories/:id', requireAuth, requireRole('admin'), updateCategory)
apiRouter.delete('/categories/:id', requireAuth, requireRole('admin'), deleteCategory)

// Revisión de tutores (administrador)
apiRouter.get('/admin/tutors', requireAuth, requireRole('admin'), listTutorApplications)
apiRouter.patch('/admin/tutors/:id/review', requireAuth, requireRole('admin'), reviewTutor)
apiRouter.get('/admin/tutors/:id/cv', requireAuth, requireRole('admin'), downloadTutorCv)

// Ofertas del tutor (solo tutores aprobados pueden crear o editar)
apiRouter.get('/my/offers', requireAuth, requireRole('tutor'), listMyOffers)
apiRouter.post('/my/offers', requireAuth, requireRole('tutor'), createOffer)
apiRouter.put('/my/offers/:id', requireAuth, requireRole('tutor'), updateOffer)
apiRouter.delete('/my/offers/:id', requireAuth, requireRole('tutor'), deleteOffer)

// Notificaciones (campanita del header)
apiRouter.get('/notifications', requireAuth, listNotifications)
apiRouter.patch('/notifications/read-all', requireAuth, markAllNotificationsRead)
apiRouter.patch('/notifications/:id/read', requireAuth, markNotificationRead)

// Inscripciones (suscripción de un estudiante a un curso) y agenda de clases
apiRouter.post('/enrollments', requireAuth, requireRole('student'), createEnrollment)
apiRouter.get('/enrollments', requireAuth, requireRole('student', 'tutor'), listEnrollments)
apiRouter.patch('/enrollments/:id/decision', requireAuth, requireRole('tutor'), decideEnrollment)
apiRouter.patch('/enrollments/:id/cancel', requireAuth, requireRole('student', 'tutor'), cancelEnrollment)
apiRouter.get('/offers/:id/plan-slots', requireAuth, requireRole('student'), planSlots)
apiRouter.post('/enrollments/:id/pay', requireAuth, requireRole('student'), payEnrollment)
apiRouter.post('/enrollments/:id/renew', requireAuth, requireRole('student'), renewEnrollment)
apiRouter.get('/payments', requireAuth, requireRole('student', 'tutor'), listPayments)
apiRouter.get('/offers/:id/travel', requireAuth, requireRole('student'), previewOfferTravel)
apiRouter.get('/enrollments/:id/travel', requireAuth, requireRole('student', 'tutor'), enrollmentTravel)
apiRouter.get('/enrollments/:id/slots', requireAuth, requireRole('student', 'tutor'), listSlots)
apiRouter.patch('/enrollments/:id/finish', requireAuth, requireRole('tutor'), finishEnrollment)
apiRouter.get('/sessions', requireAuth, requireRole('student', 'tutor'), listSessions)
apiRouter.get('/sessions/:id/detail', requireAuth, requireRole('student', 'tutor'), getSessionDetail)
apiRouter.post('/enrollments/:id/sessions', requireAuth, requireRole('student', 'tutor'), createSession)
apiRouter.patch('/sessions/:id/cancel', requireAuth, requireRole('student', 'tutor'), cancelSession)
apiRouter.patch('/sessions/:id/complete', requireAuth, requireRole('tutor'), completeSession)
// Reagendar clases a domicilio: solicitud del estudiante y gestión del tutor
apiRouter.post('/sessions/:id/reschedule', requireAuth, requireRole('student'), requestReschedule)
apiRouter.get('/sessions/:id/reschedule/slots', requireAuth, requireRole('tutor'), rescheduleSlots)
apiRouter.post('/sessions/:id/reschedule/propose', requireAuth, requireRole('tutor'), proposeReschedule)
apiRouter.post('/sessions/:id/reschedule/decline', requireAuth, requireRole('tutor'), declineReschedule)
apiRouter.post('/sessions/:id/reschedule/respond', requireAuth, requireRole('student'), respondReschedule)

// Reseñas: el estudiante califica a su tutor tras una clase realizada
apiRouter.post('/enrollments/:id/review', requireAuth, requireRole('student'), createReview)

// Chat privado entre estudiante y tutor (los mensajes nuevos también llegan por Socket.io)
apiRouter.get('/conversations', requireAuth, requireRole('student', 'tutor'), listConversations)
apiRouter.get('/conversations/unread-count', requireAuth, requireRole('student', 'tutor'), unreadCount)
apiRouter.post('/conversations', requireAuth, requireRole('student', 'tutor'), openConversation)
apiRouter.get('/conversations/:id', requireAuth, requireRole('student', 'tutor'), getConversation)
apiRouter.get('/conversations/:id/messages', requireAuth, requireRole('student', 'tutor'), listMessages)
apiRouter.post('/conversations/:id/messages', requireAuth, requireRole('student', 'tutor'), postMessage)
apiRouter.post('/conversations/:id/read', requireAuth, requireRole('student', 'tutor'), readConversation)
