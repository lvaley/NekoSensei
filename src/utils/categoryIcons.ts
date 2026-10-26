// Ícono de Bootstrap Icons para cada categoría, según su nombre (las categorías las edita el administrador)
const ICONS: Array<[RegExp, string]> = [
  [/idioma|ingl|franc|japon|lengua/i, 'bi-translate'],
  [/deporte|nataci|f[uú]tbol|tenis/i, 'bi-trophy'],
  [/ciencia|f[ií]sica|qu[ií]mica|c[aá]lculo|matem/i, 'bi-calculator'],
  [/tecnolog|program|web|datos|inform/i, 'bi-laptop'],
  [/posgrado|investig|estad[ií]st|maestr/i, 'bi-mortarboard'],
  [/m[uú]sica|guitarra|piano/i, 'bi-music-note-beamed'],
  [/arte|dibujo|pintura|dise/i, 'bi-palette'],
]

export const categoryIcon = (name: string) => ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? 'bi-journal-bookmark'
