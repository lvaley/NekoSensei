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
│       ├── components/   # layout, ui (PageHero, LocationPicker, SearchFilters, OfferCard, TutorCard, TutorsMap...), auth y profile (ProfileForm)
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
        ├── controllers/  # health, contacto, auth, users, profile, categories, tutors, offers, public, enrollments, sessions
        ├── models/       # ContactMessage, User, Category, Offer, Enrollment, Session
        ├── services/     # verificación de Google, JWT, catálogo inicial y distancias (Haversine)
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
| `/tutores` | Directorio público de tutores aprobados: filtros, vista de lista o mapa |
| `/tutores/:id` | Perfil público de un tutor con sus cursos |
| `/cursos` | Cursos (ofertas) publicados, con filtros, distancia y costo de traslado |
| `/mis-ofertas` | Gestión de ofertas del tutor: crear, editar, ocultar y eliminar (solo tutor) |
| `/mis-cursos` | Estudiante: cursos activos, solicitudes, historial y "Mis tutores" (solo estudiante) |
| `/mis-estudiantes` | Tutor: aceptar o rechazar solicitudes, estudiantes activos e historial (solo tutor) |
| `/agenda` | Calendario mensual de clases con agendado, cancelación y "marcar realizada" (estudiante y tutor) |

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
| GET | `/api/public/categories` | Categorías activas en árbol, sin sesión |
| GET | `/api/public/stats` | Cifras públicas del inicio: tutores, cursos, calificación y cursos por categoría |
| GET | `/api/tutors` | Tutores aprobados (público). Filtros: `q`, `category`, `mode`, `maxPrice`, `lat`, `lng`, `maxKm` |
| GET | `/api/tutors/:id` | Perfil público de un tutor y sus ofertas activas |
| GET | `/api/offers` | Cursos activos de tutores aprobados (mismos filtros) |
| GET / POST | `/api/my/offers` | Listar y crear las ofertas propias (solo tutor aprobado para crear) |
| PUT / DELETE | `/api/my/offers/:id` | Editar y eliminar una oferta propia |
| POST | `/api/enrollments` | El estudiante solicita un curso (queda pendiente) |
| GET | `/api/enrollments` | Inscripciones propias (como estudiante o como tutor según el rol) |
| PATCH | `/api/enrollments/:id/decision` | El tutor acepta (`accept`) o rechaza (`reject`, con motivo) |
| PATCH | `/api/enrollments/:id/cancel` · `/finish` | Cancelar (estudiante solo si está pendiente o por pagar; el tutor siempre) · finalizar (tutor) |
| GET | `/api/offers/:id/plan-slots?mode=&startDate=` | Estudiante: horarios fijos semanales libres y precio del plan antes de solicitarlo |
| POST | `/api/enrollments/:id/pay` | Estudiante: pago simulado del primer bloque (tras la aceptación) o de una renovación |
| POST | `/api/enrollments/:id/renew` | Estudiante: abre el cobro de otro bloque (renovación manual) |
| GET | `/api/tutors/:id/reviews` | Reseñas públicas de un tutor, promedio y cantidad (sin sesión) |
| POST | `/api/enrollments/:id/review` | Estudiante: califica (1–5 y comentario) tras una clase realizada |
| GET / POST | `/api/conversations` | Mis conversaciones (último mensaje y sin leer) · abrir o crear la conversación con otra persona |
| GET | `/api/conversations/:id` · `/:id/messages` · `/unread-count` | Datos de la conversación · mensajes (`?before=` para los anteriores) · total sin leer |
| POST | `/api/conversations/:id/messages` · `/read` | Enviar un mensaje · marcar como leídos los recibidos |
| GET | `/api/payments` | Historial de pagos: el estudiante los que hizo, el tutor los que recibió |
| GET | `/api/sessions?from=&to=` | Clases propias en un rango de fechas |
| POST | `/api/enrollments/:id/sessions` | Agendar una clase en una inscripción activa (sin choques de horario) |
| GET | `/api/sessions/:id/detail` | Detalle de una clase: curso, costo, enlace o lugar y, si hay traslado, la ruta (estudiante o tutor de esa clase) |
| GET | `/api/offers/:id/travel` | Estudiante: ruta y traslado de un curso a domicilio antes de solicitarlo |
| GET | `/api/enrollments/:id/travel` | Tutor o estudiante: ruta y traslado de una inscripción a domicilio pendiente o activa |
| GET | `/api/notifications` | Últimos avisos del usuario y cuántos están sin leer |
| PATCH | `/api/notifications/:id/read` · `/read-all` | Marcar un aviso o todos como leídos |
| PATCH | `/api/sessions/:id/cancel` · `/complete` | Cancelar una clase · marcarla realizada (tutor, una vez iniciada) |
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

- ## Ofertas, búsqueda y traslado (v0.4)

- **Ofertas:** cada tutor aprobado publica cursos con título, descripción, categoría, precio por hora y modalidades: *virtual*, *en casa del tutor* o *a domicilio*. Las ofertas ocultas o de tutores no aprobados no aparecen en el catálogo.
- **Catálogo público:** `/tutores` y `/cursos` se pueden explorar sin iniciar sesión. Los filtros viven en la URL (`?q=&category=&mode=&maxPrice=&maxKm=`), así que una búsqueda se puede compartir. Elegir una categoría principal incluye sus subcategorías.
- **Distancia y traslado:** si la persona tiene dirección registrada, el servidor calcula la distancia con la fórmula de Haversine y ordena por cercanía. En la modalidad a domicilio el traslado estimado es `km × tarifa por km del tutor`, y solo se ofrece dentro de su distancia máxima.
- **Privacidad:** el catálogo nunca expone teléfono, DPI, correo ni la dirección exacta; el mapa usa coordenadas redondeadas a 2 decimales (~1 km).

## Inscripciones y agenda (v0.5)

- **Inscripción = suscripción a un curso:** el estudiante la solicita desde el catálogo (con modalidad y un mensaje), el tutor la **acepta o rechaza** (el rechazo lleva motivo) y queda *activa* hasta que se cancele o el tutor la finalice. No se puede duplicar una solicitud abierta del mismo curso, y se conserva una copia del título y precio para el historial aunque el tutor edite o borre la oferta.
- **Menús separados por rol:** el estudiante ve *Mis cursos* (activos, solicitudes, historial y sus tutores), *Agenda*, *Tutores* y *Cursos*; el tutor ve *Mis ofertas*, *Mis estudiantes* y *Agenda*. El catálogo sigue siendo público para visitantes.
- **Agenda:** tutor o estudiante agendan clases (30 a 240 min, hasta 180 días de anticipación) dentro de una inscripción activa. El servidor **rechaza choques de horario** tanto del tutor como del estudiante. Un curso no admite más clases agendadas que las que incluye (las canceladas no cuentan) y *Mis cursos* muestra el progreso. Al cancelar o finalizar una inscripción se cancelan sus clases futuras. Solo el tutor marca una clase como realizada, y únicamente cuando ya empezó.

### Clases individuales y grupales
- **Individual:** cada estudiante tiene su propia inscripción y clases 1 a 1.
- **Grupal:** el tutor define de 2 a 20 cupos. Solo la modalidad virtual o en casa del tutor lo permite (a domicilio es siempre individual).
- **Cupos:** los ocupan las inscripciones *activas*. Una solicitud pendiente no reserva cupo, y el tutor no puede aceptar más estudiantes de los que caben. Con el grupo lleno el catálogo muestra "Sin cupos".
- **Agenda grupal:** solo el tutor agenda. Al hacerlo, la clase se crea a la misma hora para todos los inscritos activos (se omite a quien tenga un horario cruzado o ya haya completado sus clases). El tutor ve una sola clase con la lista de asistentes; si la cancela o la marca como realizada, aplica a todo el grupo, y si un estudiante cancela, solo se retira él.
- **Filtro:** `?classType=individual|group` en el catálogo.

### Enlace de la reunión virtual
- Si una oferta incluye la modalidad virtual, el tutor debe indicar el enlace de la reunión (Meet, Zoom, Teams…; solo `http(s)`, máx. 300 caracteres).
- **No es público:** el catálogo y el perfil del tutor nunca lo muestran. Solo lo reciben el tutor y los estudiantes con inscripción *activa* en modalidad virtual, en "Mis cursos" y con el botón "Unirse a la clase" en la agenda (solo clases programadas).
- Si el tutor cambia el enlace, todos ven el vigente. Las ofertas virtuales anteriores muestran un aviso hasta que el tutor agregue el enlace.

### Disponibilidad, cobertura y traslado
- **Franjas semanales:** cada oferta define los días y horarios en que se imparte (por ejemplo, Lun–Vie 15:00–18:00), en hora de Guatemala (UTC-6), en bloques de 15 minutos. Cada franja debe caber al menos una clase y no pueden solaparse.
- **Horarios compatibles:** `GET /api/enrollments/:id/slots` devuelve solo los horarios en que se puede agendar: dentro de las franjas, sin choques con otras clases del tutor ni del estudiante, y con 2 horas de anticipación como mínimo. La agenda del servidor vuelve a validar el horario, así que no se puede saltar desde la API. Cada clase dura lo que dura el curso.
- **Virtual y en casa del tutor:** se agenda solo dentro de las franjas (tutor o estudiante; en grupos, solo el tutor).
- **A domicilio:** solo el estudiante elige fecha y hora, y únicamente ve horarios con tiempo de traslado suficiente.
  - *Cobertura:* solo puede solicitarlo si su dirección está dentro de los km máximos de traslado del curso.
  - *Traslado:* se estima por distancia entre ubicaciones (la casa de cada estudiante para clases a domicilio, la base del tutor para las demás) a 2 min por km (~30 km/h), en bloques de 15 minutos, y se exige antes y después de cada clase.
- **Ofertas anteriores:** sin franjas se siguen agendando con horario libre hasta que el tutor las defina.

### Quién agenda y reagendar clases a domicilio
- **Virtual y en casa del tutor:** solo el tutor agenda. El estudiante ve sus clases en la agenda (con el botón "Unirse" en las virtuales) pero no puede crearlas.
- **A domicilio:** solo el estudiante elige fecha y hora, entre los horarios compatibles.
- **Reagendar (solo a domicilio):** el estudiante pulsa *Reagendar* e indica el motivo (5–300 caracteres). La clase se mantiene en su horario mientras tanto y solo puede haber una solicitud abierta por clase.
  1. El tutor la ve en su agenda y pulsa *Responder*: **propone un nuevo horario** entre los que permite su agenda (franjas, choques y traslado; la propia clase cuenta como libre) o **la rechaza** con una nota obligatoria.
  2. Si propone, el estudiante **acepta** (la clase se mueve y se cierra la solicitud) o **rechaza** (la clase se queda como estaba). Si antes de aceptar el horario se ocupó, se avisa y la solicitud vuelve a quedar pendiente para que el tutor proponga otro.
  3. Tras un rechazo o una propuesta rechazada, el estudiante puede volver a solicitar.
- Endpoints: `POST /api/sessions/:id/reschedule` (estudiante), `GET .../reschedule/slots`, `POST .../reschedule/propose` y `POST .../reschedule/decline` (tutor), `POST .../reschedule/respond` (estudiante).

### Planes por bloques, pago simulado y renovación

- **Plan del curso:** el tutor define *semanas* (1–26) y *clases por semana* (1–7) de cada oferta; el total de clases se calcula (`semanas × clases por semana`). Las ofertas anteriores sin plan siguen funcionando con agenda manual.
- **Flujo:** `pendiente → (el tutor acepta) → por pagar → (el estudiante paga) → activa`. Si no se paga en **48 horas** la inscripción pasa a *vencida* y se libera el horario. Estados finales: finalizada, cancelada, rechazada, vencida.
- **Horarios fijos (clases individuales):** al solicitar, el estudiante elige fecha de inicio y sus días y horas fijos de cada semana entre los que están libres (franjas del tutor, sin choques ni traslados imposibles). Mientras la solicitud está pendiente o por pagar, esos horarios quedan **reservados** y los cupos grupales también se cuentan.
- **Cobro:** `clases + traslado (solo a domicilio) = total` del bloque, calculado en el servidor. Al pagar se crean **todas las clases del bloque**; si alguna choca con otra clase agendada mientras tanto, se omite y se puede reponer.
- **Pago simulado:** no se mueve dinero real. Cualquier tarjeta con formato válido (13–19 dígitos, vencimiento futuro, CVV de 3–4 dígitos) se aprueba. Para probar rechazos, el servidor decide por los **últimos 4 dígitos**: `0002` → el banco rechaza el pago, `9995` → fondos insuficientes, `0069` → tarjeta bloqueada o vencida (se guarda un pago *Rechazado*). Se guarda únicamente la marca y los últimos 4 dígitos: el número completo y el CVV nunca se almacenan. En la interfaz no se menciona que es una simulación.
- **Renovación manual:** cuando queda una semana de clases o menos aparece *Renovar plan*; abre otro cobro por el mismo plan y los mismos horarios, empezando después de la última clase. Se paga igual y suma otro bloque (*Bloque 2*…).
- **Mis pagos / Pagos recibidos:** `/pagos`, con concepto, clases, traslado, total, tarjeta y estado (incluye rechazos del estudiante).

### Notificaciones (campanita)

El header muestra una campanita (estudiante y tutor) con el número de avisos sin leer; se actualiza cada 30 s y al abrirla. Cada aviso lleva a la página donde se continúa la gestión. El servidor los genera cuando: llega una solicitud de inscripción (tutor), se acepta o rechaza (estudiante), se cancela una inscripción, se agenda o cancela una clase (la otra parte), y en todo el flujo de reagendar: solicitud (tutor), horario propuesto o rechazo del tutor (estudiante), y aceptación o rechazo de la propuesta (tutor). Cada usuario solo ve los suyos y los textos no incluyen datos de contacto.

### Detalle de la clase y traslado con ruta

Cada clase de la agenda tiene el botón **Ver detalle** (estudiante y tutor). Muestra el curso (categoría, nivel, tipo), fecha y horario, avance (*Clase 3 de 6*), la otra persona (o el grupo, solo para el tutor), el enlace de la reunión si es virtual, el lugar y el **costo** (clase + traslado + total).

En las clases **a domicilio** y **en casa del tutor** se dibuja un mapa con el punto de salida, el destino y la ruta. El backend consulta un servicio de rutas OSRM (`router.project-osrm.org` por defecto; configurable con `OSRM_URL`) para obtener los **kilómetros y minutos reales por calles**; las rutas se guardan 24 h en memoria. Si el servicio no responde, se muestra la línea recta (punteada) y la pantalla sigue funcionando. La cobertura y la tarifa de traslado siguen usando los km en línea recta entre las direcciones, igual que el catálogo. Quien se desplaza ve el botón **Cómo llegar (Google Maps)**.

Privacidad: a domicilio, el tutor ve la dirección exacta del estudiante, pero el estudiante solo ve una zona aproximada del punto de salida del tutor (redondeada a ~1 km). En casa del tutor, el estudiante recibe la dirección del tutor para poder asistir; el tutor no ve la dirección del estudiante. En clases canceladas o realizadas no se muestran direcciones ni ruta.

### Ruta y traslado antes de inscribirse y antes de aceptar

La ruta no espera a que exista una clase: en un curso **a domicilio**, el estudiante ve el mapa, los km y minutos, si su casa está dentro de la cobertura y el **costo de traslado estimado** (por clase y para todo el curso) al abrir *Solicitar curso*. El tutor ve lo mismo en **Mis estudiantes → Ver ruta** mientras decide si acepta (y también después); el estudiante lo ve en **Mis cursos → Ver traslado**. Privacidad: antes de aceptar, el tutor solo ve una zona aproximada (~1 km) de la casa del estudiante; la dirección exacta aparece al aceptar. El estudiante nunca ve la dirección exacta del tutor.

### Reseñas y calificaciones (v0.6)

- **Quién y cuándo:** solo el estudiante, tras al menos una clase *realizada* de su inscripción. Una reseña por inscripción: 1 a 5 estrellas (enteras) y un comentario de 10 a 500 caracteres. No se edita ni se borra: queda registrada para auditoría.
- **Promedio inmediato:** se calcula al consultar, así que cada reseña nueva actualiza al instante la calificación del tutor (con cantidad de reseñas) en el directorio, los cursos y su perfil. El tutor recibe un aviso.
- **Filtro:** `?minRating=` en `/api/tutors` y `/api/offers` (4.5, 4 o 3 estrellas o más).
- **Privacidad:** las reseñas públicas muestran solo el nombre y la inicial del apellido ("Sofía R."); nunca el correo.
- Interfaz: botón **Calificar** en *Mis cursos* (cuando ya se realizó una clase) y lista de reseñas en el perfil del tutor.

### Chat en tiempo real (v0.6)

- **Quién puede escribir:** un estudiante a cualquier tutor aprobado (para resolver dudas antes de inscribirse); un tutor solo a estudiantes que tengan o hayan tenido una inscripción con él. Una conversación por pareja.
- **Mensajes:** hasta 1000 caracteres, con **hora** y **confirmación de lectura** (✓ enviado, ✓✓ leído). Las dos personas reciben los mensajes nuevos en vivo y el globito del menú muestra los no leídos.
- **Tiempo real:** Socket.io en el mismo servidor de la API. Cada persona se conecta con su JWT (`auth.token` del handshake) y entra a su sala privada; eventos `message:new` y `messages:read`. También se puede enviar y marcar leído por el socket (`message:send`, `messages:read`). Si el socket falla, todo sigue funcionando por HTTP.
- **Privacidad:** solo los dos participantes pueden leer o escribir en una conversación; un tercero recibe 404 y no le llegan eventos.
- **Despliegue:** el cliente deriva la URL del socket de `VITE_API_URL` (sin `/api`); `CLIENT_URL` del backend también es el origen permitido del socket. Render admite WebSockets.
- Interfaz: icono de mensajes junto a la campanita, página `/mensajes` (lista + conversación; en móvil una columna a la vez) y botón **Enviar mensaje** en el perfil del tutor, en *Mis cursos* y en *Mis estudiantes*.

### Compartir perfil por WhatsApp (v0.6)

El perfil de cada tutor tiene el botón **Compartir por WhatsApp**, que abre `https://wa.me/?text=…` con el resumen (nombre, categorías, calificación, tarifa base, número de cursos) y el enlace directo al perfil en la plataforma.

### Denuncias, suspensión y apelaciones (v0.7)

- **Quién denuncia:** estudiantes y tutores, solo contra la otra persona de una inscripción en común (el botón *Denunciar* está en la tarjeta del curso, en *Mis cursos* y *Mis estudiantes*). Motivo (acoso, fraude, contenido inapropiado, incumplimiento, suplantación u otro) y descripción de 10 a 1000 caracteres. Solo una denuncia abierta por pareja; la persona denunciada no recibe aviso.
- **Bandeja del administrador** (`/admin/denuncias`): denuncias *por revisar* y *cerradas*, con denunciante, denunciado y cuántas denuncias acumula. Estados: pendiente → en revisión → resuelta o descartada (estas dos con una nota que recibe quien denunció). Los administradores reciben un aviso por cada denuncia y apelación nueva.
- **Suspender una cuenta** (desde una denuncia o desde *Usuarios*): motivo de 10 a 500 caracteres. Al suspender, las denuncias abiertas contra esa persona quedan resueltas. No se puede suspender a un administrador.
- **Qué ve la persona suspendida:** puede iniciar sesión, pero toda la navegación se reduce a una única pantalla de *Cuenta suspendida* con el **motivo**, la **fecha**, un enlace a las **normas de convivencia** (`/convivencia`) y un **formulario de apelación** (20 a 1000 caracteres). El resto de la API responde `403` con `code: "account_suspended"` y el chat en tiempo real rechaza su conexión. Si es tutor, deja de aparecer en el catálogo y nadie puede inscribirse con él.
- **Apelación:** una a la vez. El administrador la **acepta** (la cuenta se reactiva y se avisa a la persona) o la **rechaza** con una respuesta que la persona ve en su pantalla; después puede enviar otra apelación. La cuenta sigue bloqueada hasta que se acepte una apelación (el administrador también puede reactivarla directamente).
- **Avisos a administradores (campanita):** nueva denuncia, nueva apelación, perfil de tutor por revisar (nuevo o reenviado tras un rechazo) y mensaje de contacto. Los mensajes de contacto se leen en `/admin/mensajes` (`GET /api/admin/contact-messages`).
- Endpoints: `POST /api/reports`; administrador: `GET /api/admin/reports?status=`, `PATCH /api/admin/reports/:id`, `GET /api/admin/suspensions`, `POST /api/admin/users/:id/suspend`, `POST /api/admin/users/:id/reactivate`, `PATCH /api/admin/users/:id/appeal`; persona suspendida: `POST /api/suspension/appeal` (y `GET /api/auth/me`, que incluye la suspensión).

## Versiones

| Versión | Estado | Contenido |
|---|---|---|
| v0.1 | ✅ | Estructura base, ESLint, SCSS, Bootstrap, API base con MongoDB, health check, identidad visual Neko Sensei, navbar y footer, páginas informativas (inicio, nosotros, FAQ, contacto, privacidad, términos, estado) y API de contacto |
| v0.2 | ✅ | Google OAuth, JWT con expiración configurable, roles (estudiante, tutor, administrador) y rutas protegidas |
| v0.3 | ✅ | Onboarding con mapa, perfil de tutor con revisión del administrador y catálogo de categorías (CRUD) |
| v0.4 | ✅ | Ofertas de tutores, catálogo público de tutores y cursos con búsqueda, mapa, distancia y costo de traslado |
| v0.5 | ✅ | Inscripciones con aprobación del tutor, agenda con calendario, menús por rol |
| v0.6 | ✅ | Reseñas y calificación promedio, chat en tiempo real (Socket.io), compartir perfil por WhatsApp |
| v0.7 | ✅ | Denuncias entre estudiantes y tutores, bandeja del administrador, suspensión de cuentas y apelaciones |
| v0.8 | ⏳ | Reportería |
| v1.0 | ⏳ | Manuales y entrega final |
