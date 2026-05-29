import { Fragment } from 'react'
import UserAvatar from './UserAvatar'
import {
  afficherAnneesCourtes,
  emojiMembre,
  couleurAvatarArbre,
  texteUnion,
  getMembreFromConjoint
} from '../lib/arbreGenealogique'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../services/arbreApi'

function IconeCoeur() {
  return (
    <span className="mh-arbre-coeur" aria-hidden="true" title="Union">
      ♥
    </span>
  )
}

function BoutonsOrdre({ onUp, onDown, label = 'Déplacer' }) {
  return (
    <div className="mh-arbre-ordre" role="group" aria-label={label}>
      <button type="button" className="mh-arbre-ordre-btn" onClick={onUp} title="Monter">
        ↑
      </button>
      <button type="button" className="mh-arbre-ordre-btn" onClick={onDown} title="Descendre">
        ↓
      </button>
    </div>
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

function EnfantsZone({
  enfants,
  selectedId,
  onSelect,
  membres,
  unions,
  unionId,
  reorganiser,
  onDeplacerEnfant
}) {
  if (!enfants?.length) return null

  return (
    <div className="mh-arbre-descendants">
      <div className="mh-arbre-connecteur-parent" aria-hidden="true">
        <div className="mh-arbre-ligne-v" />
        <div className="mh-arbre-ligne-h" />
      </div>
      <div className="mh-arbre-enfants-row">
        {enfants.map(({ membre, branches }, idx) => (
          <div key={membre.id} className="mh-arbre-colonne-enfant">
            {reorganiser && unionId && onDeplacerEnfant && (
              <BoutonsOrdre
                label={`Ordre de ${membre.nom}`}
                onUp={() => onDeplacerEnfant(unionId, membre.id, -1)}
                onDown={() => onDeplacerEnfant(unionId, membre.id, 1)}
              />
            )}
            <ColonneDescendant
              membre={membre}
              branches={branches || []}
              selectedId={selectedId}
              onSelect={onSelect}
              membres={membres}
              unions={unions}
              colorIndex={idx}
              reorganiser={reorganiser}
              onDeplacerEnfant={onDeplacerEnfant}
            />
          </div>
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
  colorIndex = 0,
  reorganiser = false,
  onDeplacerEnfant
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
                  unionId={br.union.id}
                  reorganiser={reorganiser}
                  onDeplacerEnfant={onDeplacerEnfant}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UnionNoeud({
  noeud,
  selectedId,
  onSelect,
  membres,
  unions,
  reorganiser,
  onDeplacerEnfant,
  onDeplacerUnion,
  showUnionReorder
}) {
  return (
    <div className="mh-arbre-cellule-union">
      {showUnionReorder && onDeplacerUnion && (
        <div className="mh-arbre-racine-ordre">
          <span className="mh-arbre-racine-label">{texteUnion(noeud.conjoints)}</span>
          <BoutonsOrdre
            label="Ordre du couple racine"
            onUp={() => onDeplacerUnion(noeud.union.id, -1)}
            onDown={() => onDeplacerUnion(noeud.union.id, 1)}
          />
        </div>
      )}
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
        unionId={noeud.union?.id}
        reorganiser={reorganiser}
        onDeplacerEnfant={onDeplacerEnfant}
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

function RacineNoeud({
  racine,
  selectedId,
  onSelect,
  membres,
  unions,
  reorganiser,
  onDeplacerEnfant,
  onDeplacerUnion,
  showUnionReorder
}) {
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
        reorganiser={reorganiser}
        onDeplacerEnfant={onDeplacerEnfant}
        onDeplacerUnion={onDeplacerUnion}
        showUnionReorder={showUnionReorder}
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
      reorganiser={reorganiser}
      onDeplacerEnfant={onDeplacerEnfant}
    />
  )
}

export default function ArbreGenealogique({
  forest,
  membres,
  unions,
  selectedId,
  onSelect,
  reorganiser = false,
  onDeplacerEnfant,
  onDeplacerUnion,
  zoom = 1
}) {
  if (!forest?.length) return null

  const racinesUnion = forest.filter((r) => r.type === 'union')
  const showUnionReorder = reorganiser && racinesUnion.length > 1

  return (
    <div className="mh-arbre-canvas">
      <div className="mh-arbre-scroll">
        <div
          className="mh-arbre-forest"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
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
                reorganiser={reorganiser}
                onDeplacerEnfant={onDeplacerEnfant}
                onDeplacerUnion={onDeplacerUnion}
                showUnionReorder={showUnionReorder}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
