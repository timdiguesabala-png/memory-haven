import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import ArbrePersonNode from './ArbrePersonNode'
import ArbreUnionNode from './ArbreUnionNode'
import { buildArbreFlowLayout } from '../../lib/arbreFlowLayout'
import { appBuildLabel } from '../../lib/appVersion'
import {
  applySavedPositions,
  clearArbrePositionsLocal,
  mergeArbrePositions,
  positionsFromNodes,
  saveArbrePositionsLocal,
  saveArbrePositionsServer,
  clearArbrePositionsServer
} from '../../lib/arbreNodePositions'

const nodeTypes = {
  person: ArbrePersonNode,
  union: ArbreUnionNode
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 2.5 }
}

function enrichNodes(layoutNodes, { selectedId, canEdit, onPhotoClick, draggable }) {
  return layoutNodes.map((n) => ({
    ...n,
    draggable: draggable && (n.type === 'person' || n.type === 'union'),
    selected: n.type === 'person' && String(selectedId) === n.id,
    data:
      n.type === 'person'
        ? {
            ...n.data,
            membre: n.data.membre,
            canEdit,
            onPhotoClick
          }
        : n.data
  }))
}

function enrichEdges(layoutEdges) {
  return layoutEdges.map((e) => ({
    ...e,
    animated: false,
    ...(e.data?.kind === 'spouse'
      ? {
          type: 'smoothstep',
          style: { stroke: '#c8956c', strokeWidth: 2, strokeDasharray: '6 4' },
          markerEnd: undefined
        }
      : {
          type: 'smoothstep',
          style: { stroke: 'var(--mh-arbre-edge, #7b6bb8)', strokeWidth: 2.5 },
          markerEnd: undefined,
          pathOptions: { borderRadius: 12 }
        })
  }))
}

export default function ArbreGenealogyFlow({
  membres,
  familleId,
  selectedId,
  onSelectPerson,
  onPhotoClick,
  canEdit = false,
  layoutKey = 0,
  serverPositions = {},
  onResetLayout,
  onPositionsSaved
}) {
  const flowRef = useRef(null)
  const fitDoneRef = useRef(false)
  const skipNextFitRef = useRef(false)
  const [savingPos, setSavingPos] = useState(false)

  const savedPositions = useMemo(
    () => mergeArbrePositions(serverPositions, familleId),
    [serverPositions, familleId, layoutKey]
  )
  const hasCustomPositions = Object.keys(savedPositions).length > 0

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    const built = buildArbreFlowLayout(membres)
    return {
      nodes: applySavedPositions(built.nodes, savedPositions),
      edges: built.edges
    }
  }, [membres, layoutKey, savedPositions])

  const [nodes, setNodes, onNodesChange] = useNodesState(
    enrichNodes(layoutNodes, { selectedId, canEdit, onPhotoClick, draggable: canEdit })
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(enrichEdges(layoutEdges))

  useEffect(() => {
    setNodes(
      enrichNodes(layoutNodes, { selectedId, canEdit, onPhotoClick, draggable: canEdit })
    )
    setEdges(enrichEdges(layoutEdges))
    if (!hasCustomPositions) {
      fitDoneRef.current = false
    } else {
      skipNextFitRef.current = true
      fitDoneRef.current = true
    }
  }, [
    layoutNodes,
    layoutEdges,
    selectedId,
    canEdit,
    onPhotoClick,
    hasCustomPositions,
    setNodes,
    setEdges
  ])

  const onInit = useCallback((instance) => {
    flowRef.current = instance
  }, [])

  useEffect(() => {
    if (!flowRef.current || !nodes.length || fitDoneRef.current || skipNextFitRef.current) return
    const t = requestAnimationFrame(() => {
      flowRef.current?.fitView({ padding: 0.12, duration: 280, maxZoom: 1.15 })
      fitDoneRef.current = true
    })
    return () => cancelAnimationFrame(t)
  }, [nodes.length, layoutKey, hasCustomPositions])

  const onNodeClick = useCallback(
    (_, node) => {
      if (node.type !== 'person' || !node.data?.membre) return
      onSelectPerson?.(node.data.membre)
    },
    [onSelectPerson]
  )

  const onPaneClick = useCallback(() => {
    onSelectPerson?.(null)
  }, [onSelectPerson])

  const persistPositions = useCallback(
    (nodesList) => {
      if (!canEdit || !familleId) return
      const positions = positionsFromNodes(nodesList)
      saveArbrePositionsLocal(familleId, positions)
      setSavingPos(true)
      saveArbrePositionsServer(positions)
        .then((saved) => {
          saveArbrePositionsLocal(familleId, saved)
          onPositionsSaved?.(saved)
        })
        .catch(() => {
          /* garde le cache local si le serveur est indisponible */
        })
        .finally(() => setSavingPos(false))
    },
    [canEdit, familleId, onPositionsSaved]
  )

  const onNodeDragStop = useCallback(() => {
    setNodes((current) => {
      persistPositions(current)
      return current
    })
  }, [persistPositions, setNodes])

  const fitView = useCallback(() => {
    flowRef.current?.fitView({ padding: 0.12, duration: 320, maxZoom: 1.25 })
  }, [])

  const resetAutoLayout = useCallback(async () => {
    if (!window.confirm('Réorganiser automatiquement l’arbre ? Vos positions manuelles seront effacées.')) {
      return
    }
    clearArbrePositionsLocal(familleId)
    try {
      await clearArbrePositionsServer()
    } catch {
      /* migration serveur peut être en attente */
    }
    onPositionsSaved?.({})
    skipNextFitRef.current = false
    fitDoneRef.current = false
    onResetLayout?.()
  }, [familleId, onResetLayout, onPositionsSaved])

  if (!membres.length) return null

  return (
    <div
      className={`mh-arbre-flow-canvas ${canEdit ? 'mh-arbre-flow-canvas--draggable' : ''}`}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView={false}
        minZoom={0.08}
        maxZoom={2.5}
        nodeDragThreshold={6}
        panOnScroll
        panOnScrollMode="free"
        zoomOnScroll
        zoomOnPinch
        panOnDrag={[1, 2]}
        preventScrolling={false}
        selectionOnDrag={false}
        nodesDraggable={canEdit}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} className="mh-arbre-flow-bg" />
        <Controls
          className="mh-arbre-flow-controls"
          showInteractive={false}
          position="bottom-right"
        />
        <MiniMap
          className="mh-arbre-flow-minimap"
          position="bottom-left"
          zoomable
          pannable
          nodeColor={(n) => (n.type === 'union' ? '#c8956c' : '#7b6bb8')}
        />
        <Panel position="top-right" className="mh-arbre-flow-panel-tr">
          <span className="mh-arbre-flow-build" title="Version déployée">
            {appBuildLabel()}
          </span>
          {canEdit && (
            <span className="mh-arbre-flow-hint" title="Positions synchronisées pour toute la famille">
              {savingPos ? '💾…' : '✋ Déplacer'}
            </span>
          )}
          <button type="button" className="mh-arbre-flow-fit-btn" onClick={fitView}>
            Voir tout
          </button>
          {canEdit && (
            <button type="button" className="mh-arbre-flow-fit-btn" onClick={resetAutoLayout}>
              Réorganiser
            </button>
          )}
        </Panel>
      </ReactFlow>
    </div>
  )
}
