import { Route, Routes } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { About } from '../pages/About'
import { ComingSoon } from '../pages/ComingSoon'
import { Contact } from '../pages/Contact'
import { Faq } from '../pages/Faq'
import { Home } from '../pages/Home'
import { NotFound } from '../pages/NotFound'
import { Privacy } from '../pages/Privacy'
import { Status } from '../pages/Status'
import { Terms } from '../pages/Terms'

// Secciones aún no implementadas: se reemplazarán por páginas reales en cada versión
const placeholders = [
  { path: 'tutores', title: 'Nuestros tutores' },
  { path: 'cursos', title: 'Cursos' },
  { path: 'login', title: 'Iniciar sesión' },
  { path: 'registro', title: 'Crear cuenta' },
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
        <Route path="status" element={<Status />} />
        {placeholders.map((page) => (
          <Route key={page.path} path={page.path} element={<ComingSoon title={page.title} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
