import { useNavigate } from 'react-router-dom'
import UserAvatar from './UserAvatar'
import {
  buildFicheMembreLignes,
  groupFicheLignesParSection,
  libelleRole
} from '../lib/profilFields'

export default function MembreFicheContent({
  membre,
  loading,
  currentUserId,
  onBack
}) {
  const navigate = useNavigate()
  if (!membre) return null

  const isSelf = Number(membre.id) === Number(currentUserId)
  const lignes = buildFicheMembreLignes(membre, { includeEmpty: false })
  const sections = groupFicheLignesParSection(lignes)
  const displayName = [membre.prenom, membre.nom].filter(Boolean).join(' ')
  const hasBio = Boolean(membre.biographie?.trim())
  const hasBiblio = Boolean(membre.bibliographie?.trim())

  return (
    <div className="mh-membre-fiche-page">
      <header className="mh-membre-fiche-page-header">
        <button type="button" className="mh-btn mh-btn-secondary" onClick={onBack}>
          ← Retour
        </button>
        <h1 className="mh-membre-fiche-page-title">{displayName || 'Membre'}</h1>
      </header>

      <div className="mh-membre-fiche-panel mh-membre-fiche-panel--page">
        <header className="mh-membre-fiche-header">
          <UserAvatar
            nom={membre.nom}
            prenom={membre.prenom}
            avatarUrl={membre.avatar_url}
            size={88}
          />
          <div className="mh-membre-fiche-header-text">
            <h2 className="mh-membre-fiche-name">{displayName || 'Membre'}</h2>
            {membre.nom_complet && membre.nom_complet !== displayName && (
              <p className="mh-membre-fiche-sub">{membre.nom_complet}</p>
            )}
            <p className="mh-membre-fiche-role">{libelleRole(membre.role)}</p>
            {membre.metier_actuel && (
              <p className="mh-membre-fiche-metier">{membre.metier_actuel}</p>
            )}
          </div>
        </header>

        <div className="mh-membre-fiche-body mh-membre-fiche-body--page">
          {loading ? (
            <p className="mh-page-loading">Chargement…</p>
          ) : (
            <>
              <section className="mh-membre-fiche-narrative">
                <div className="mh-membre-fiche-narrative-block">
                  <h3 className="mh-membre-fiche-section-title">Biographie</h3>
                  {hasBio ? (
                    <p className="mh-membre-fiche-text">{membre.biographie.trim()}</p>
                  ) : (
                    <p className="mh-membre-fiche-empty">
                      {isSelf
                        ? 'Ajoutez votre biographie dans Mon compte.'
                        : 'Aucune biographie renseignée.'}
                    </p>
                  )}
                </div>
                <div className="mh-membre-fiche-narrative-block">
                  <h3 className="mh-membre-fiche-section-title">Bibliographie</h3>
                  {hasBiblio ? (
                    <p className="mh-membre-fiche-text mh-membre-fiche-text--biblio">
                      {membre.bibliographie.trim()}
                    </p>
                  ) : (
                    <p className="mh-membre-fiche-empty">
                      {isSelf
                        ? 'Ajoutez vos références, lectures ou sources dans Mon compte.'
                        : 'Aucune bibliographie renseignée.'}
                    </p>
                  )}
                </div>
              </section>

              {sections.map((section) => (
                <section key={section.title} className="mh-membre-fiche-section">
                  <h3 className="mh-membre-fiche-section-title">{section.title}</h3>
                  <dl className="mh-membre-fiche-dl">
                    {section.items.map((row) => (
                      <div key={row.label} className="mh-membre-fiche-row">
                        <dt>{row.label}</dt>
                        <dd>
                          {row.href ? (
                            <a href={row.href} target="_blank" rel="noopener noreferrer">
                              {row.value}
                            </a>
                          ) : (
                            row.value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </>
          )}
        </div>

        <footer className="mh-membre-fiche-footer">
          {isSelf ? (
            <button
              type="button"
              className="mh-btn mh-btn--primary"
              onClick={() => navigate('/compte')}
            >
              Modifier mon profil
            </button>
          ) : (
            <button type="button" className="mh-btn mh-btn-secondary" onClick={onBack}>
              Retour
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
