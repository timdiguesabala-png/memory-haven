/** En-tête harmonisé — famille + titre + actions */
export default function PageHeader({ title, family, subtitle, children }) {
  return (
    <header className="mh-feed-header mh-page-header">
      <div className="mh-feed-header-text">
        {family && <span className="mh-feed-family-badge">Famille {family}</span>}
        <h1 className="mh-title">{title}</h1>
        {subtitle && <p className="mh-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="mh-page-header-actions">{children}</div>}
    </header>
  )
}
