import { Router } from 'express'
import { createContactMessage } from '../controllers/contact.controller'
import { getHealth } from '../controllers/health.controller'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.post('/contact', createContactMessage)
