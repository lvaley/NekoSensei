import { Category } from '../models/Category'

// Catálogo inicial (las áreas que pide el proyecto). El administrador puede editarlo después.
const DEFAULT_CATALOG: Record<string, string[]> = {
  Idiomas: ['Inglés conversacional', 'Francés', 'Japonés'],
  Deportes: ['Natación', 'Fútbol', 'Tenis'],
  Ciencias: ['Cálculo multivariable', 'Física', 'Química'],
  Tecnología: ['Desarrollo web', 'Programación', 'Bases de datos'],
  Posgrado: ['Metodología de la investigación', 'Estadística aplicada'],
}

export async function ensureDefaultCategories(): Promise<void> {
  if ((await Category.countDocuments()) > 0) return

  for (const [name, children] of Object.entries(DEFAULT_CATALOG)) {
    const parent = await Category.create({ name, parent: null })
    await Category.insertMany(children.map((child) => ({ name: child, parent: parent._id })))
  }
  console.log('Catálogo de categorías inicial creado')
}
