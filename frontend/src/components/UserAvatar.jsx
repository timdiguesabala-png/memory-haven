import { useState } from 'react'

export default function UserAvatar({
  nom,
  prenom,
  avatarUrl,
  size = 40,
  className = '',
  style = {},
  fallbackStyle = {},
  title,
  onClick
}) {
  const initials = ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?'
  const [failed, setFailed] = useState(false)
  const showPhoto = Boolean(avatarUrl) && !failed

  return (
    <div
      className={`mh-user-avatar ${className}`.trim()}
      style={{ width: size, height: size, fontSize: size * 0.38, ...style }}
      title={title}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e)
              }
            }
          : undefined
      }
    >
      {showPhoto ? (
        <img
          src={avatarUrl}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={fallbackStyle}>{initials}</span>
      )}
    </div>
  )
}
