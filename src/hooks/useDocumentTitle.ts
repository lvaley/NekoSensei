import { useEffect } from 'react'
import { SITE } from '../config/site'

// Cambia el título de la pestaña mientras la página está activa y lo restablece al salir
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE.name}` : SITE.name
    return () => {
      document.title = SITE.name
    }
  }, [title])
}
