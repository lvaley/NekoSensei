// Datos de marca y contacto en un solo lugar. Reemplazar los valores marcados con TODO.
export const SITE = {
  name: 'Neko Sensei',
  kanji: '猫先生',
  tagline: 'Aprende con los mejores tutores',
  year: new Date().getFullYear(),
  author: 'Luis Enrique Valey Osorio',
  carnet: '9490-21-16222',
  // TODO: reemplazar por los datos reales de contacto
  whatsapp: 'https://wa.me/50223827300',
  email: 'mailto:contacto@nekosensei.com',
  social: [
    { label: 'Instagram', icon: 'bi-instagram', href: 'https://www.instagram.com/embjapon_gt' },
    { label: 'Facebook', icon: 'bi-facebook', href: 'https://www.facebook.com/embjaponGT' },
    { label: 'X', icon: 'bi-twitter-x', href: 'https://x.com/fbembjapon_gt' },
  ],
} as const

// Client ID de Google (público). Si está vacío, el inicio de sesión con Google se muestra deshabilitado
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
