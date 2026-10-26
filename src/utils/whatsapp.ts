import type { TutorDetail } from '../types'
import { money } from './money'

// Enlace de WhatsApp con el resumen del perfil: nombre, calificación, categorías, tarifa base y enlace directo
export function whatsappUrl(tutor: TutorDetail['tutor'], offerCount: number): string {
  const link = `${window.location.origin}/tutores/${tutor.id}`
  const lines = [
    `Mira el perfil de ${tutor.name} en Neko Sensei`,
    tutor.categories.length > 0 ? `Enseña: ${tutor.categories.slice(0, 4).join(', ')}` : '',
    tutor.rating !== null ? `Calificación: ${tutor.rating.toFixed(1)} ★ (${tutor.reviewCount} ${tutor.reviewCount === 1 ? 'reseña' : 'reseñas'})` : '',
    `Tarifa base: ${money(tutor.hourlyRate)}/hora · ${offerCount} ${offerCount === 1 ? 'curso' : 'cursos'}`,
    link,
  ]
  return `https://wa.me/?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`
}
