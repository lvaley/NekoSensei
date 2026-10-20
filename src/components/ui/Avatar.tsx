interface AvatarProps {
  name: string
  picture?: string
  size?: number
}

// Foto de perfil; si no hay (o no carga) se muestra la inicial del nombre
export function Avatar({ name, picture, size = 48 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.42 }
  if (picture) {
    return <img src={picture} alt="" className="avatar" style={style} referrerPolicy="no-referrer" />
  }
  return (
    <span className="avatar avatar--initial" style={style} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
