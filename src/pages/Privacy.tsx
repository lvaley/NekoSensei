import { LegalDocument } from '../components/ui/LegalDocument'
import { LEGAL_UPDATED, privacySections } from '../content/legal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Privacy() {
  useDocumentTitle('Política de privacidad')

  return (
    <LegalDocument
      eyebrow="Legal"
      title="Política de privacidad"
      subtitle="Qué datos recopilamos, para qué los usamos y cómo puedes controlarlos."
      updated={LEGAL_UPDATED}
      sections={privacySections}
    />
  )
}
