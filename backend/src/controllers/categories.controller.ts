import type { Request, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import { Category } from '../models/Category'
import { User } from '../models/User'

function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

const NAME_ERROR = 'El nombre debe tener entre 2 y 60 caracteres.'

// Catálogo en forma de árbol. Las personas solo ven categorías activas; el admin ve todas.
export async function listCategories(req: Request, res: Response): Promise<void> {
  const onlyActive = req.auth?.role !== 'admin'
  const all = await Category.find(onlyActive ? { active: true } : {}).sort({ name: 1 })

  const tree = all
    .filter((category) => category.parent === null)
    .map((parent) => ({
      id: String(parent._id),
      name: parent.name,
      active: parent.active,
      children: all
        .filter((child) => child.parent && String(child.parent) === String(parent._id))
        .map((child) => ({ id: String(child._id), name: child.name, active: child.active })),
    }))

  res.json({ categories: tree })
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const name = cleanName(req.body?.name)
  const parentId = req.body?.parentId as unknown

  if (name.length < 2 || name.length > 60) {
    res.status(400).json({ message: NAME_ERROR })
    return
  }

  let parent: string | null = null
  if (parentId) {
    const parentCategory = isValidObjectId(parentId) ? await Category.findById(parentId as string) : null
    if (!parentCategory || parentCategory.parent !== null) {
      res.status(400).json({ message: 'La categoría principal no existe.' })
      return
    }
    parent = String(parentCategory._id)
  }

  if (await Category.exists({ name, parent })) {
    res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' })
    return
  }

  const category = await Category.create({ name, parent })
  res.status(201).json({ category: { id: String(category._id), name: category.name, active: category.active } })
}

export async function updateCategory(req: Request<{ id: string }>, res: Response): Promise<void> {
  const category = isValidObjectId(req.params.id) ? await Category.findById(req.params.id) : null
  if (!category) {
    res.status(404).json({ message: 'Categoría no encontrada' })
    return
  }

  if (req.body?.name !== undefined) {
    const name = cleanName(req.body.name)
    if (name.length < 2 || name.length > 60) {
      res.status(400).json({ message: NAME_ERROR })
      return
    }
    const duplicate = await Category.exists({ name, parent: category.parent, _id: { $ne: category._id } })
    if (duplicate) {
      res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' })
      return
    }
    category.name = name
  }
  if (typeof req.body?.active === 'boolean') {
    category.active = req.body.active
  }

  await category.save()
  res.json({ category: { id: String(category._id), name: category.name, active: category.active } })
}

// Al eliminar una categoría principal también se eliminan sus subcategorías
export async function deleteCategory(req: Request<{ id: string }>, res: Response): Promise<void> {
  const category = isValidObjectId(req.params.id) ? await Category.findById(req.params.id) : null
  if (!category) {
    res.status(404).json({ message: 'Categoría no encontrada' })
    return
  }

  const children = await Category.find({ parent: category._id })
  const ids = [category._id, ...children.map((child) => child._id)]

  await Category.deleteMany({ _id: { $in: ids } })
  await User.updateMany({ categories: { $in: ids } }, { $pullAll: { categories: ids } })

  res.status(204).end()
}
