import { useState } from 'react'

function IconEye({ off = false }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path
          d="M10.5 10.7A4 4 0 0014 14M6.2 6.2C4.5 7.6 3.2 9.4 2.5 12c1.5 5 6 8 9.5 8 1.4 0 2.7-.4 3.9-1.1M9.9 5.1A10.8 10.8 0 0112 5c3.5 0 8 3 9.5 8-.5 1.7-1.4 3.2-2.6 4.4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12C4 7 8.5 4 12 4s8 3 9.5 8c-1.5 5-6 8-9.5 8S4 17 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

export default function AuthPasswordField({
  value,
  onChange,
  name = 'password',
  autoComplete = 'current-password',
  placeholder = '••••••••',
  required = true
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="auth-field-wrap auth-field-wrap--password">
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        className="mh-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        className="auth-field-toggle"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        <IconEye off={showPassword} />
      </button>
    </div>
  )
}
