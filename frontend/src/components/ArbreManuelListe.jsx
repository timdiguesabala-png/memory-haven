export default function ArbreManuelListe({
  membres,
  onParentChange,
  onSelect,
  onAddChild,
  onMoveOrdre,
  onClose
}) {
  const parentNom = (id) => {
    if (!id) return '— Racine —'
    return membres.find((m) => m.id === id)?.nom || `#${id}`
  }

  const sorted = [...membres].sort((a, b) => {
    const pa = a.parent_id ?? 0
    const pb = b.parent_id ?? 0
    if (pa !== pb) return pa - pb
    return (a.layout_ordre ?? 0) - (b.layout_ordre ?? 0) || a.nom.localeCompare(b.nom)
  })

  return (
    <aside className="mh-arbre-manuel-liste">
      <header className="mh-arbre-manuel-liste-head">
        <h3>Construire l&apos;arbre à la main</h3>
        <button type="button" className="mh-arbre-manuel-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </header>
      <p className="mh-arbre-manuel-liste-intro">
        Choisissez le parent de chaque personne. Utilisez ↑↓ pour l&apos;ordre des frères et sœurs.
      </p>
      <div className="mh-arbre-manuel-table-wrap">
        <table className="mh-arbre-manuel-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Parent</th>
              <th>Ordre</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.id}>
                <td>
                  <button type="button" className="mh-arbre-manuel-nom" onClick={() => onSelect(m)}>
                    {m.nom}
                  </button>
                </td>
                <td>
                  <select
                    className="mh-arbre-manuel-select"
                    value={m.parent_id ?? ''}
                    onChange={(e) => onParentChange(m.id, e.target.value)}
                  >
                    <option value="">— Racine —</option>
                    {membres
                      .filter((p) => p.id !== m.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))}
                  </select>
                  <span className="mh-arbre-manuel-parent-hint">{parentNom(m.parent_id)}</span>
                </td>
                <td>
                  <div className="mh-arbre-manuel-ordre">
                    <button
                      type="button"
                      className="mh-arbre-manuel-ordre-btn"
                      title="Monter"
                      onClick={() => onMoveOrdre(m.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="mh-arbre-manuel-ordre-btn"
                      title="Descendre"
                      onClick={() => onMoveOrdre(m.id, 1)}
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="mh-arbre-manuel-mini"
                    onClick={() => onAddChild(m)}
                    title="Ajouter un enfant"
                  >
                    + Enfant
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  )
}
