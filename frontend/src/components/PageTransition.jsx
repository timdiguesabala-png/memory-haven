import { useLocation } from 'react-router-dom'

const AUTH_PATHS = new Set(['/login', '/register'])

function transitionClass(pathname) {
  if (AUTH_PATHS.has(pathname)) return 'mh-route-swap mh-route-swap--auth'
  if (pathname === '/arbre') return 'mh-route-swap mh-route-swap--full'
  return 'mh-route-swap'
}

/**
 * Une seule page montée à la fois (pas de double AppLayout).
 * Fondu très court à l’entrée.
 */
export default function PageTransition({ children }) {
  const { pathname, key: locationKey } = useLocation()

  return (
    <div key={locationKey} className={transitionClass(pathname)}>
      {children}
    </div>
  )
}
