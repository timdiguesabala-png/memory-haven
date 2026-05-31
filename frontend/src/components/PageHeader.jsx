import { formatFamilyName } from '../lib/formatFamily'

/** En-tête harmonisé — titre + actions (badge famille optionnel, sans doublon) */
export default function PageHeader({ title, family, showFamily = false, subtitle, children }) {
  const familyLabel = formatFamilyName(family)

  return (
    <header className="mh-feed-header mh-page-header">
      <div className="mh-feed-header-text">
        {showFamily && familyLabel && (
          <span className="mh-feed-family-badge">{familyLabel}</span>
        )}
        <h1 className="mh-title">{title}</h1>
        {subtitle && <p className="mh-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="mh-page-header-actions">{children}</div>}
    </header>
  )
}
