import { useLocation } from 'react-router-dom'

function transitionClass(pathname) {
  if (pathname === '/login' || pathname === '/register') return 'mh-route-enter mh-route-enter--auth'
  if (pathname === '/arbre') return 'mh-route-enter mh-route-enter--full'
  return 'mh-route-enter'
}

/** Animation à chaque changement de route. */
export default function PageTransition({ children }) {
  const { pathname, key: locationKey } = useLocation()

  return (
    <div key={locationKey} className={transitionClass(pathname)}>
      {children}
    </div>
  )
}
