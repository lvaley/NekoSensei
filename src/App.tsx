import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { GOOGLE_CLIENT_ID } from './config/site'
import { AuthProvider } from './context/AuthProvider'
import { ChatProvider } from './context/ChatProvider'
import { AppRouter } from './routes/AppRouter'

export default function App() {
  const app = (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <AppRouter />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  )

  // Sin Client ID el proveedor de Google no se monta y el login muestra un aviso
  return GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider> : app
}
