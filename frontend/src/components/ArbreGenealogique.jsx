import { Fragment } from 'react'
import UserAvatar from './UserAvatar'
import {
  afficherAnneesCourtes,
  emojiMembre,
  couleurAvatarArbre
} from '../lib/arbreGenealogique'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../services/arbreApi'

function IconeCoeur() {
  return (
    <span className="mh-arbre-coeur" aria-hidden="true" title="Union">
      ♥
    </span>
  )
}

export function PersonneCard({
  membre,
  selected,
  onSelect,
  ancetre = false,
  colorIndex = 0
}) {
  const annees = afficherAnneesCourtes(membre)
  const photo = getArbreMemberPhoto(membre)
  const colors = couleurAvatarArbre(membre, { ancetre, index: colorIndex })
  const emoji = emojiMembre(membre, { ancetre })

  return (
    <button
      type="button"
      className={[
        'mh-arbre-personne',
        selected ? 'mh-arbre-personne--selected' : '',
        ancetre ? 'mh-arbre-personne--ancetre' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect?.(membre)}
    >
      <div
        className="mh-arbre-avatar"
        style={{ background: colors.bg, color: colors.color }}
      >
        {photo ? (
          <UserAvatar
            initials={getArbreMemberInitials(membre.nom)}
            avatarUrl={photo}
            size={ancetre ? 56 : 48}
            className="mh-arbre-avatar-img"
          />
        ) : (
          <span className="mh-arbre-emoji" aria-hidden="true">
            {emoji}
          </span>
        )}
      </div>
      <div className="mh-arbre-personne-nom">{membre.nom}</div>
      {annees && <div className="mh-arbre-personne-annees">{annees}</div>}
    </button>
  )
}

function LigneCouple({ conjoints, selectedId, onSelect, ancetre = false }) {
  if (!conjoints?.length) return null
  if (conjoints.length === 1) {
    return (
      <PersonneCard
        membre={conjoints[0]}
        selected={selectedId === conjoints[0].id}
        onSelect={onSelect}
        ancetre={ancetre}
      />
    )
  }

  return (
    <div className="mh-arbre-couple-ligne">
      {conjoints.map((c, i) => (
        <Fragment key={c.id}>
          {i > 0 && <IconeCoeur />}
          <PersonneCard
            membre={c}
            selected={selectedId === c.id}
            onSelect={onSelect}
            ancetre={ancetre}
            colorIndex={i}
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
        {enfants.map(({ membre, branches }, idx) => (
          <ColonneDescendant
            key={membre.id}
            membre={membre}
            branches={branches || []}
            selectedId={selectedId}
            onSelect={onSelect}
            membres={membres}
            unions={unions}
            colorIndex={idx}
          />
        ))}
      </div>
    </div>
  )
}

function ColonneDescendant({
  membre,
  branches,
  selectedId,
  onSelect,
  membres,
  unions,
  colorIndex = 0
}) {
  const unionBranches = branches.filter((b) => b.type === 'union')

  return (
    <div className="mh-arbre-colonne">
      <div className="mh-arbre-prise-enfant" aria-hidden="true">
        <div className="mh-arbre-ligne-v mh-arbre-ligne-v--enfant" />
      </div>

      {unionBranches.length === 0 ? (
        <PersonneCard
          membre={membre}
          selected={selectedId === membre.id}
          onSelect={onSelect}
          colorIndex={colorIndex}
        />
      ) : (
        <div className="mh-arbre-unions-enfant">
          {unionBranches.map((br) => (
            <div key={br.union.id} className="mh-arbre-mariage-ligne">
              <LigneCouple
                conjoints={br.conjoints}
                selectedId={selectedId}
                onSelect={onSelect}
              />
              {br.enfants.length > 0 && (
                <EnfantsZone
                  enfants={br.enfants}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  membres={membres}
                  unions={unions}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UnionNoeud({ noeud, selectedId, onSelect, membres, unions }) {
  return (
    <div className="mh-arbre-cellule-union">
      <LigneCouple
        conjoints={noeud.conjoints}
        selectedId={selectedId}
        onSelect={onSelect}
        ancetre
      />
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
    <div className="mh-arbre-colonne">
      <PersonneCard
        membre={membre}
        selected={selectedId === membre.id}
        onSelect={onSelect}
      />
      {legacyEnfants.length > 0 && (
        <div className="mh-arbre-descendants">
          <div className="mh-arbre-connecteur-parent" aria-hidden="true">
            <div className="mh-arbre-ligne-v" />
            <div className="mh-arbre-ligne-h" />
          </div>
          <div className="mh-arbre-enfants-row">
            {legacyEnfants.map((enfant, idx) => (
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
    <ColonneDescendant
      membre={racine.membre}
      branches={racine.branches || []}
      selectedId={selectedId}
      onSelect={onSelect}
      membres={membres}
      unions={unions}
    />
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
