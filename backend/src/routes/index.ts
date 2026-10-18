import { Router } from 'express'
import { getMe, googleLogin } from '../controllers/auth.controller'
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categories.controller'
import { createContactMessage } from '../controllers/contact.controller'
import { getHealth } from '../controllers/health.controller'
import { updateProfile } from '../controllers/profile.controller'
import { downloadTutorCv, listTutorApplications, reviewTutor } from '../controllers/tutors.controller'
import { listUsers } from '../controllers/users.controller'
import { requireAuth, requireRole } from '../middlewares/auth'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.post('/contact', createContactMessage)

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
