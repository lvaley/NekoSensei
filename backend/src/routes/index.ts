import { Router } from 'express'
import { getMe, googleLogin } from '../controllers/auth.controller'
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categories.controller'
import { createOffer, deleteOffer, listMyOffers, updateOffer } from '../controllers/offers.controller'
import { getTutor, listOffers, listTutors } from '../controllers/public.controller'
import { createContactMessage } from '../controllers/contact.controller'
import { getHealth } from '../controllers/health.controller'
import { updateProfile } from '../controllers/profile.controller'
import { downloadTutorCv, listTutorApplications, reviewTutor } from '../controllers/tutors.controller'
import { listUsers } from '../controllers/users.controller'
import { requireAuth, requireRole } from '../middlewares/auth'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.post('/contact', createContactMessage)

// Catálogo público: categorías activas, tutores aprobados y cursos (ofertas) con filtros
apiRouter.get('/public/categories', listCategories)
apiRouter.get('/tutors', listTutors)
apiRouter.get('/tutors/:id', getTutor)
apiRouter.get('/offers', listOffers)

// Autenticación
apiRouter.post('/auth/google', googleLogin)
apiRouter.get('/auth/me', requireAuth, getMe)

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
