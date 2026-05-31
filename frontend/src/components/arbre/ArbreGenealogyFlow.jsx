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
  style: { stroke: '#7b6bb8', strokeWidth: 3 }
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
  return layoutEdges.map((e) => {
    const isSpouse = e.data?.kind === 'spouse'
    return {
      ...e,
      type: 'smoothstep',
      animated: false,
      className: isSpouse ? 'mh-arbre-edge-spouse' : 'mh-arbre-edge-family',
      style: isSpouse
        ? { stroke: '#c06060', strokeWidth: 2.5, strokeDasharray: '5 4' }
        : { stroke: '#7b6bb8', strokeWidth: 3 },
      markerEnd: undefined,
      ...(isSpouse ? {} : { pathOptions: { borderRadius: 14 } })
    }
  })
}

export default function ArbreGenealogyFlow({
  membres,
  selectedId,
  onSelectPerson,
  onPhotoClick,
  canEdit = false,
  layoutKey = 0,
  cardSize = 'grand'
}) {
  const canvasRef = useRef(null)
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

  const runFitView = useCallback(() => {
    if (!flowRef.current || !nodes.length) return
    flowRef.current.fitView({
      padding: 0.05,
      duration: 280,
      maxZoom: 1.35,
      minZoom: 0.12,
      includeHiddenNodes: false
    })
    fitDoneRef.current = true
  }, [nodes.length])

  const onInit = useCallback((instance) => {
    flowRef.current = instance
  }, [])

  useEffect(() => {
    if (!flowRef.current || !nodes.length || fitDoneRef.current) return
    const t = requestAnimationFrame(() => {
      runFitView()
    })
    return () => cancelAnimationFrame(t)
  }, [nodes.length, layoutKey, runFitView])

  useEffect(() => {
    const el = canvasRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let timer
    const ro = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        fitDoneRef.current = false
        runFitView()
      }, 120)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      clearTimeout(timer)
    }
  }, [runFitView])

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
    fitDoneRef.current = false
    runFitView()
  }, [runFitView])

  if (!membres.length) return null

  return (
    <div ref={canvasRef} className="mh-arbre-flow-canvas">
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
        onlyRenderVisibleElements
        fitView={false}
        minZoom={0.04}
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
            Ajuster
          </button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
