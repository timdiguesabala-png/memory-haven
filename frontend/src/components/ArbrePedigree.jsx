import { Fragment } from 'react'
import UserAvatar from './UserAvatar'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../services/arbreApi'
import { buildGenerations, getNiveauPalette } from '../lib/arbreNiveaux'

function formatAnnees(membre) {
  const naissance = membre.date_naissance ? new Date(membre.date_naissance).getFullYear() : null
  const deces = membre.date_deces ? new Date(membre.date_deces).getFullYear() : null
  if (naissance && deces) return `${naissance}–${deces}`
  if (naissance) return `${naissance}–`
  return ''
}

function PedigreePerson({ membre, niveau, selected, onSelect, fontStyle }) {
  const palette = getNiveauPalette(niveau)
  const annees = formatAnnees(membre)

  return (
    <button
      type="button"
      className={`mh-pedigree-person ${selected ? 'mh-pedigree-person--selected' : ''}`}
      onClick={() => onSelect(membre)}
      title={membre.nom}
      style={fontStyle}
    >
      <UserAvatar
        initials={getArbreMemberInitials(membre.nom)}
        avatarUrl={getArbreMemberPhoto(membre)}
        size={64}
        className="mh-pedigree-photo"
        fallbackStyle={{
          background: palette.avatar,
          color: palette.text,
          border: `3px solid ${palette.border}`
        }}
      />
      <span className="mh-pedigree-name" style={{ color: palette.text }}>
        {membre.nom}
      </span>
      {annees && <span className="mh-pedigree-years">{annees}</span>}
    </button>
  )
}

function renderGenRow(gen, niveau, membreSelec, onSelect, fontStyle) {
  if (niveau === 0 && gen.length === 2) {
    return (
      <div className="mh-pedigree-couple-wrap">
        <div className="mh-pedigree-couple">
          <PedigreePerson
            membre={gen[0]}
            niveau={niveau}
            selected={membreSelec?.id === gen[0].id}
            onSelect={onSelect}
            fontStyle={fontStyle}
          />
          <span className="mh-pedigree-heart" aria-hidden>
            ♥
          </span>
          <PedigreePerson
            membre={gen[1]}
            niveau={niveau}
            selected={membreSelec?.id === gen[1].id}
            onSelect={onSelect}
            fontStyle={fontStyle}
          />
        </div>
      </div>
    )
  }

  return gen.map((membre) => (
    <div className="mh-pedigree-branch" key={membre.id}>
      {niveau > 0 && <div className="mh-pedigree-stem" />}
      <PedigreePerson
        membre={membre}
        niveau={niveau}
        selected={membreSelec?.id === membre.id}
        onSelect={onSelect}
        fontStyle={fontStyle}
      />
    </div>
  ))
}

export default function ArbrePedigree({ membres, membreSelec, onSelect, fontSize }) {
  const generations = buildGenerations(membres)
  const fontStyle = {
    '--mh-arbre-font-nom': `${fontSize}px`,
    '--mh-arbre-font-annees': `${Math.max(9, Math.round(fontSize * 0.78))}px`
  }

  return (
    <div className="mh-pedigree" style={fontStyle}>
      {generations.map((gen, niveau) => (
        <Fragment key={`gen-${niveau}`}>
          {niveau > 0 && (
            <div className="mh-pedigree-between" aria-hidden>
              <div className="mh-pedigree-between-line" />
            </div>
          )}
          <div
            className={`mh-pedigree-gen-row ${niveau > 0 ? 'mh-pedigree-gen-row--linked' : ''}`}
          >
            {renderGenRow(gen, niveau, membreSelec, onSelect, fontStyle)}
          </div>
        </Fragment>
      ))}
    </div>
  )
}
