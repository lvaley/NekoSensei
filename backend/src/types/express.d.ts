import type { TokenPayload } from '../services/token.service'

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload
    }
  }
}

export {}
