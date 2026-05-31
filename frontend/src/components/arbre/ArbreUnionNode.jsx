import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

function ArbreUnionNode() {
  return (
    <div className="mh-arbre-flow-union" aria-hidden>
      <Handle id="top" type="target" position={Position.Top} className="mh-arbre-flow-handle" />
      <span className="mh-arbre-flow-union-heart">♥</span>
      <Handle id="bottom" type="source" position={Position.Bottom} className="mh-arbre-flow-handle" />
    </div>
  )
}

export default memo(ArbreUnionNode)
