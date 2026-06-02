import { useNavigate } from 'react-router-dom'
import UserAvatar from './UserAvatar'
import {
  buildFicheMembreLignes,
  libelleRole,
  RESEAU_LABELS
} from '../lib/profilFields'

export default function MembreFicheModal({ membre, open, onClose, currentUserId, loading }) {
  const navigate = useNavigate()

  if (!open || !membre) return null

  const isSelf = Number(membre.id) === Number(currentUserId)
  const lignes = buildFicheMembreLignes(membre)
  const displayName = [membre.prenom, membre.nom].filter(Boolean).join(' ')

  const sections = [
    {
      title: 'Identité',
      keys: ['Prénom', 'Nom', 'Nom complet / civil', 'Email', 'Téléphone', 'Date de naissance']
    },
    {
      title: 'Lieux de vie',
      keys: [
        'Lieu de naissance',
        'Résidence actuelle',
        'Lieu de vie (détail)',
        'Ancienne résidence'
      ]
    },
    {
      title: 'Famille & relations',
      keys: [
        'Rôle sur le compte',
        'Place dans la famille',
        'Relations familiales',
        'Filiation',
        'Lien arbre généalogique'
      ]
    },
    {
      title: 'Parcours & profession',
      keys: [
        'Métier / profession',
        'Activité actuelle',
        'Description du métier',
        'Parcours scolaire',
        'Baccalauréat & diplômes',
        'Parcours professionnel',
        'Formations & compétences'
      ]
    },
    {
      title: 'À propos',
      keys: ['Biographie', 'Langues', 'Centres d’intérêt']
    },
    {
      title: 'Réseaux sociaux',
      keys: Object.values(RESEAU_LABELS)
    }
  ]

  const lignesByLabel = Object.fromEntries(lignes.map((l) => [l.label, l]))

  return (
    <div className="mh-membre-fiche-overlay" role="dialog" aria-modal="true" aria-labelledby="mh-fiche-titre">
      <button type="button" className="mh-membre-fiche-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="mh-membre-fiche-panel mh-mirror-surface">
        <header className="mh-membre-fiche-header">
          <UserAvatar
            nom={membre.nom}
            prenom={membre.prenom}
            avatarUrl={membre.avatar_url}
            size={72}
          />
          <div className="mh-membre-fiche-header-text">
            <h2 id="mh-fiche-titre" className="mh-membre-fiche-name">
              {displayName}
            </h2>
            {membre.nom_complet && membre.nom_complet !== displayName && (
              <p className="mh-membre-fiche-sub">{membre.nom_complet}</p>
            )}
            <p className="mh-membre-fiche-role">{libelleRole(membre.role)}</p>
            {membre.metier_actuel && (
              <p className="mh-membre-fiche-metier">💼 {membre.metier_actuel}</p>
            )}
          </div>
          <button type="button" className="mh-membre-fiche-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <div className="mh-membre-fiche-body">
          {loading ? (
            <p className="mh-compte-hint">Chargement de la fiche…</p>
          ) : lignes.length === 0 ? (
            <p className="mh-compte-hint">
              {isSelf
                ? 'Complétez votre profil dans Mon compte pour que la famille vous connaisse mieux.'
                : 'Ce membre n’a pas encore renseigné sa fiche.'}
            </p>
          ) : (
            sections.map((section) => {
              const items = section.keys
                .map((k) => lignesByLabel[k])
                .filter(Boolean)
              if (!items.length) return null
              return (
                <section key={section.title} className="mh-membre-fiche-section">
                  <h3 className="mh-membre-fiche-section-title">{section.title}</h3>
                  <dl className="mh-membre-fiche-dl">
                    {items.map((row) => (
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
              )
            })
          )}
        </div>

        <footer className="mh-membre-fiche-footer">
          {isSelf ? (
            <button
              type="button"
              className="mh-btn mh-btn--primary"
              onClick={() => {
                onClose()
                navigate('/compte')
              }}
            >
              Modifier mon profil
            </button>
          ) : (
            <button type="button" className="mh-btn mh-btn-secondary" onClick={onClose}>
              Fermer
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
