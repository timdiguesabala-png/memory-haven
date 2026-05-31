import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import UserAvatar from '../UserAvatar'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../../services/arbreApi'
import { formatAnneesVie } from '../../lib/arbreFlowLayout'
import { ARBRE_CARD_SIZES, DEFAULT_ARBRE_CARD_SIZE } from '../../lib/arbreCardSize'

function ArbrePersonNode({ data, selected }) {
  const membre = data?.membre
  if (!membre) return null

  const cardSize = data?.cardSize || DEFAULT_ARBRE_CARD_SIZE
  const sizeDef = ARBRE_CARD_SIZES[cardSize] || ARBRE_CARD_SIZES[DEFAULT_ARBRE_CARD_SIZE]
  const annees = formatAnneesVie(membre)
  const photoUrl = getArbreMemberPhoto(membre)

  const onPhotoClick = (e) => {
    e.stopPropagation()
    data?.onPhotoClick?.(membre)
  }

  return (
    <div
      className={`mh-arbre-flow-node mh-arbre-flow-node--${cardSize} ${selected ? 'mh-arbre-flow-node--selected' : ''}`}
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
        {annees && (
          <div className="mh-arbre-flow-node-annees" title={annees}>
            {annees}
          </div>
        )}
      </div>
      <Handle id="bottom" type="source" position={Position.Bottom} className="mh-arbre-flow-handle" />
    </div>
  )
}

export default memo(ArbrePersonNode)
