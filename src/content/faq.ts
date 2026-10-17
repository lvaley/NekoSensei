import type { FaqCategory } from '../types'

export const faqCategories: FaqCategory[] = [
  {
    id: 'general',
    title: 'General',
    items: [
      {
        question: '¿Qué es Neko Sensei?',
        answer:
          'Es una plataforma que conecta a estudiantes con tutores para clases presenciales o virtuales, en áreas como idiomas, deportes, ciencias y tecnología.',
      },
      {
        question: '¿Cómo inicio sesión?',
        answer:
          'Con tu cuenta de Google. Al ingresar por primera vez te pediremos completar tu perfil con teléfono, género, dirección en el mapa, documento de identificación y tus categorías de interés.',
      },
      {
        question: '¿Qué materias puedo encontrar en la plataforma?',
        answer:
          'Los tutores publican cursos en distintas categorías y niveles, desde refuerzo escolar hasta idiomas, tecnología o preparación para exámenes. Puedes explorar el catálogo y filtrar por materia, modalidad y precio.',
      },
    ],
  },
  {
    id: 'estudiantes',
    title: 'Para estudiantes',
    items: [
      {
        question: '¿Cómo encuentro al tutor ideal?',
        answer:
          'Usa el buscador con filtros por categoría, precio, calificación en estrellas, distancia y modalidad para ver solo los tutores que se ajustan a lo que necesitas.',
      },
      {
        question: '¿Qué modalidades de clase hay?',
        answer:
          'Puedes elegir clases virtuales, en el domicilio del tutor o en tu domicilio. Cada tutor indica las modalidades que ofrece.',
      },
      {
        question: '¿Cómo se calcula el costo de traslado?',
        answer:
          'En las clases presenciales calculamos la distancia entre ambas ubicaciones, la mostramos en el mapa y aplicamos la tarifa por kilómetro del tutor. Verás el desglose del presupuesto antes de reservar.',
      },
      {
        question: '¿Puedo reservar varias clases a la vez?',
        answer:
          'Sí. Puedes contratar una suscripción recurrente de 4 u 8 semanas, con días y horarios fijos.',
      },
      {
        question: '¿Qué pasa si dos clases coinciden en horario?',
        answer:
          'El sistema no permite traslapes: no podrás reservar una sesión que coincida con otra de tu agenda ni con una del tutor.',
      },
    ],
  },
  {
    id: 'tutores',
    title: 'Para tutores',
    items: [
      {
        question: '¿Cómo me convierto en tutor?',
        answer:
          'Crea tu cuenta, elige el rol de tutor y completa los datos adicionales: biografía, portafolio o documento de respaldo y tarifa por hora. Después, el equipo administrador revisa y aprueba tu perfil.',
      },
      {
        question: '¿Cómo defino mi disponibilidad?',
        answer:
          'Desde tu panel configuras los días y horas en que atiendes. Los estudiantes solo podrán reservar dentro de esos espacios.',
      },
      {
        question: '¿Puedo cobrar el traslado?',
        answer:
          'Sí. Si ofreces clases presenciales, defines una tarifa por kilómetro y el estudiante la ve reflejada en el presupuesto antes de confirmar.',
      },
    ],
  },
  {
    id: 'seguridad',
    title: 'Seguridad y cuenta',
    items: [
      {
        question: '¿Cómo califico una clase?',
        answer:
          'Al completar una sesión puedes dejar una calificación de 1 a 5 estrellas y una reseña. Las valoraciones alimentan el promedio visible del tutor.',
      },
      {
        question: '¿Cómo denuncio a un usuario?',
        answer:
          'Desde su perfil o desde el chat puedes enviar una denuncia. El equipo administrador la revisa y toma las medidas necesarias.',
      },
      {
        question: '¿Qué pasa si mi cuenta es suspendida?',
        answer:
          'Verás una pantalla que te explica el motivo y te permite enviar una apelación. Si el equipo administrador la acepta, tu cuenta se reactiva.',
      },
      {
        question: '¿Cómo protegen mis datos?',
        answer:
          'Usamos autenticación con tokens firmados, comunicaciones cifradas y acceso restringido por rol. Puedes conocer los detalles en la política de privacidad.',
      },
    ],
  },
]
