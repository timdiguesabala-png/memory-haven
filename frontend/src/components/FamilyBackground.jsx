/** Illustrations décoratives — esprit famille, arrière-plan doux */
export default function FamilyBackground() {
  return (
    <div className="mh-family-bg" aria-hidden="true">
      <div className="mh-family-bg-mesh" />

      {/* Maison — foyer */}
      <svg className="mh-illus mh-illus--house" viewBox="0 0 120 100" fill="none">
        <path
          d="M60 12L8 52v38h24V62h56v28h24V52L60 12z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M48 62h24v28H48V62z" fill="currentColor" opacity="0.15" />
        <path
          d="M60 38c-6 0-10 4-10 9s4 9 10 9 10-4 10-9-4-9-10-9z"
          fill="currentColor"
          opacity="0.2"
        />
      </svg>

      {/* Famille — silhouettes */}
      <svg className="mh-illus mh-illus--family" viewBox="0 0 200 120" fill="none">
        <circle cx="100" cy="28" r="14" fill="currentColor" opacity="0.25" />
        <path
          d="M72 55c0-12 12-22 28-22s28 10 28 22v45H72V55z"
          fill="currentColor"
          opacity="0.2"
        />
        <circle cx="52" cy="42" r="11" fill="currentColor" opacity="0.2" />
        <path d="M32 58c0-10 9-18 20-18s20 8 20 18v42H32V58z" fill="currentColor" opacity="0.18" />
        <circle cx="148" cy="42" r="11" fill="currentColor" opacity="0.2" />
        <path d="M128 58c0-10 9-18 20-18s20 8 20 18v42h-40V58z" fill="currentColor" opacity="0.18" />
        <path
          d="M68 78h64"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.15"
        />
      </svg>

      {/* Arbre généalogique */}
      <svg className="mh-illus mh-illus--tree" viewBox="0 0 80 100" fill="none">
        <path d="M40 95V55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="32" r="26" fill="currentColor" opacity="0.12" />
        <circle cx="28" cy="38" r="14" fill="currentColor" opacity="0.1" />
        <circle cx="52" cy="38" r="14" fill="currentColor" opacity="0.1" />
        <circle cx="40" cy="22" r="12" fill="currentColor" opacity="0.14" />
      </svg>

      {/* Cadres photos */}
      <svg className="mh-illus mh-illus--frames" viewBox="0 0 100 80" fill="none">
        <rect x="4" y="8" width="36" height="44" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="10" y="14" width="24" height="20" fill="currentColor" opacity="0.12" />
        <rect x="52" y="4" width="44" height="52" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="74" cy="26" r="10" fill="currentColor" opacity="0.15" />
        <path d="M58 42h32" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      </svg>

      {/* Cœurs */}
      <svg className="mh-illus mh-illus--heart mh-illus--heart1" viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 28s-12-8-12-16a7 7 0 0114 0 7 7 0 0114 0c0 8-12 16-12 16z" opacity="0.22" />
      </svg>
      <svg className="mh-illus mh-illus--heart mh-illus--heart2" viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 28s-12-8-12-16a7 7 0 0114 0 7 7 0 0114 0c0 8-12 16-12 16z" opacity="0.18" />
      </svg>

      {/* Enveloppe / lien familial */}
      <svg className="mh-illus mh-illus--link" viewBox="0 0 64 48" fill="none">
        <rect x="4" y="10" width="56" height="34" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M4 14l28 20 28-20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
