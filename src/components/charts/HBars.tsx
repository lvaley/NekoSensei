interface Row {
  name: string
  count: number
}

// Barras horizontales para rankings de demanda: la más larga ocupa todo el ancho
export function HBars({ rows, unit = 'solicitudes', empty }: { rows: Row[]; unit?: string; empty: string }) {
  if (rows.length === 0) return <p className="text-secondary mb-0">{empty}</p>
  const max = Math.max(...rows.map((row) => row.count), 1)
  return (
    <ul className="hbars">
      {rows.map((row) => (
        <li key={row.name}>
          <div className="hbars__head">
            <span>{row.name}</span>
            <strong>
              {row.count} <small>{row.count === 1 ? unit.replace(/es$/, '').replace(/s$/, '') : unit}</small>
            </strong>
          </div>
          <div className="hbars__track">
            <span style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
