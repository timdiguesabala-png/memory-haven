import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import ArbrePersonNode from './ArbrePersonNode'
import ArbreUnionNode from './ArbreUnionNode'
import { buildArbreFlowLayout } from '../../lib/arbreFlowLayout'
import { appBuildLabel } from '../../lib/appVersion'

const nodeTypes = {
  person: ArbrePersonNode,
  union: ArbreUnionNode
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 2.5 }
}

function enrichNodes(layoutNodes, { selectedId, canEdit, onPhotoClick, cardSize }) {
  return layoutNodes.map((n) => ({
    ...n,
    draggable: false,
    selected: n.type === 'person' && String(selectedId) === n.id,
    data:
      n.type === 'person'
        ? {
            ...n.data,
            membre: n.data.membre,
            canEdit,
            onPhotoClick,
            cardSize
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
  selectedId,
  onSelectPerson,
  onPhotoClick,
  canEdit = false,
  layoutKey = 0,
  cardSize = 'moyen'
}) {
  const flowRef = useRef(null)
  const fitDoneRef = useRef(false)

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildArbreFlowLayout(membres, cardSize),
    [membres, cardSize]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(
    enrichNodes(layoutNodes, { selectedId, canEdit, onPhotoClick, cardSize })
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(enrichEdges(layoutEdges))

  useEffect(() => {
    setNodes(enrichNodes(layoutNodes, { selectedId, canEdit, onPhotoClick, cardSize }))
    setEdges(enrichEdges(layoutEdges))
    fitDoneRef.current = false
  }, [layoutNodes, layoutEdges, selectedId, canEdit, onPhotoClick, cardSize, setNodes, setEdges])

  useEffect(() => {
    fitDoneRef.current = false
  }, [layoutKey])

  const onInit = useCallback((instance) => {
    flowRef.current = instance
  }, [])

  useEffect(() => {
    if (!flowRef.current || !nodes.length || fitDoneRef.current) return
    const t = requestAnimationFrame(() => {
      flowRef.current?.fitView({ padding: 0.12, duration: 280, maxZoom: 1.15 })
      fitDoneRef.current = true
    })
    return () => cancelAnimationFrame(t)
  }, [nodes.length, layoutKey])

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

  const fitView = useCallback(() => {
    flowRef.current?.fitView({ padding: 0.12, duration: 320, maxZoom: 1.25 })
  }, [])

  if (!membres.length) return null

  return (
    <div className="mh-arbre-flow-canvas" style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView={false}
        minZoom={0.08}
        maxZoom={2.5}
        panOnScroll
        panOnScrollMode="free"
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        preventScrolling={false}
        selectionOnDrag={false}
        nodesDraggable={false}
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
        <Panel position="top-right" className="mh-arbre-flow-panel-tr">
          <span className="mh-arbre-flow-build" title="Version déployée">
            {appBuildLabel()}
          </span>
          <button type="button" className="mh-arbre-flow-fit-btn" onClick={fitView}>
            Voir tout
          </button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
