import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Al cambiar de página vuelve al inicio (salvo que la URL tenga un ancla, como #privacidad)
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
