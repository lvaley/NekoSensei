// Marcadores de carga: imitan la forma del contenido para que la página no salte cuando llegan los datos

function Wrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      {children}
    </div>
  )
}

/** Cuadrícula de tarjetas (tutores, cursos). */
export function CardGridSkeleton({ count = 6, label = 'Cargando' }: { count?: number; label?: string }) {
  return (
    <Wrapper label={label}>
      <div className="skeleton-grid">
        {Array.from({ length: count }, (_, index) => (
          <span className="skeleton skeleton--card" key={index} />
        ))}
      </div>
    </Wrapper>
  )
}

/** Lista de filas (mis cursos, pagos, administración). */
export function ListSkeleton({ rows = 4, label = 'Cargando' }: { rows?: number; label?: string }) {
  return (
    <Wrapper label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <span className="skeleton skeleton--row" key={index} />
      ))}
    </Wrapper>
  )
}

/** Perfil de tutor: cabecera con foto y bloques de texto. */
export function ProfileSkeleton() {
  return (
    <div className="page-container container" role="status" aria-label="Cargando perfil" aria-busy="true">
      <div className="d-flex gap-4 align-items-center mb-4">
        <span className="skeleton skeleton--avatar flex-none" />
        <div className="flex-grow-1">
          <span className="skeleton skeleton--title" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line is-short" />
        </div>
      </div>
      <span className="skeleton skeleton--card mb-4" />
      <span className="skeleton skeleton--row" />
    </div>
  )
}

/** Líneas de texto sueltas (reseñas, conversaciones). */
export function LinesSkeleton({ lines = 3, label = 'Cargando' }: { lines?: number; label?: string }) {
  return (
    <Wrapper label={label}>
      {Array.from({ length: lines }, (_, index) => (
        <span className={`skeleton skeleton--line${index === lines - 1 ? ' is-short' : ''}`} key={index} />
      ))}
    </Wrapper>
  )
}
