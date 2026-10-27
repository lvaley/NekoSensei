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

export const conductSections: LegalSection[] = [
  {
    id: 'proposito',
    title: 'Para qué existen estas normas',
    paragraphs: [
      'Neko Sensei conecta a estudiantes con tutores para que aprendan y enseñen en un ambiente seguro, respetuoso y confiable. Estas normas explican cómo esperamos que se comporte cada persona dentro de la plataforma y qué ocurre cuando no se cumplen.',
      'Se aplican a todas las cuentas (estudiantes, tutores y administradores) y a todo lo que ocurre a través de Neko Sensei: perfiles, solicitudes, chat, clases, pagos, reseñas y denuncias. Al crear una cuenta aceptas cumplirlas, junto con los términos y condiciones y la política de privacidad.',
    ],
  },
  {
    id: 'principios',
    title: 'Principios que nos guían',
    items: [
      'Respeto: tratamos a las demás personas como queremos ser tratados, sin importar su edad, género, origen, creencias o nivel de conocimiento.',
      'Honestidad: lo que publicamos y prometemos es verdadero y se cumple.',
      'Seguridad: nadie debe sentirse en riesgo, ni en una clase virtual ni en una presencial.',
      'Transparencia: los precios, horarios y condiciones se acuerdan a la vista y dentro de la plataforma.',
      'Responsabilidad: cada persona responde por sus actos y por el uso que hace de su cuenta.',
    ],
  },
  {
    id: 'todos',
    title: 'Lo que se espera de todas las personas',
    items: [
      'Usar un lenguaje cortés en el chat, en las clases y en las reseñas, incluso cuando haya desacuerdos.',
      'Brindar información real y actualizada en el perfil, sin suplantar a otra persona ni crear cuentas con datos falsos.',
      'Respetar la privacidad ajena: no compartir teléfonos, direcciones, fotos, conversaciones ni documentos de otra persona sin su permiso.',
      'No grabar clases, ni compartir su contenido, sin el consentimiento de las personas que participan.',
      'Usar la plataforma solo para fines educativos y de coordinación de clases.',
      'Proteger tu cuenta: no prestes tu acceso a otras personas y avisa si sospechas que alguien más lo usa.',
    ],
  },
  {
    id: 'estudiantes',
    title: 'Compromisos de los estudiantes',
    items: [
      'Presentarte a tus clases en el horario acordado y con puntualidad. Si no puedes asistir, solicita reagendar con tiempo desde la agenda.',
      'Pagar el bloque dentro de las 48 horas posteriores a la aceptación de tu solicitud; pasado ese plazo la inscripción vence y se libera el horario.',
      'En clases a domicilio, indicar una dirección real y estar disponible en ella a la hora acordada.',
      'Tratar al tutor con respeto y seguir las indicaciones razonables de la clase.',
      'Escribir reseñas honestas y basadas en tu experiencia real: no se editan ni se borran después de enviarlas.',
    ],
  },
  {
    id: 'tutores',
    title: 'Compromisos de los tutores',
    items: [
      'Mantener tu perfil, tu hoja de vida y tus ofertas veraces: no declares estudios, experiencia ni resultados que no puedas comprobar.',
      'Fijar tarifas, horarios y zona de cobertura claros, y respetar lo que ofreces en cada curso.',
      'Responder las solicitudes con prontitud y aceptar solo las clases que realmente puedes impartir.',
      'Llegar puntual a las clases y dictarlas completas; si necesitas cambiar un horario, propón una nueva fecha desde la plataforma.',
      'Cuidar la integridad de los estudiantes: nunca los presiones, intimides ni los expongas a contenido inapropiado.',
      'No cobrar de más ni pedir dinero adicional fuera de lo acordado en la inscripción.',
    ],
  },
  {
    id: 'clases',
    title: 'Clases virtuales y presenciales',
    items: [
      'Las clases virtuales se realizan en el enlace de reunión que comparte el tutor; no se deben distribuir ni usar para otros fines.',
      'Las clases presenciales deben hacerse en lugares adecuados. Si no te sientes seguro, puedes cancelar o pedir cambiar el lugar y reportarlo.',
      'En las clases a domicilio, el estudiante conoce la dirección del tutor solo de forma aproximada hasta que la inscripción se acepta; esa información es privada y solo se usa para llegar a la clase.',
      'Las clases grupales requieren respeto y colaboración entre todos los participantes.',
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos y acuerdos dentro de la plataforma',
    items: [
      'Los pagos, renovaciones y acuerdos de las clases contratadas en Neko Sensei se realizan dentro de la plataforma.',
      'No ofrezcas ni aceptes pagos por fuera para evitar el sistema, ni redirijas a otra persona a otro medio para cobrarle.',
      'No intentes engañar con cobros indebidos, comprobantes falsos o información de pago ajena.',
    ],
  },
  {
    id: 'comunicacion',
    title: 'Comunicación y reseñas',
    items: [
      'El chat es para coordinar y resolver dudas sobre las clases. No lo uses para publicidad, cadenas, spam ni mensajes ajenos al aprendizaje.',
      'No envíes contenido ofensivo, discriminatorio, violento o de carácter sexual.',
      'No amenaces ni acoses, tampoco después de terminar un curso.',
      'No ofrezcas ni pidas reseñas a cambio de beneficios, ni publiques reseñas falsas para beneficiar o perjudicar a alguien.',
    ],
  },
  {
    id: 'prohibido',
    title: 'Conductas que no se permiten',
    paragraphs: ['Las siguientes conductas son faltas graves y pueden llevar directamente a la suspensión de la cuenta:'],
    items: [
      'Acoso, amenazas, discriminación o cualquier forma de violencia o trato degradante.',
      'Fraude, estafa, cobros indebidos o suplantación de identidad.',
      'Contenido o comportamientos de carácter sexual hacia otra persona.',
      'Compartir datos personales de otra persona sin su autorización.',
      'Hacer denuncias falsas o malintencionadas para perjudicar a alguien.',
      'Intentar vulnerar, saturar o usar de forma indebida el sistema o las cuentas de otras personas.',
      'Incumplir de forma reiterada las clases acordadas sin aviso ni justificación.',
    ],
  },
  {
    id: 'denuncias',
    title: 'Cómo denunciar',
    paragraphs: [
      'Si una persona con la que tienes una inscripción incumple estas normas, puedes denunciarla desde la tarjeta del curso, en «Mis cursos» (estudiantes) o «Mis estudiantes» (tutores), con la opción «Denunciar».',
      'Elige el motivo y describe lo ocurrido con el mayor detalle posible (fechas, mensajes, lugar). La denuncia solo la ve el equipo de Neko Sensei: no se le informa a la persona denunciada. Te avisaremos cuando el equipo la cierre.',
      'Si estás en una situación de peligro inmediato, contacta primero a las autoridades locales; la plataforma no reemplaza ese apoyo.',
    ],
  },
  {
    id: 'revision',
    title: 'Cómo revisamos las denuncias',
    items: [
      'El administrador revisa cada denuncia considerando lo que describe quien denuncia y la actividad registrada en la plataforma.',
      'Una denuncia pasa por los estados pendiente, en revisión y, al cerrarse, resuelta o descartada, siempre con una nota para quien la presentó.',
      'Las denuncias se tratan con confidencialidad y buena fe: una persona nunca es sancionada solo por haber sido denunciada.',
    ],
  },
  {
    id: 'suspension',
    title: 'Suspensión de cuentas',
    paragraphs: [
      'Si se comprueba que una cuenta incumple estas normas, el administrador puede suspenderla indicando el motivo. Las faltas graves pueden suspenderse de inmediato.',
      'Una cuenta suspendida puede iniciar sesión, pero solo ve una pantalla con el motivo y la fecha de la suspensión, el enlace a estas normas y un formulario de apelación. Mientras dure la suspensión no puede usar el resto de la plataforma; si es tutor, deja de aparecer en el catálogo y no recibe nuevas inscripciones.',
    ],
  },
  {
    id: 'apelacion',
    title: 'Apelación',
    paragraphs: [
      'Si crees que la suspensión fue un error o ya corregiste la situación, puedes enviar una apelación explicando tu caso con claridad y aportando el contexto necesario. Se revisa una apelación a la vez.',
      'Tu cuenta permanece suspendida hasta que el administrador acepte la apelación. Si la rechaza, verás el motivo en la misma pantalla y podrás enviar una nueva apelación con más información.',
    ],
  },
  {
    id: 'cambios',
    title: 'Cambios en estas normas',
    paragraphs: ['Podemos actualizar estas normas para mejorar la convivencia o adaptarlas a nuevas funciones de la plataforma. La fecha de la última actualización aparece al inicio de esta página y, si el cambio es importante, te lo avisaremos.'],
  },
  {
    id: 'contacto',
    title: 'Dudas o sugerencias',
    paragraphs: ['Si tienes preguntas sobre estas normas o quieres hacer una sugerencia, escríbenos desde la página de contacto.'],
  },
]
