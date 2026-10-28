import { Category } from '../models/Category'

// Catálogo inicial (las áreas que pide el proyecto). El administrador puede editarlo después.
const DEFAULT_CATALOG: Record<string, { icon: string; children: string[] }> = {
  Idiomas: { icon: 'bi-translate', children: ['Inglés conversacional', 'Francés', 'Japonés'] },
  Deportes: { icon: 'bi-trophy', children: ['Natación', 'Fútbol', 'Tenis'] },
  Ciencias: { icon: 'bi-calculator', children: ['Cálculo multivariable', 'Física', 'Química'] },
  Tecnología: { icon: 'bi-laptop', children: ['Desarrollo web', 'Programación', 'Bases de datos'] },
  Posgrado: { icon: 'bi-mortarboard', children: ['Metodología de la investigación', 'Estadística aplicada'] },
}

// Antes de que el administrador eligiera el icono, se deducía del nombre. Las categorías creadas entonces conservan ese icono una sola vez.
const LEGACY_ICONS: Array<[RegExp, string]> = [
  [/idioma|ingl|franc|japon|lengua/i, 'bi-translate'],
  [/deporte|nataci|f[uú]tbol|tenis/i, 'bi-trophy'],
  [/ciencia|f[ií]sica|qu[ií]mica|c[aá]lculo|matem/i, 'bi-calculator'],
  [/tecnolog|program|web|datos|inform/i, 'bi-laptop'],
  [/posgrado|investig|estad[ií]st|maestr/i, 'bi-mortarboard'],
  [/m[uú]sica|guitarra|piano/i, 'bi-music-note-beamed'],
  [/arte|dibujo|pintura|dise/i, 'bi-palette'],
]

async function backfillIcons(): Promise<void> {
  const missing = await Category.collection.find({ icon: { $exists: false } }).toArray()
  for (const category of missing) {
    const icon = LEGACY_ICONS.find(([pattern]) => pattern.test(String(category.name)))?.[1] ?? 'bi-journal-bookmark'
    await Category.collection.updateOne({ _id: category._id }, { $set: { icon } })
  }
}

export async function ensureDefaultCategories(): Promise<void> {
  if ((await Category.countDocuments()) > 0) {
    await backfillIcons()
    return
  }

  for (const [name, { icon, children }] of Object.entries(DEFAULT_CATALOG)) {
    const parent = await Category.create({ name, parent: null, icon })
    await Category.insertMany(children.map((child) => ({ name: child, parent: parent._id })))
  }
  console.log('Catálogo de categorías inicial creado')
}
