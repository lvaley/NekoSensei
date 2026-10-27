import { LegalDocument } from '../components/ui/LegalDocument'
import { conductSections, LEGAL_UPDATED } from '../content/legal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Conduct() {
  useDocumentTitle('Normas de convivencia')

  return <LegalDocument eyebrow="Comunidad" title="Normas de convivencia" subtitle="Lo que esperamos de estudiantes y tutores para cuidar la comunidad de Neko Sensei." updated={LEGAL_UPDATED} sections={conductSections} />
}
