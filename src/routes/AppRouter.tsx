import { lazy, Suspense } from 'react'
import { Spinner } from 'react-bootstrap'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { MainLayout } from '../components/layout/MainLayout'
import { About } from '../pages/About'
import { AdminCategories } from '../pages/AdminCategories'
import { AdminTutors } from '../pages/AdminTutors'
import { AdminUsers } from '../pages/AdminUsers'
import { Agenda } from '../pages/Agenda'
import { Contact } from '../pages/Contact'
import { Courses } from '../pages/Courses'
import { Dashboard } from '../pages/Dashboard'
import { Faq } from '../pages/Faq'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { MyCourses } from '../pages/MyCourses'
import { MyOffers } from '../pages/MyOffers'
import { MyStudents } from '../pages/MyStudents'
import { Payments } from '../pages/Payments'
import { NotFound } from '../pages/NotFound'
import { Privacy } from '../pages/Privacy'
import { Register } from '../pages/Register'
import { Status } from '../pages/Status'
import { Terms } from '../pages/Terms'
import { TutorDetail } from '../pages/TutorDetail'
import { Tutors } from '../pages/Tutors'

// Las pantallas con mapa (Leaflet) se cargan bajo demanda para no inflar el bundle inicial
const Onboarding = lazy(() => import('../pages/Onboarding').then((module) => ({ default: module.Onboarding })))
const Profile = lazy(() => import('../pages/Profile').then((module) => ({ default: module.Profile })))

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
        <Route element={<ProtectedRoute roles={['tutor']} />}>
          <Route path="mis-ofertas" element={<MyOffers />} />
          <Route path="mis-estudiantes" element={<MyStudents />} />
        </Route>
        <Route element={<ProtectedRoute roles={['student']} />}>
          <Route path="mis-cursos" element={<MyCourses />} />
        </Route>
        <Route element={<ProtectedRoute roles={['student', 'tutor']} />}>
          <Route path="agenda" element={<Agenda />} />
          <Route path="pagos" element={<Payments />} />
        </Route>
        {/* Catálogo público: se puede explorar sin iniciar sesión */}
        <Route path="tutores" element={<Tutors />} />
        <Route path="tutores/:id" element={<TutorDetail />} />
        <Route path="cursos" element={<Courses />} />
        <Route path="status" element={<Status />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
