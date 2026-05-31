import { useId } from 'react'

/**
 * Logo Memory Haven — maison + cœur familial + cadre souvenir
 */
export default function MemoryHavenLogo({
  size = 'lg',
  showWordmark = true,
  className = ''
}) {
  const uid = useId().replace(/:/g, '')
  const bgId = `mh-logo-bg-${uid}`
  const shineId = `mh-logo-shine-${uid}`

  const sizes = {
    sm: { mark: 40, word: '0.95rem', gap: '0.35rem' },
    md: { mark: 72, word: '1.35rem', gap: '0.5rem' },
    lg: { mark: 120, word: '2rem', gap: '0.65rem' },
    xl: { mark: 160, word: '2.35rem', gap: '0.75rem' }
  }
  const s = sizes[size] || sizes.lg

  return (
    <div
      className={`mh-logo ${className}`.trim()}
      style={{ '--mh-logo-mark': `${s.mark}px`, '--mh-logo-word': s.word, '--mh-logo-gap': s.gap }}
      aria-label="Memory Haven"
    >
      <svg
        className="mh-logo-mark"
        viewBox="0 0 120 120"
        width={s.mark}
        height={s.mark}
        role="img"
        aria-hidden={showWordmark}
      >
        <defs>
          <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d5a80" />
            <stop offset="100%" stopColor="#2a3f5c" />
          </linearGradient>
          <linearGradient id={shineId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b8fb8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3d5a80" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="112" height="112" rx="28" fill={`url(#${bgId})`} />
        <rect x="4" y="4" width="112" height="56" rx="28" fill={`url(#${shineId})`} />
        <path
          d="M60 88 L28 58 V38 L60 22 L92 38 V58 Z"
          fill="none"
          stroke="#fbf7f2"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <rect x="44" y="48" width="32" height="24" rx="4" fill="#6b8fb8" fillOpacity="0.85" />
        <path
          d="M60 72 C52 64 48 64 48 58 C48 54 52 50 56 50 C58 50 60 51 60 51 C60 51 62 50 64 50 C68 50 72 54 72 58 C72 64 68 64 60 72 Z"
          fill="#c17f59"
        />
        <circle cx="88" cy="32" r="10" fill="#5d8a72" fillOpacity="0.9" />
        <path
          d="M88 28v8M84 32h8"
          stroke="#fbf7f2"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      {showWordmark && (
        <div className="mh-logo-wordmark">
          <span className="mh-logo-title">Memory Haven</span>
          <span className="mh-logo-tagline">Souvenirs de famille</span>
        </div>
      )}
    </div>
  )
}
