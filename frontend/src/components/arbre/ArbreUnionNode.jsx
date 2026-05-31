import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

function ArbreUnionNode() {
  return (
    <div className="mh-arbre-flow-union" aria-hidden title="Union">
      <Handle id="left" type="target" position={Position.Left} className="mh-arbre-flow-handle" />
      <Handle id="right" type="source" position={Position.Right} className="mh-arbre-flow-handle" />
      <span className="mh-arbre-flow-union-heart">♥</span>
      <Handle id="bottom" type="source" position={Position.Bottom} className="mh-arbre-flow-handle" />
    </div>
  )
}

export default memo(ArbreUnionNode)
