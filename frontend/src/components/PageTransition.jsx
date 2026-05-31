import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SIDEBAR_NAV } from '../lib/navigation'

const ROUTE_ORDER = [
  ...SIDEBAR_NAV.map((item) => item.path),
  '/compte',
  '/login',
  '/register'
]

const AUTH_PATHS = new Set(['/login', '/register'])
const TRANSITION_MS = 75

function getDirection(fromPath, toPath) {
  if (!fromPath || fromPath === toPath) return 'forward'
  if (AUTH_PATHS.has(fromPath) && AUTH_PATHS.has(toPath)) return 'auth'
  if (toPath === '/arbre' || fromPath === '/arbre') return 'full'

  const fromIdx = ROUTE_ORDER.indexOf(fromPath)
  const toIdx = ROUTE_ORDER.indexOf(toPath)
  if (fromIdx === -1 || toIdx === -1) {
    if (AUTH_PATHS.has(fromPath) && !AUTH_PATHS.has(toPath)) return 'forward'
    if (!AUTH_PATHS.has(fromPath) && AUTH_PATHS.has(toPath)) return 'back'
    return 'forward'
  }
  return toIdx > fromIdx ? 'forward' : 'back'
}

/**
 * Crossfade : ancienne et nouvelle page visibles en même temps (pas de blanc).
 */
export default function PageTransition({ children }) {
  const location = useLocation()
  const locRef = useRef(location)
  const childRef = useRef(children)

  const [layers, setLayers] = useState(() => [
    { key: location.key, node: children, mode: 'current', dir: 'forward', path: location.pathname }
  ])

  useLayoutEffect(() => {
    if (locRef.current.key === location.key) {
      childRef.current = children
      setLayers((prev) => {
        if (prev.length === 1 && prev[0].mode === 'current') {
          return [{ ...prev[0], node: children }]
        }
        return prev
      })
      return undefined
    }

    const dir = getDirection(locRef.current.pathname, location.pathname)
    const outgoing = {
      key: locRef.current.key,
      node: childRef.current,
      mode: 'exit',
      dir,
      path: locRef.current.pathname
    }
    const incoming = {
      key: location.key,
      node: children,
      mode: 'enter',
      dir,
      path: location.pathname
    }

    setLayers([outgoing, incoming])
    locRef.current = location
    childRef.current = children

    const t = window.setTimeout(() => {
      setLayers([
        { key: location.key, node: children, mode: 'current', dir, path: location.pathname }
      ])
    }, TRANSITION_MS)

    return () => window.clearTimeout(t)
  }, [location.key, location.pathname, children])

  return (
    <div className="mh-route-stage">
      {layers.map((layer) => (
        <div
          key={`${layer.key}-${layer.mode}`}
          className={[
            'mh-route-layer',
            `mh-route-layer--${layer.mode}`,
            `mh-route-layer--${layer.dir}`
          ].join(' ')}
          aria-hidden={layer.mode === 'exit' ? true : undefined}
        >
          {layer.node}
        </div>
      ))}
    </div>
  )
}
