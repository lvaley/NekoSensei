import type { TutorDetail } from '../../types'
import { whatsappUrl } from '../../utils/whatsapp'

export function ShareWhatsApp({ tutor, offerCount }: { tutor: TutorDetail['tutor']; offerCount: number }) {
  return (
    <a className="btn btn-outline-success btn-sm" href={whatsappUrl(tutor, offerCount)} target="_blank" rel="noopener noreferrer">
      <i className="bi bi-whatsapp me-1" aria-hidden="true" />
      Compartir por WhatsApp
    </a>
  )
}
