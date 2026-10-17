import { app } from './app'
import { connectDB } from './config/db'
import { env } from './config/env'

async function bootstrap(): Promise<void> {
  try {
    await connectDB()
  } catch (error) {
    console.error('No se pudo conectar a MongoDB:', error)
    process.exit(1)
  }

  app.listen(env.port, () => {
    console.log(`API escuchando en el puerto ${env.port}`)
  })
}

void bootstrap()
