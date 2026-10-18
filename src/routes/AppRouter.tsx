import { lazy, Suspense } from 'react'
import { Spinner } from 'react-bootstrap'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { MainLayout } from '../components/layout/MainLayout'
import { About } from '../pages/About'
import { AdminCategories } from '../pages/AdminCategories'
import { AdminTutors } from '../pages/AdminTutors'
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

// Las pantallas con mapa (Leaflet) se cargan bajo demanda para no inflar el bundle inicial
const Onboarding = lazy(() => import('../pages/Onboarding').then((module) => ({ default: module.Onboarding })))
const Profile = lazy(() => import('../pages/Profile').then((module) => ({ default: module.Profile })))

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
        <Route
          element={
            <Suspense fallback={<Spinner animation="border" role="status" className="d-block mx-auto my-5" />}>
              <ProtectedRoute />
            </Suspense>
          }
        >
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="panel" element={<Dashboard />} />
          <Route path="perfil" element={<Profile />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin" element={<AdminUsers />} />
          <Route path="admin/tutores" element={<AdminTutors />} />
          <Route path="admin/categorias" element={<AdminCategories />} />
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
