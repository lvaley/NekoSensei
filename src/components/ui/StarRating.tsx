interface StarRatingProps {
  // Promedio o calificación (1–5); null si aún no hay reseñas
  value: number | null
  count?: number
  size?: 'sm' | 'lg'
}

// Estrellas de solo lectura (admite medias estrellas) con la cantidad de reseñas al lado
export function StarRating({ value, count, size = 'sm' }: StarRatingProps) {
  if (value === null) return <small className="text-secondary">Aún sin reseñas</small>
  return (
    <span className={`star-rating is-${size}`} role="img" aria-label={`${value} de 5 estrellas${count !== undefined ? `, ${count} ${count === 1 ? 'reseña' : 'reseñas'}` : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={`bi ${value >= star - 0.25 ? 'bi-star-fill' : value >= star - 0.75 ? 'bi-star-half' : 'bi-star'}`} aria-hidden="true" />
      ))}
      <strong>{value.toFixed(1)}</strong>
      {count !== undefined && <small className="text-secondary">({count})</small>}
    </span>
  )
}
