import { memo } from 'react'
import { BaseEdge } from '@xyflow/react'

/** Trait en T : descente verticale, barre horizontale, puis vers chaque enfant */
function ArbreGenealogyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  markerEnd,
  interactionWidth = 20
}) {
  const busY = data?.busY ?? (sourceY + targetY) / 2
  const sx = data?.sourceCenterX ?? sourceX
  const tx = data?.targetCenterX ?? targetX
  const path = `M ${sx},${sourceY} L ${sx},${busY} L ${tx},${busY} L ${tx},${targetY}`

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  )
}

export default memo(ArbreGenealogyEdge)
