import { LegalDocument } from '../components/ui/LegalDocument'
import { LEGAL_UPDATED, termsSections } from '../content/legal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Terms() {
  useDocumentTitle('Términos y condiciones')

  return (
    <LegalDocument
      eyebrow="Legal"
      title="Términos y condiciones"
      subtitle="Las reglas que rigen el uso de la plataforma por parte de estudiantes y tutores."
      updated={LEGAL_UPDATED}
      sections={termsSections}
    />
  )
}
