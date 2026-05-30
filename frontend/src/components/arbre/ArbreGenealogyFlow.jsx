import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType
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
  style: { strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 }
}

export default function ArbreGenealogyFlow({
  membres,
  selectedId,
  onSelectPerson,
  onPhotoClick,
  canEdit = false,
  layoutKey = 0
}) {
  const flowRef = useRef(null)
  const fitDoneRef = useRef(false)

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildArbreFlowLayout(membres),
    [membres, layoutKey]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)

  useEffect(() => {
    setNodes(
      layoutNodes.map((n) => ({
        ...n,
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
    )
    setEdges(
      layoutEdges.map((e) => ({
        ...e,
        animated: false,
        ...(e.type === 'spouse'
          ? {
              type: 'smoothstep',
              style: { stroke: '#c8956c', strokeWidth: 2, strokeDasharray: '6 4' },
              markerEnd: undefined
            }
          : {
              type: 'smoothstep',
              style: { stroke: 'var(--mh-arbre-edge, #9a8ab8)', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--mh-arbre-edge, #9a8ab8)' }
            })
      }))
    )
    fitDoneRef.current = false
  }, [layoutNodes, layoutEdges, selectedId, canEdit, onPhotoClick, setNodes, setEdges])

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
    <div className="mh-arbre-flow-canvas">
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
          <button type="button" className="mh-arbre-flow-fit-btn" onClick={fitView}>
            Voir tout
          </button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
