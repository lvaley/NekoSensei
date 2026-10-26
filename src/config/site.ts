// Datos de marca y contacto en un solo lugar. Reemplazar los valores marcados con TODO.
export const SITE = {
  name: 'Neko Sensei',
  kanji: '猫先生',
  tagline: 'Aprende con los mejores tutores',
  year: new Date().getFullYear(),
  author: 'Luis Enrique Valey Osorio',
  carnet: '9490-21-16222',
  // TODO: reemplazar por los datos reales de contacto
  whatsapp: 'https://wa.me/50200000000',
  email: 'mailto:contacto@nekosensei.com',
  social: [
    { label: 'Instagram', icon: 'bi-instagram', href: '#' },
    { label: 'Facebook', icon: 'bi-facebook', href: '#' },
    { label: 'TikTok', icon: 'bi-tiktok', href: '#' },
    { label: 'X', icon: 'bi-twitter-x', href: '#' },
  ],
} as const
