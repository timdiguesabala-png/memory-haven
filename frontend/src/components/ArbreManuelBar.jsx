export default function ArbreManuelBar({
  actif,
  onToggle,
  linkMode,
  linkParent,
  onStartLink,
  onCancelLink,
  onAddRacine,
  onToggleListe,
  listeOuverte
}) {
  return (
    <div className={`mh-arbre-manuel-bar ${actif ? 'mh-arbre-manuel-bar--on' : ''}`}>
      <button
        type="button"
        className={`mh-arbre-manuel-toggle ${actif ? 'mh-arbre-manuel-toggle--on' : ''}`}
        onClick={onToggle}
      >
        ✏️ Édition manuelle {actif ? 'ON' : 'OFF'}
      </button>

      {actif && (
        <>
          <button type="button" className="mh-arbre-zoom-btn" onClick={onAddRacine}>
            + Racine
          </button>
          {linkMode ? (
            <>
              <span className="mh-arbre-manuel-hint">
                {linkMode === 'parent'
                  ? '1/2 — Cliquez sur le parent'
                  : `2/2 — Parent : ${linkParent?.nom || '…'} — cliquez sur l'enfant`}
              </span>
              <button type="button" className="mh-arbre-zoom-btn" onClick={onCancelLink}>
                Annuler
              </button>
            </>
          ) : (
            <button type="button" className="mh-arbre-zoom-btn mh-arbre-zoom-btn--primary" onClick={onStartLink}>
              Relier parent → enfant
            </button>
          )}
          <button
            type="button"
            className={`mh-arbre-zoom-btn ${listeOuverte ? 'mh-arbre-manuel-toggle--on' : ''}`}
            onClick={onToggleListe}
          >
            {listeOuverte ? 'Masquer liste' : 'Liste / parents'}
          </button>
        </>
      )}
    </div>
  )
}
