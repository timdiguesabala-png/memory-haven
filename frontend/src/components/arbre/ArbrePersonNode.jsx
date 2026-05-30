import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import UserAvatar from '../UserAvatar'
import { getArbreMemberInitials, getArbreMemberPhoto } from '../../services/arbreApi'
import { formatNaissance, genreLabel } from '../../lib/arbreFlowLayout'

function ArbrePersonNode({ data, selected }) {
  const membre = data?.membre
  if (!membre) return null

  const naissance = formatNaissance(membre)
  const genre = genreLabel(membre.genre)

  return (
    <div className={`mh-arbre-flow-node ${selected ? 'mh-arbre-flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="mh-arbre-flow-handle" />
      <div className="mh-arbre-flow-node-photo">
        <UserAvatar
          initials={getArbreMemberInitials(membre.nom)}
          avatarUrl={getArbreMemberPhoto(membre)}
          size={56}
          className="mh-arbre-flow-avatar"
        />
      </div>
      <div className="mh-arbre-flow-node-body">
        <div className="mh-arbre-flow-node-nom" title={membre.nom}>
          {membre.nom}
        </div>
        <div className="mh-arbre-flow-node-meta">
          <span className="mh-arbre-flow-node-genre">{genre}</span>
        </div>
        {naissance && <div className="mh-arbre-flow-node-date">{naissance}</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="mh-arbre-flow-handle" />
    </div>
  )
}

export default memo(ArbrePersonNode)
