import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { SIDEBAR_NAV } from '../lib/navigation'

const ROUTE_ORDER = [
  ...SIDEBAR_NAV.map((item) => item.path),
  '/compte',
  '/login',
  '/register'
]

const AUTH_PATHS = new Set(['/login', '/register'])

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

function transitionClass(pathname, direction) {
  const parts = ['mh-route-enter']
  if (AUTH_PATHS.has(pathname)) parts.push('mh-route-enter--auth')
  else if (pathname === '/arbre') parts.push('mh-route-enter--full')
  else if (direction === 'back') parts.push('mh-route-enter--back')
  else parts.push('mh-route-enter--forward')
  return parts.join(' ')
}

/** Transition rapide et directionnelle à chaque changement de route. */
export default function PageTransition({ children }) {
  const { pathname, key: locationKey } = useLocation()
  const prevPathRef = useRef(pathname)
  const direction = getDirection(prevPathRef.current, pathname)
  prevPathRef.current = pathname

  return (
    <div key={locationKey} className={transitionClass(pathname, direction)}>
      {children}
    </div>
  )
}
