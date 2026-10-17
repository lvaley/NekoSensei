import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler, notFound } from './middlewares/errorHandler'
import { apiRouter } from './routes'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientUrl }))
app.use(express.json())
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

app.use('/api', apiRouter)

app.use(notFound)
app.use(errorHandler)
