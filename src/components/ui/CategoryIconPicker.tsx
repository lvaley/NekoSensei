import { CATEGORY_ICON_OPTIONS, DEFAULT_CATEGORY_ICON } from '../../utils/categoryIcons'

interface Props {
  value: string
  onChange: (icon: string) => void
}

// Cuadrícula de iconos para elegir el de una categoría
export function CategoryIconPicker({ value, onChange }: Props) {
  return (
    <div className="icon-picker" role="radiogroup" aria-label="Icono de la categoría">
      {CATEGORY_ICON_OPTIONS.map((option) => (
        <button
          key={option.icon}
          type="button"
          role="radio"
          aria-checked={value === option.icon}
          title={option.icon === DEFAULT_CATEGORY_ICON ? `${option.label} (predeterminado)` : option.label}
          className={`icon-picker__item${value === option.icon ? ' is-selected' : ''}`}
          onClick={() => onChange(option.icon)}
        >
          <i className={`bi ${option.icon}`} aria-hidden="true" />
          <span className="visually-hidden">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
