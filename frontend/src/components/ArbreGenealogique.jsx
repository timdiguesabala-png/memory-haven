import UserAvatar from './UserAvatar'
import {
  afficherAnnees,
  iconeGenre,
  buildBranchesPersonne
} from '../lib/arbreGenealogique'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../services/arbreApi'

const COULEURS_HOMME = { bg: '#2a4060', color: '#a8d8f0' }
const COULEURS_FEMME = { bg: '#4a3050', color: '#f0c8e0' }
const COULEURS_DEFAUT = { bg: '#3a3456', color: '#d4cce8' }

function couleursGenre(genre) {
  if (genre === 'HOMME') return COULEURS_HOMME
  if (genre === 'FEMME') return COULEURS_FEMME
  return COULEURS_DEFAUT
}

function classeGenre(genre) {
  if (genre === 'HOMME') return 'mh-arbre-personne--homme'
  if (genre === 'FEMME') return 'mh-arbre-personne--femme'
  if (genre === 'AUTRE') return 'mh-arbre-personne--autre'
  return ''
}

export function PersonneCard({ membre, selected, onSelect }) {
  const couleur = couleursGenre(membre.genre)
  return (
    <button
      type="button"
      className={`mh-arbre-personne ${classeGenre(membre.genre)} ${selected ? 'mh-arbre-personne--selected' : ''}`}
      onClick={() => onSelect?.(membre)}
    >
      <span className="mh-arbre-genre-badge" title={membre.genre}>
        {iconeGenre(membre.genre)}
      </span>
      <UserAvatar
        initials={getArbreMemberInitials(membre.nom)}
        avatarUrl={getArbreMemberPhoto(membre)}
        size={52}
        className="mh-arbre-personne-photo"
        fallbackStyle={{ background: couleur.bg, color: couleur.color }}
      />
      <div className="mh-arbre-personne-nom">{membre.nom}</div>
      {afficherAnnees(membre) && (
        <div className="mh-arbre-personne-annees">{afficherAnnees(membre)}</div>
      )}
    </button>
  )
}

function UnionNoeud({ noeud, selectedId, onSelect, membres, unions }) {
  const { conjoints, enfants, label, union } = noeud

  return (
    <div className="mh-arbre-union">
      <p className="mh-arbre-union-label">💕 {label}</p>
      <div className="mh-arbre-couple">
        {conjoints.map((c, i) => (
          <span key={c.id} style={{ display: 'contents' }}>
            {i > 0 && <span className="mh-arbre-coeur" aria-hidden="true">♥</span>}
            <PersonneCard
              membre={c}
              selected={selectedId === c.id}
              onSelect={onSelect}
            />
          </span>
        ))}
      </div>

      {enfants.length > 0 && (
        <div className="mh-arbre-enfants-zone">
          <div className="mh-arbre-connector-v" aria-hidden="true" />
          <div className="mh-arbre-enfants-row">
            {enfants.map(({ membre, branches }) => (
              <div key={membre.id} className="mh-arbre-enfant-col">
                {branches.length > 0 ? (
                  <div className="mh-arbre-branches">
                    {branches.map((br, idx) =>
                      br.type === 'union' ? (
                        <UnionNoeud
                          key={`u-${br.union.id}-${idx}`}
                          noeud={br}
                          selectedId={selectedId}
                          onSelect={onSelect}
                          membres={membres}
                          unions={unions}
                        />
                      ) : (
                        <div key={`s-${br.membre.id}`} className="mh-arbre-branches">
                          <PersonneCard
                            membre={br.membre}
                            selected={selectedId === br.membre.id}
                            onSelect={onSelect}
                          />
                          {buildBranchesPersonne(br.membre.id, membres, unions).map((sub, j) =>
                            sub.type === 'union' ? (
                              <UnionNoeud
                                key={`su-${sub.union?.id}-${j}`}
                                noeud={sub}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                membres={membres}
                                unions={unions}
                              />
                            ) : null
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <PersonneCard
                    membre={membre}
                    selected={selectedId === membre.id}
                    onSelect={onSelect}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LegacyNoeud({ noeud, selectedId, onSelect }) {
  const { membre, legacyEnfants = [] } = noeud
  return (
    <div className="mh-arbre-racine">
      <PersonneCard
        membre={membre}
        selected={selectedId === membre.id}
        onSelect={onSelect}
      />
      {legacyEnfants.length > 0 && (
        <div className="mh-arbre-enfants-zone">
          <div className="mh-arbre-connector-v" />
          <div className="mh-arbre-enfants-row">
            {legacyEnfants.map((enfant) => (
              <div key={enfant.membre.id} className="mh-arbre-enfant-col">
                <LegacyNoeud noeud={enfant} selectedId={selectedId} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ArbreGenealogique({ forest, membres, unions, selectedId, onSelect }) {
  if (!forest?.length) return null

  return (
    <div className="mh-arbre-scroll">
      <div className="mh-arbre-forest">
        {forest.map((racine, i) => (
          <div key={racine.union?.id || racine.membre?.id || racine.label || i} className="mh-arbre-racine">
            {racine.type === 'group' ? (
              <div className="mh-arbre-union">
                <p className="mh-arbre-union-label">{racine.label}</p>
                <div className="mh-arbre-enfants-row">
                  {racine.legacyEnfants?.map((n) => (
                    <div key={n.membre.id} className="mh-arbre-enfant-col">
                      <LegacyNoeud noeud={n} selectedId={selectedId} onSelect={onSelect} />
                    </div>
                  ))}
                </div>
              </div>
            ) : racine.type === 'union' ? (
              <UnionNoeud
                noeud={racine}
                selectedId={selectedId}
                onSelect={onSelect}
                membres={membres}
                unions={unions}
              />
            ) : racine.legacyEnfants ? (
              <LegacyNoeud noeud={racine} selectedId={selectedId} onSelect={onSelect} />
            ) : (
              <>
                <PersonneCard
                  membre={racine.membre}
                  selected={selectedId === racine.membre?.id}
                  onSelect={onSelect}
                />
                {racine.branches?.length > 0 && (
                  <div className="mh-arbre-branches" style={{ marginTop: '1rem' }}>
                    {racine.branches.map((br, idx) =>
                      br.type === 'union' ? (
                        <UnionNoeud
                          key={`b-${br.union.id}-${idx}`}
                          noeud={br}
                          selectedId={selectedId}
                          onSelect={onSelect}
                          membres={membres}
                          unions={unions}
                        />
                      ) : null
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
