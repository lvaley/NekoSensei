// Iconos (Bootstrap Icons) que el administrador puede asignar a una categoría principal. Deben coincidir con CATEGORY_ICONS del backend.
export const DEFAULT_CATEGORY_ICON = 'bi-journal-bookmark'

export const CATEGORY_ICON_OPTIONS: { icon: string; label: string }[] = [
  { icon: 'bi-translate', label: 'Idiomas' },
  { icon: 'bi-trophy', label: 'Deportes' },
  { icon: 'bi-calculator', label: 'Matemáticas' },
  { icon: 'bi-flask', label: 'Ciencias' },
  { icon: 'bi-laptop', label: 'Tecnología' },
  { icon: 'bi-code-slash', label: 'Programación' },
  { icon: 'bi-mortarboard', label: 'Posgrado' },
  { icon: 'bi-music-note-beamed', label: 'Música' },
  { icon: 'bi-palette', label: 'Arte' },
  { icon: 'bi-book', label: 'Lectura' },
  { icon: 'bi-camera', label: 'Fotografía' },
  { icon: 'bi-globe', label: 'Mundo' },
  { icon: 'bi-heart-pulse', label: 'Salud' },
  { icon: 'bi-briefcase', label: 'Negocios' },
  { icon: 'bi-graph-up', label: 'Finanzas' },
  { icon: 'bi-cup-hot', label: 'Cocina' },
  { icon: 'bi-egg-fried', label: 'Gastronomía' },
  { icon: 'bi-tools', label: 'Oficios' },
  { icon: 'bi-lightbulb', label: 'Ideas' },
  { icon: 'bi-brush', label: 'Diseño' },
  { icon: 'bi-journal-bookmark', label: 'General' },
  { icon: 'bi-chat-dots', label: 'Comunicación' },
  { icon: 'bi-pencil', label: 'Escritura' },
  { icon: 'bi-controller', label: 'Videojuegos' },
  { icon: 'bi-cpu', label: 'Electrónica' },
  { icon: 'bi-bank', label: 'Derecho' },
  { icon: 'bi-tree', label: 'Naturaleza' },
  { icon: 'bi-rocket-takeoff', label: 'Emprendimiento' },
  { icon: 'bi-openai', label: 'Inteligencia Artificial' },
  { icon: 'bi-shield-lock', label: 'Seguridad' },
]

// Si la categoría no tiene icono asignado se muestra el genérico
export const categoryIcon = (icon?: string | null) => icon || DEFAULT_CATEGORY_ICON
