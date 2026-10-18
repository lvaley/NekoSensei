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
│       ├── components/   # layout (Navbar, Footer), ui (PageHero, LegalDocument) y auth (ProtectedRoute, GoogleSignIn)
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
        ├── controllers/  # health, contacto, auth, users
        ├── models/       # ContactMessage, User
        ├── services/     # verificación de Google y JWT
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
| `/panel` | Panel del usuario (protegida: requiere sesión) |
| `/admin` | Usuarios registrados (protegida: solo rol administrador) |
| `/tutores`, `/cursos` | Marcadores "Próximamente" |

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor y de la base de datos |
| POST | `/api/contact` | Guarda un mensaje de contacto (valida datos, campo señuelo anti-spam) |
| POST | `/api/auth/google` | Verifica el ID token de Google, crea/actualiza el usuario y devuelve un JWT |
| GET | `/api/auth/me` | Usuario de la sesión actual (requiere JWT) |
| GET | `/api/users` | Lista de usuarios (requiere JWT con rol `admin`) |

## Autenticación (v0.2)

- **Google OAuth:** el frontend obtiene un ID token con Google Identity Services y el backend lo verifica con `google-auth-library`.
- **JWT:** el backend emite un token firmado con `JWT_SECRET`; su duración se configura con `JWT_EXPIRES_IN` (ej. `15m`, `1h`, `7d`). El frontend lo envía en `Authorization: Bearer <token>` y, ante un 401, cierra la sesión.
- **Roles:** `student`, `tutor` y `admin`. El rol se elige solo al crear la cuenta (estudiante o tutor); los correos de `ADMIN_EMAILS` son administradores.
- **Rutas protegidas:** `ProtectedRoute` en el frontend y `requireAuth` / `requireRole` en el backend.

## Versiones

| Versión | Estado | Contenido |
|---|---|---|
| v0.1 | ✅ | Estructura base, ESLint, SCSS, Bootstrap, API base con MongoDB, health check, identidad visual Neko Sensei, navbar y footer, páginas informativas (inicio, nosotros, FAQ, contacto, privacidad, términos, estado) y API de contacto |
| v0.2 | ✅ | Google OAuth, JWT con expiración configurable, roles (estudiante, tutor, administrador) y rutas protegidas |
| v0.3 | ⏳ | Onboarding, perfil de tutor, categorías |
| v0.4 | ⏳ | Ofertas, búsqueda, mapa y traslado |
| v0.5 | ⏳ | Agenda, calendario y suscripciones |
| v0.6 | ⏳ | Chat, WhatsApp, reseñas |
| v0.7 | ⏳ | Denuncias y suspensión |
| v0.8 | ⏳ | Reportería |
| v1.0 | ⏳ | Manuales y entrega final |
