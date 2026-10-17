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
│       ├── components/   # layout (Navbar, Footer) y ui (PageHero, LegalDocument)
│       ├── pages/        # Home, Nosotros, Preguntas frecuentes, Contacto, Privacidad, Términos, Estado
│       ├── content/      # textos de FAQ, legales y opciones de contacto
│       ├── config/       # datos del sitio (nombre, redes, contacto)
│       ├── routes/       # enrutador
│       ├── services/     # cliente Axios (JWT + manejo de 401)
│       └── styles/       # SCSS: variables, mixins y componentes
└── backend/
    └── src/
        ├── config/       # variables de entorno y conexión a MongoDB
        ├── controllers/  # health, contacto
        ├── models/       # ContactMessage
        ├── middlewares/  # 404 y manejo de errores
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
| `/tutores`, `/cursos`, `/login`, `/registro` | Marcadores "Próximamente" |

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor y de la base de datos |
| POST | `/api/contact` | Guarda un mensaje de contacto (valida datos, campo señuelo anti-spam) |

## Versiones

| Versión | Estado | Contenido |
|---|---|---|
| v0.1 | ✅ | Estructura base, ESLint, SCSS, Bootstrap, API base con MongoDB, health check, identidad visual Neko Sensei, navbar y footer, páginas informativas (inicio, nosotros, FAQ, contacto, privacidad, términos, estado) y API de contacto |
| v0.2 | ⏳ | Google OAuth, JWT, roles y rutas protegidas |
| v0.3 | ⏳ | Onboarding, perfil de tutor, categorías |
| v0.4 | ⏳ | Ofertas, búsqueda, mapa y traslado |
| v0.5 | ⏳ | Agenda, calendario y suscripciones |
| v0.6 | ⏳ | Chat, WhatsApp, reseñas |
| v0.7 | ⏳ | Denuncias y suspensión |
| v0.8 | ⏳ | Reportería |
| v1.0 | ⏳ | Manuales y entrega final |
