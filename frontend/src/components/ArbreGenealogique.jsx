import { Fragment } from 'react'
import UserAvatar from './UserAvatar'
import { afficherAnneesCourtes, sousTitreMembre } from '../lib/arbreGenealogique'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../services/arbreApi'

function IconeUnion() {
  return (
    <span className="mh-arbre-union-icon" aria-hidden="true" title="Union">
      <svg viewBox="0 0 40 40" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="20" r="9" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="25" cy="20" r="9" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    </span>
  )
}

export function PersonneCard({ membre, selected, onSelect, featured = false }) {
  const annees = afficherAnneesCourtes(membre)
  const sousTitre = sousTitreMembre(membre)
  const portraitSize = featured ? 108 : 86

  return (
    <button
      type="button"
      className={[
        'mh-arbre-personne',
        selected ? 'mh-arbre-personne--selected' : '',
        featured ? 'mh-arbre-personne--featured' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect?.(membre)}
    >
      <div className="mh-arbre-portrait">
        <UserAvatar
          initials={getArbreMemberInitials(membre.nom)}
          avatarUrl={getArbreMemberPhoto(membre)}
          size={portraitSize}
          className="mh-arbre-portrait-img"
          fallbackStyle={{
            background: 'linear-gradient(165deg, #3a3428 0%, #1e1c18 100%)',
            color: '#c9a227'
          }}
        />
      </div>
      <div className="mh-arbre-personne-nom">{membre.nom}</div>
      {annees && <div className="mh-arbre-personne-annees">{annees}</div>}
      {sousTitre && <div className="mh-arbre-personne-role">{sousTitre}</div>}
    </button>
  )
}

function LigneCouple({ conjoints, selectedId, onSelect }) {
  if (!conjoints?.length) return null
  if (conjoints.length === 1) {
    return (
      <PersonneCard
        membre={conjoints[0]}
        selected={selectedId === conjoints[0].id}
        onSelect={onSelect}
        featured={selectedId === conjoints[0].id}
      />
    )
  }

  return (
    <div className="mh-arbre-couple-ligne">
      {conjoints.map((c, i) => (
        <Fragment key={c.id}>
          {i > 0 && <IconeUnion />}
          <PersonneCard
            membre={c}
            selected={selectedId === c.id}
            onSelect={onSelect}
            featured={selectedId === c.id}
          />
        </Fragment>
      ))}
    </div>
  )
}

function EnfantsZone({ enfants, selectedId, onSelect, membres, unions }) {
  if (!enfants?.length) return null

  return (
    <div className="mh-arbre-descendants">
      <div className="mh-arbre-connecteur-parent" aria-hidden="true">
        <div className="mh-arbre-ligne-v" />
        <div className="mh-arbre-ligne-h" />
      </div>
      <div className="mh-arbre-enfants-row">
        {enfants.map(({ membre, branches }) => (
          <ColonneDescendant
            key={membre.id}
            membre={membre}
            branches={branches || []}
            selectedId={selectedId}
            onSelect={onSelect}
            membres={membres}
            unions={unions}
          />
        ))}
      </div>
    </div>
  )
}

function MariageSousPersonne({ noeud, personneId, selectedId, onSelect, membres, unions }) {
  const spouses = noeud.conjoints.filter((c) => c.id !== personneId)

  return (
    <div className="mh-arbre-mariage-sous">
      <div className="mh-arbre-liaison-union" aria-hidden="true">
        <div className="mh-arbre-ligne-v mh-arbre-ligne-v--court" />
        <IconeUnion />
      </div>
      <div className="mh-arbre-conjoints-stack">
        {spouses.map((s) => (
          <PersonneCard
            key={s.id}
            membre={s}
            selected={selectedId === s.id}
            onSelect={onSelect}
          />
        ))}
      </div>
      {noeud.enfants.length > 0 && (
        <EnfantsZone
          enfants={noeud.enfants}
          selectedId={selectedId}
          onSelect={onSelect}
          membres={membres}
          unions={unions}
        />
      )}
    </div>
  )
}

function ColonneDescendant({ membre, branches, selectedId, onSelect, membres, unions }) {
  const unionBranches = branches.filter((b) => b.type === 'union')
  const isFeatured = selectedId === membre.id

  return (
    <div className="mh-arbre-colonne">
      <div className="mh-arbre-prise-enfant" aria-hidden="true">
        <div className="mh-arbre-ligne-v mh-arbre-ligne-v--enfant" />
      </div>
      <PersonneCard
        membre={membre}
        selected={isFeatured}
        onSelect={onSelect}
        featured={isFeatured}
      />
      {unionBranches.map((br) => (
        <MariageSousPersonne
          key={br.union.id}
          noeud={br}
          personneId={membre.id}
          selectedId={selectedId}
          onSelect={onSelect}
          membres={membres}
          unions={unions}
        />
      ))}
    </div>
  )
}

function UnionNoeud({ noeud, selectedId, onSelect, membres, unions }) {
  return (
    <div className="mh-arbre-cellule-union">
      <LigneCouple conjoints={noeud.conjoints} selectedId={selectedId} onSelect={onSelect} />
      <EnfantsZone
        enfants={noeud.enfants}
        selectedId={selectedId}
        onSelect={onSelect}
        membres={membres}
        unions={unions}
      />
    </div>
  )
}

function LegacyNoeud({ noeud, selectedId, onSelect }) {
  const { membre, legacyEnfants = [] } = noeud

  return (
    <div className="mh-arbre-colonne mh-arbre-colonne--legacy">
      <PersonneCard
        membre={membre}
        selected={selectedId === membre.id}
        onSelect={onSelect}
        featured={selectedId === membre.id}
      />
      {legacyEnfants.length > 0 && (
        <div className="mh-arbre-descendants">
          <div className="mh-arbre-connecteur-parent" aria-hidden="true">
            <div className="mh-arbre-ligne-v" />
            <div className="mh-arbre-ligne-h" />
          </div>
          <div className="mh-arbre-enfants-row">
            {legacyEnfants.map((enfant) => (
              <div key={enfant.membre.id} className="mh-arbre-colonne">
                <div className="mh-arbre-prise-enfant" aria-hidden="true">
                  <div className="mh-arbre-ligne-v mh-arbre-ligne-v--enfant" />
                </div>
                <LegacyNoeud noeud={enfant} selectedId={selectedId} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RacineNoeud({ racine, selectedId, onSelect, membres, unions }) {
  if (racine.type === 'group') {
    return (
      <div className="mh-arbre-groupe-orphelins">
        <p className="mh-arbre-groupe-label">{racine.label}</p>
        <div className="mh-arbre-enfants-row">
          {racine.legacyEnfants?.map((n) => (
            <div key={n.membre.id} className="mh-arbre-colonne">
              <LegacyNoeud noeud={n} selectedId={selectedId} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (racine.type === 'union') {
    return (
      <UnionNoeud
        noeud={racine}
        selectedId={selectedId}
        onSelect={onSelect}
        membres={membres}
        unions={unions}
      />
    )
  }

  if (racine.legacyEnfants) {
    return <LegacyNoeud noeud={racine} selectedId={selectedId} onSelect={onSelect} />
  }

  return (
    <div className="mh-arbre-colonne">
      <PersonneCard
        membre={racine.membre}
        selected={selectedId === racine.membre?.id}
        onSelect={onSelect}
        featured={selectedId === racine.membre?.id}
      />
      {racine.branches?.length > 0 && (
        <div className="mh-arbre-mariages-racine">
          {racine.branches
            .filter((br) => br.type === 'union')
            .map((br) => (
              <MariageSousPersonne
                key={br.union.id}
                noeud={br}
                personneId={racine.membre.id}
                selectedId={selectedId}
                onSelect={onSelect}
                membres={membres}
                unions={unions}
              />
            ))}
          {racine.branches
            .filter((br) => br.type === 'single')
            .map((br) => (
              <PersonneCard
                key={br.membre.id}
                membre={br.membre}
                selected={selectedId === br.membre.id}
                onSelect={onSelect}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export default function ArbreGenealogique({ forest, membres, unions, selectedId, onSelect }) {
  if (!forest?.length) return null

  return (
    <div className="mh-arbre-canvas">
      <div className="mh-arbre-scroll">
        <div className="mh-arbre-forest">
          {forest.map((racine, i) => (
            <div
              key={racine.union?.id || racine.membre?.id || racine.label || i}
              className="mh-arbre-racine"
            >
              <RacineNoeud
                racine={racine}
                selectedId={selectedId}
                onSelect={onSelect}
                membres={membres}
                unions={unions}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
