# Neko Sensei — Plataforma de tutorías

Proyecto de clase · Desarrollo Web · Universidad Mariano Gálvez · Segundo semestre 2026

**Autor:** Luis Enrique Valey Osorio · Carnet 9490-21-16222

## Stack

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | React 19, Vite 8, TypeScript, SCSS, Bootstrap 5, React Router 7, Axios, ESLint | Netlify |
| Backend | Node.js, Express 5, TypeScript, Mongoose 9 | Render |
| Base de datos | MongoDB (Atlas) | MongoDB Atlas |

## Estructura

```
tutorias/
├── frontend/
│   └── src/
│       ├── components/   # layout, ui (PageHero, LocationPicker, AdminNav...), auth y profile (ProfileForm)
│       ├── pages/        # Home, Nosotros, Preguntas frecuentes, Contacto, Privacidad, Términos, Estado
│       ├── content/      # textos de FAQ, legales y opciones de contacto
│       ├── config/       # datos del sitio (nombre, redes, contacto)
│       ├── context/      # AuthProvider (sesión y usuario)
│       ├── routes/       # enrutador
│       ├── services/     # cliente Axios (JWT + manejo de 401)
│       └── styles/       # SCSS: variables, mixins y componentes
└── backend/
    └── src/
        ├── config/       # variables de entorno y conexión a MongoDB
        ├── controllers/  # health, contacto, auth, users, profile, categories, tutors
        ├── models/       # ContactMessage, User, Category
        ├── services/     # verificación de Google, JWT y catálogo inicial
        ├── serializers/  # formato público del usuario
        ├── middlewares/  # auth (requireAuth, requireRole), 404 y errores
        └── routes/       # /api
```
## Páginas disponibles

| Ruta | Descripción |
|---|---|
| `/` | Inicio con banner, características y pasos |
| `/nosotros` | Misión, visión, cómo funciona y valores |
| `/ayuda` | Preguntas frecuentes por categoría (acordeón) |
| `/contacto` | Formulario de contacto, canales directos e información útil |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos y condiciones |
| `/status` | Estado del sistema (consulta `/api/health`) |
| `/login` | Inicio de sesión con Google |
| `/registro` | Crear cuenta eligiendo rol (estudiante o tutor) y continuar con Google |
| `/onboarding` | Primer ingreso: rol, teléfono, género, DPI, dirección con mapa, categorías y datos de tutor (protegida) |
| `/panel` | Panel del usuario con el estado de revisión del tutor (protegida) |
| `/perfil` | Edición del perfil (protegida) |
| `/admin` | Usuarios registrados (protegida: solo administrador) |
| `/admin/tutores` | Bandeja de revisión de tutores: ver datos y hoja de vida, aprobar o rechazar (solo administrador) |
| `/admin/categorias` | CRUD de categorías y subcategorías (solo administrador) |
| `/tutores`, `/cursos` | Marcadores "Próximamente" |

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor y de la base de datos |
| POST | `/api/contact` | Guarda un mensaje de contacto (valida datos, campo señuelo anti-spam) |
| POST | `/api/auth/google` | Verifica el ID token de Google, crea/actualiza el usuario y devuelve un JWT |
| GET | `/api/auth/me` | Usuario de la sesión actual (requiere JWT) |
| PUT | `/api/profile` | Onboarding y edición del perfil (valida datos; el rol solo se elige en el primer ingreso) |
| GET | `/api/categories` | Catálogo en árbol (los admin ven también las ocultas) |
| POST / PUT / DELETE | `/api/categories` | Crear, editar y eliminar categorías (solo `admin`) |
| GET | `/api/users` | Lista de usuarios (solo `admin`) |
| GET | `/api/admin/tutors?status=` | Solicitudes de tutor por estado (solo `admin`) |
| PATCH | `/api/admin/tutors/:id/review` | Aprobar o rechazar un tutor, con motivo (solo `admin`) |
| GET | `/api/admin/tutors/:id/cv` | Descarga la hoja de vida en PDF (solo `admin`) |

## Autenticación (v0.2)

- **Google OAuth:** el frontend obtiene un ID token con Google Identity Services y el backend lo verifica con `google-auth-library`.
- **JWT:** el backend emite un token firmado con `JWT_SECRET`; su duración se configura con `JWT_EXPIRES_IN` (ej. `15m`, `1h`, `7d`). El frontend lo envía en `Authorization: Bearer <token>` y, ante un 401, cierra la sesión.
- **Roles:** `student`, `tutor` y `admin`. El rol se elige solo al crear la cuenta (estudiante o tutor); los correos de `ADMIN_EMAILS` son administradores.
- **Rutas protegidas:** `ProtectedRoute` en el frontend y `requireAuth` / `requireRole` en el backend.

## Onboarding, perfil y categorías (v0.3)

- **Onboarding obligatorio:** tras el primer inicio de sesión se redirige a `/onboarding` hasta completar los datos (los administradores están exentos). Incluye mapa interactivo (Leaflet + OpenStreetMap) para fijar las coordenadas de la dirección.
- **Tutores:** además piden biografía, tarifa por hora y hoja de vida (PDF de hasta 2 MB o enlace a portafolio). El perfil queda **pendiente** hasta que un administrador lo apruebe o rechace (con motivo). Si se rechaza y el tutor guarda cambios, vuelve a pendiente.
- **Catálogo:** al iniciar el backend por primera vez se crean categorías de ejemplo (idiomas, deportes, ciencias, tecnología y posgrado); el administrador las gestiona desde `/admin/categorias`.
- **PDF:** se guarda en MongoDB (no en disco, porque en Render el disco es efímero) y solo el administrador puede descargarlo.

## Versiones

| Versión | Estado | Contenido |
|---|---|---|
| v0.1 | ✅ | Estructura base, ESLint, SCSS, Bootstrap, API base con MongoDB, health check, identidad visual Neko Sensei, navbar y footer, páginas informativas (inicio, nosotros, FAQ, contacto, privacidad, términos, estado) y API de contacto |
| v0.2 | ✅ | Google OAuth, JWT con expiración configurable, roles (estudiante, tutor, administrador) y rutas protegidas |
| v0.3 | ✅ | Onboarding con mapa, perfil de tutor con revisión del administrador y catálogo de categorías (CRUD) |
| v0.4 | ⏳ | Ofertas, búsqueda, mapa y traslado |
| v0.5 | ⏳ | Agenda, calendario y suscripciones |
| v0.6 | ⏳ | Chat, WhatsApp, reseñas |
| v0.7 | ⏳ | Denuncias y suspensión |
| v0.8 | ⏳ | Reportería |
| v1.0 | ⏳ | Manuales y entrega final |
