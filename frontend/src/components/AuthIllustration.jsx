/** Illustration connexion — album familial, sobre */
export default function AuthIllustration() {
  return (
    <div className="auth-illustration" aria-hidden>
      <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="auth-sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dce8f0" />
            <stop offset="55%" stopColor="#f0e8dc" />
            <stop offset="100%" stopColor="#dce8df" />
          </linearGradient>
          <linearGradient id="auth-frame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b8fb8" />
            <stop offset="100%" stopColor="#3d5a80" />
          </linearGradient>
        </defs>
        <rect width="400" height="320" rx="24" fill="url(#auth-sky)" />
        <ellipse cx="200" cy="280" rx="160" ry="28" fill="#3d5a80" opacity="0.1" />

        <rect x="48" y="52" width="120" height="140" rx="10" stroke="url(#auth-frame)" strokeWidth="3" fill="#fff" fillOpacity="0.75" />
        <rect x="58" y="68" width="100" height="72" rx="6" fill="#e8d4c4" fillOpacity="0.5" />
        <circle cx="108" cy="98" r="22" fill="#6b8fb8" fillOpacity="0.35" />

        <rect x="188" y="72" width="164" height="120" rx="10" stroke="#5d8a72" strokeWidth="3" fill="#fff" fillOpacity="0.7" />
        <path d="M210 108h120M210 128h90M210 148h100" stroke="#5d8a72" strokeWidth="2" strokeLinecap="round" opacity="0.35" />

        <rect x="120" y="168" width="200" height="100" rx="10" stroke="#c17f59" strokeWidth="3" fill="#fff" fillOpacity="0.6" />
        <circle cx="170" cy="218" r="18" fill="#3d5a80" fillOpacity="0.25" />
        <circle cx="230" cy="218" r="18" fill="#c17f59" fillOpacity="0.3" />
        <circle cx="290" cy="218" r="18" fill="#5d8a72" fillOpacity="0.28" />

        <path
          d="M175 248c0-20 16-36 36-36s36 16 36 36"
          stroke="#1e2d3d"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.18"
        />
        <circle cx="148" cy="252" r="14" fill="#6b8fb8" fillOpacity="0.22" />
        <circle cx="248" cy="252" r="14" fill="#c17f59" fillOpacity="0.22" />
        <circle cx="198" cy="238" r="16" fill="#5d8a72" fillOpacity="0.2" />

        <path
          d="M318 88l12-8 8 14"
          stroke="#b8953a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}
