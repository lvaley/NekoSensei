import { useState } from 'react'

export interface ChartSeries {
  name: string
  values: number[]
  tone: 'ink' | 'vermilion' | 'gold' | 'sage'
}

interface Props {
  labels: string[]
  series: ChartSeries[]
  format?: (value: number) => string
  label: string
  height?: number
}

const W = 640
const PAD = { top: 12, right: 12, bottom: 28, left: 44 }

// Redondea el máximo a un valor "bonito" para que los ejes tengan 4 divisiones limpias
function niceMax(value: number): number {
  if (value <= 0) return 4
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * power >= value) ?? 10
  return step * power
}

// Barras agrupadas en SVG: al pasar el cursor (o enfocar con teclado) se resalta el mes y se muestran sus valores
export function BarChart({ labels, series, format = (value) => String(value), label, height = 240 }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(0, ...series.flatMap((item) => item.values)))
  const innerW = W - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const group = innerW / Math.max(1, labels.length)
  const barW = Math.min(34, (group * 0.7) / Math.max(1, series.length))
  const ticks = [0, 1, 2, 3, 4].map((index) => (max / 4) * index)
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH

  return (
    <figure className="chart" aria-label={label}>
      <div className="chart__legend">
        {series.map((item) => (
          <span key={item.name}>
            <i className={`chart__dot chart__dot--${item.tone}`} /> {item.name}
          </span>
        ))}
      </div>
      <div className="chart__plot">
        <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} className="chart__grid" />
              <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" className="chart__tick">
                {format(tick)}
              </text>
            </g>
          ))}
          {labels.map((name, index) => {
            const cx = PAD.left + group * index + group / 2
            const start = cx - (barW * series.length) / 2
            return (
              <g
                key={name}
                tabIndex={0}
                className={`chart__group${active === index ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              >
                <rect x={PAD.left + group * index} y={PAD.top} width={group} height={innerH} className="chart__hit" />
                {series.map((item, s) => {
                  const value = item.values[index] ?? 0
                  const top = y(value)
                  return <rect key={item.name} x={start + barW * s + 1} y={top} width={Math.max(2, barW - 2)} height={Math.max(0, PAD.top + innerH - top)} rx={3} className={`chart__bar chart__bar--${item.tone}`} />
                })}
                <text x={cx} y={height - 8} textAnchor="middle" className="chart__tick">
                  {name}
                </text>
              </g>
            )
          })}
        </svg>
        {active !== null && (
          <div className="chart__tooltip" style={{ left: `${((PAD.left + group * active + group / 2) / W) * 100}%` }} role="status">
            <strong>{labels[active]}</strong>
            {series.map((item) => (
              <span key={item.name}>
                <i className={`chart__dot chart__dot--${item.tone}`} /> {item.name}: {format(item.values[active] ?? 0)}
              </span>
            ))}
          </div>
        )}
      </div>
    </figure>
  )
}
