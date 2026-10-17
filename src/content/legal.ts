import type { LegalSection } from '../types'

export const LEGAL_UPDATED = '15 de octubre de 2026'

export const privacySections: LegalSection[] = [
  {
    id: 'alcance',
    title: 'Alcance de esta política',
    paragraphs: [
      'Neko Sensei es una plataforma que conecta a estudiantes con tutores para clases presenciales o virtuales. Esta política explica qué datos personales recopilamos, para qué los usamos y cómo puedes controlarlos.',
      'La plataforma se encuentra en desarrollo y se publica por etapas, por lo que algunas funciones descritas aquí se activarán en versiones posteriores.',
    ],
  },
  {
    id: 'datos',
    title: 'Datos que recopilamos',
    items: [
      'Cuenta de Google: nombre, correo electrónico y foto de perfil, que recibimos al iniciar sesión con Google.',
      'Perfil: teléfono, género, dirección y ubicación en el mapa, documento de identificación y categorías de interés.',
      'Perfil de tutor: biografía, portafolio o documento de respaldo, tarifa por hora y tarifa por kilómetro de traslado.',
      'Actividad en la plataforma: reservas, suscripciones, calificaciones, reseñas y denuncias.',
      'Mensajes enviados a través del chat entre estudiantes y tutores.',
      'Datos técnicos mínimos, como el token de sesión que mantiene tu acceso.',
    ],
  },
  {
    id: 'uso',
    title: 'Cómo usamos tus datos',
    items: [
      'Crear y administrar tu cuenta y tu perfil.',
      'Mostrarte tutores o estudiantes que coincidan con tu búsqueda.',
      'Calcular distancias y costos de traslado en las clases presenciales.',
      'Gestionar tu agenda, evitar traslapes de horario y administrar suscripciones.',
      'Permitir la comunicación mediante el chat.',
      'Mostrar calificaciones y reseñas, y moderar denuncias para mantener un entorno seguro.',
      'Verificar y aprobar a los tutores antes de que publiquen sus ofertas.',
    ],
  },
  {
    id: 'compartir',
    title: 'Con quién compartimos tus datos',
    paragraphs: ['No vendemos tus datos personales. Solo se comparten en los siguientes casos:'],
    items: [
      'Con otros usuarios: tu nombre, foto, biografía, tarifas y calificaciones forman parte de tu perfil visible.',
      'Con la otra parte de una reserva: la información necesaria para coordinar la clase, incluida la ubicación en las clases presenciales.',
      'Con el equipo administrador: para aprobar tutores, moderar denuncias y atender apelaciones.',
      'Con servicios técnicos: Google para el inicio de sesión, OpenStreetMap para mapas y rutas, y los proveedores de alojamiento de la plataforma.',
    ],
  },
  {
    id: 'ubicacion',
    title: 'Ubicación y mapas',
    paragraphs: [
      'Usamos la dirección que registras para calcular la distancia entre estudiante y tutor y estimar el costo de traslado. La dirección exacta solo se comparte con la otra parte cuando existe una reserva presencial.',
    ],
  },
  {
    id: 'sesion',
    title: 'Sesión y almacenamiento en el navegador',
    paragraphs: [
      'Para mantener tu sesión guardamos un token firmado en tu navegador. Este token tiene una duración limitada y, cuando expira o deja de ser válido, la sesión se cierra automáticamente.',
      'No utilizamos cookies publicitarias ni rastreadores de terceros con fines de publicidad.',
    ],
  },
  {
    id: 'seguridad',
    title: 'Conservación y seguridad',
    paragraphs: [
      'Aplicamos medidas razonables para proteger tu información, como autenticación mediante tokens firmados, comunicaciones cifradas y acceso restringido según el rol de cada usuario. Ningún sistema es completamente infalible, por lo que no podemos garantizar una seguridad absoluta.',
      'Conservamos tus datos mientras tu cuenta esté activa o sea necesario para cumplir las finalidades descritas en esta política.',
    ],
  },
  {
    id: 'derechos',
    title: 'Tus derechos',
    paragraphs: ['Puedes solicitarnos en cualquier momento que:'],
    items: [
      'Te mostremos los datos personales que tenemos sobre ti.',
      'Corrijamos los datos que sean inexactos o estén desactualizados.',
      'Eliminemos tu cuenta y los datos asociados, salvo los que debamos conservar por motivos de seguridad o moderación.',
    ],
  },
  {
    id: 'menores',
    title: 'Personas menores de edad',
    paragraphs: [
      'La plataforma está dirigida a personas mayores de edad. Los menores solo deben usarla con la supervisión de su madre, padre o tutor legal, quien será responsable de la cuenta.',
    ],
  },
  {
    id: 'cambios',
    title: 'Cambios y contacto',
    paragraphs: [
      'Podemos actualizar esta política cuando la plataforma cambie. La fecha de la última actualización aparece al inicio del documento.',
      'Si tienes dudas o quieres ejercer tus derechos, escríbenos desde la página de contacto o por los canales indicados al final de la página.',
    ],
  },
]

export const termsSections: LegalSection[] = [
  {
    id: 'aceptacion',
    title: 'Aceptación de los términos',
    paragraphs: [
      'Al crear una cuenta o usar Neko Sensei aceptas estos términos y la política de privacidad. Si no estás de acuerdo con ellos, te pedimos que no utilices la plataforma.',
    ],
  },
  {
    id: 'servicio',
    title: 'Descripción del servicio',
    paragraphs: [
      'Neko Sensei es un espacio que facilita el contacto entre estudiantes y tutores para clases presenciales o virtuales. La plataforma actúa como intermediaria: no es la empleadora de los tutores ni imparte las clases por sí misma.',
    ],
  },
  {
    id: 'cuentas',
    title: 'Cuentas y roles',
    items: [
      'El acceso se realiza con una cuenta de Google.',
      'Existen tres roles: estudiante, tutor y administrador.',
      'Debes completar tu perfil con datos verdaderos y mantenerlos actualizados.',
      'Eres responsable de la actividad que ocurra en tu cuenta.',
    ],
  },
  {
    id: 'tutores',
    title: 'Obligaciones de los tutores',
    items: [
      'Aportar información veraz sobre su experiencia, biografía y portafolio.',
      'Esperar la aprobación del equipo administrador antes de publicar ofertas.',
      'Mantener su disponibilidad al día y cumplir las sesiones que aprueben.',
      'Definir tarifas claras, incluida la tarifa por kilómetro cuando ofrezcan clases presenciales.',
    ],
  },
  {
    id: 'estudiantes',
    title: 'Obligaciones de los estudiantes',
    items: [
      'Proporcionar datos de contacto y ubicación correctos para coordinar las sesiones.',
      'Asistir a las clases reservadas o cancelarlas con anticipación.',
      'Tratar con respeto a los tutores y a los demás usuarios.',
    ],
  },
  {
    id: 'reservas',
    title: 'Reservas, calendario y suscripciones',
    items: [
      'Una reserva comienza como solicitud pendiente y se confirma cuando el tutor la aprueba.',
      'El sistema no permite reservas que se traslapen en el horario del tutor ni del estudiante.',
      'Las suscripciones recurrentes pueden contratarse por 4 u 8 semanas, con días y horarios fijos.',
      'Las condiciones de cancelación se informan al momento de reservar.',
    ],
  },
  {
    id: 'tarifas',
    title: 'Tarifas y traslados',
    paragraphs: [
      'Cada tutor define sus tarifas. En las clases presenciales, la plataforma estima el costo de traslado según la distancia y muestra un desglose antes de confirmar la reserva.',
      'Los costos mostrados son estimaciones informativas. La forma de pago se acuerda entre el estudiante y el tutor.',
    ],
  },
  {
    id: 'resenas',
    title: 'Calificaciones y reseñas',
    paragraphs: [
      'Solo pueden calificar quienes hayan completado una sesión. Las reseñas deben ser honestas y respetuosas. La plataforma puede retirar reseñas que incumplan estos términos.',
    ],
  },
  {
    id: 'conducta',
    title: 'Conducta, denuncias y suspensión',
    items: [
      'Está prohibido el acoso, la discriminación, la suplantación de identidad y el uso de la plataforma con fines ilegales.',
      'Cualquier usuario puede denunciar a otro; el equipo administrador revisa cada caso.',
      'Las cuentas que incumplan los términos pueden ser suspendidas.',
      'Si tu cuenta es suspendida, podrás enviar una apelación y solicitar su revisión.',
    ],
  },
  {
    id: 'propiedad',
    title: 'Propiedad intelectual',
    paragraphs: [
      'El diseño, el código y la marca Neko Sensei pertenecen a sus autores. Los contenidos que publiques, como tu biografía o tus ofertas, siguen siendo tuyos, pero nos autorizas a mostrarlos dentro de la plataforma.',
    ],
  },
  {
    id: 'responsabilidad',
    title: 'Limitación de responsabilidad',
    paragraphs: [
      'Neko Sensei facilita el contacto entre usuarios, pero no garantiza los resultados de las clases ni responde por acuerdos o conductas de terceros fuera de la plataforma. Recomendamos tomar precauciones razonables, sobre todo en las clases presenciales.',
      'La plataforma se ofrece en su estado actual y puede presentar interrupciones o cambios mientras se encuentra en desarrollo.',
    ],
  },
  {
    id: 'cambios',
    title: 'Cambios y contacto',
    paragraphs: [
      'Podemos modificar estos términos cuando sea necesario. La fecha de la última actualización aparece al inicio del documento y el uso continuado de la plataforma implica la aceptación de los cambios.',
      'Para cualquier consulta, escríbenos desde la página de contacto o por los canales indicados al final de la página.',
    ],
  },
]
