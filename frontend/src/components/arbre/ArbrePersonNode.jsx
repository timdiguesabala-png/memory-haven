import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import UserAvatar from '../UserAvatar'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../../services/arbreApi'
import { formatDateCarte } from '../../lib/arbreFlowLayout'
import { ARBRE_CARD_SIZES, DEFAULT_ARBRE_CARD_SIZE } from '../../lib/arbreCardSize'

const GENRE_ICON = {
  HOMME: '♂',
  FEMME: '♀',
  NON_PRECISE: '•'
}

function genreClass(genre) {
  if (genre === 'HOMME') return 'mh-arbre-flow-node--homme'
  if (genre === 'FEMME') return 'mh-arbre-flow-node--femme'
  return 'mh-arbre-flow-node--neutre'
}

function ArbrePersonNode({ data, selected }) {
  const membre = data?.membre
  if (!membre) return null

  const cardSize = data?.cardSize || DEFAULT_ARBRE_CARD_SIZE
  const sizeDef = ARBRE_CARD_SIZES[cardSize] || ARBRE_CARD_SIZES[DEFAULT_ARBRE_CARD_SIZE]
  const dateLabel = formatDateCarte(membre)
  const photoUrl = getArbreMemberPhoto(membre)
  const genre = membre.genre || 'NON_PRECISE'

  const onPhotoClick = (e) => {
    e.stopPropagation()
    data?.onPhotoClick?.(membre)
  }

  return (
    <div
      className={`mh-arbre-flow-node mh-arbre-flow-node--${cardSize} ${genreClass(genre)} ${selected ? 'mh-arbre-flow-node--selected' : ''}`}
    >
      <Handle id="top" type="target" position={Position.Top} className="mh-arbre-flow-handle" />
      <Handle id="left" type="target" position={Position.Left} className="mh-arbre-flow-handle" />
      <Handle id="right" type="source" position={Position.Right} className="mh-arbre-flow-handle" />
      <div className="mh-arbre-flow-node-photo">
        <UserAvatar
          initials={getArbreMemberInitials(membre.nom)}
          avatarUrl={photoUrl}
          size={sizeDef.avatar}
          className="mh-arbre-flow-avatar"
        />
        {data?.canEdit && (
          <button
            type="button"
            className="mh-arbre-flow-node-photo-btn"
            title="Changer la photo"
            aria-label="Changer la photo"
            onClick={onPhotoClick}
          >
            📷
          </button>
        )}
      </div>
      <div className="mh-arbre-flow-node-text">
        <div className="mh-arbre-flow-node-nom" title={membre.nom}>
          {membre.nom}
        </div>
        {dateLabel && (
          <div className="mh-arbre-flow-node-date" title={dateLabel}>
            {dateLabel}
          </div>
        )}
      </div>
      <span className="mh-arbre-flow-node-genre-icon" aria-hidden>
        {GENRE_ICON[genre] || GENRE_ICON.NON_PRECISE}
      </span>
      <Handle id="bottom" type="source" position={Position.Bottom} className="mh-arbre-flow-handle" />
    </div>
  )
}

export default memo(ArbrePersonNode)
