import { LegalDocument } from '../components/ui/LegalDocument'
import { conductSections, LEGAL_UPDATED } from '../content/legal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Conduct() {
  useDocumentTitle('Normas de convivencia')

  return <LegalDocument eyebrow="Comunidad" title="Normas de convivencia" subtitle="Una comunidad de aprendizaje segura y respetuosa: las reglas claras que protegen a estudiantes y tutores por igual." updated={LEGAL_UPDATED} sections={conductSections} />
}
