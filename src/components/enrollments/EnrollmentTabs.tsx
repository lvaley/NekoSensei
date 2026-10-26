import { Nav } from 'react-bootstrap'

export interface TabDef<K extends string> {
  key: K
  label: string
  count: number
}

// Pestañas con contador (estudiante: activos, solicitudes, historial…)
export function EnrollmentTabs<K extends string>({ tabs, active, onChange }: { tabs: TabDef<K>[]; active: K; onChange: (key: K) => void }) {
  return (
    <Nav variant="pills" className="filter-pills mb-4" activeKey={active}>
      {tabs.map((tab) => (
        <Nav.Link key={tab.key} eventKey={tab.key} onClick={() => onChange(tab.key)}>
          {tab.label} <span className="tab-count">{tab.count}</span>
        </Nav.Link>
      ))}
    </Nav>
  )
}
