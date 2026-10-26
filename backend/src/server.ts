import { createServer } from 'http'
import { app } from './app'
import { connectDB } from './config/db'
import { env } from './config/env'
import { ensureDefaultCategories } from './services/categories.service'
import { attachSocket } from './services/socket.service'

async function bootstrap(): Promise<void> {
  try {
    await connectDB()
    await ensureDefaultCategories()
  } catch (error) {
    console.error('No se pudo conectar a MongoDB:', error)
    process.exit(1)
  }

  const server = createServer(app)
  attachSocket(server)
  server.listen(env.port, () => {
    console.log(`API escuchando en el puerto ${env.port}`)
  })
}

void bootstrap()
