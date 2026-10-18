import { Router } from 'express'
import { getMe, googleLogin } from '../controllers/auth.controller'
import { createContactMessage } from '../controllers/contact.controller'
import { getHealth } from '../controllers/health.controller'
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
