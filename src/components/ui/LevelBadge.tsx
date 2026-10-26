import { LEVEL_LABELS, LEVEL_ORDER } from '../../content/levels'
import type { CourseLevel } from '../../types'

// Etiqueta del nivel del curso, con tres barras que se llenan según el nivel
export function LevelBadge({ level }: { level: CourseLevel }) {
  const filled = LEVEL_ORDER.indexOf(level) + 1
  return (
    <span className="level-badge" title={`Nivel ${LEVEL_LABELS[level].toLowerCase()}`}>
      <span className="level-badge__bars" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <i key={bar} className={bar <= filled ? 'is-on' : ''} />
        ))}
      </span>
      {LEVEL_LABELS[level]}
    </span>
  )
}
