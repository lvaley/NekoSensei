import { LegalDocument } from '../components/ui/LegalDocument'
import { LEGAL_UPDATED, termsSections } from '../content/legal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Terms() {
  useDocumentTitle('Términos y condiciones')

  return (
    <LegalDocument
      eyebrow="Legal"
      title="Términos y condiciones"
      subtitle="Condiciones claras y justas para que estudiantes y tutores aprendan y enseñen con total confianza."
      updated={LEGAL_UPDATED}
      sections={termsSections}
    />
  )
}
