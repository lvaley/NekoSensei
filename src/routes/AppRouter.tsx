import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { MainLayout } from '../components/layout/MainLayout'
import { About } from '../pages/About'
import { AdminUsers } from '../pages/AdminUsers'
import { ComingSoon } from '../pages/ComingSoon'
import { Contact } from '../pages/Contact'
import { Dashboard } from '../pages/Dashboard'
import { Faq } from '../pages/Faq'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { Privacy } from '../pages/Privacy'
import { Register } from '../pages/Register'
import { Status } from '../pages/Status'
import { Terms } from '../pages/Terms'

// Secciones aún no implementadas: se reemplazarán por páginas reales en cada versión
const placeholders = [
  { path: 'tutores', title: 'Nuestros tutores' },
  { path: 'cursos', title: 'Cursos' },
]

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="nosotros" element={<About />} />
        <Route path="ayuda" element={<Faq />} />
        <Route path="privacidad" element={<Privacy />} />
        <Route path="terminos" element={<Terms />} />
        <Route path="contacto" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Register />} />
        {/* Rutas protegidas: requieren sesión; /admin además exige el rol administrador */}
        <Route element={<ProtectedRoute />}>
          <Route path="panel" element={<Dashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin" element={<AdminUsers />} />
        </Route>
        <Route path="status" element={<Status />} />
        {placeholders.map((page) => (
          <Route key={page.path} path={page.path} element={<ComingSoon title={page.title} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
