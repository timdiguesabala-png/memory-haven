import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, useLocation, useRoutes } from 'react-router-dom'
import { refreshCurrentUser } from './services/profileApi'
import PageTransition from './components/PageTransition'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Albums from './pages/Albums'
import Arbre from './pages/Arbre'
import Membres from './pages/Membres'
import Compte from './pages/Compte'
import Ajouter from './pages/Ajouter'
import MobileInstallBanner from './components/MobileInstallBanner'
import { SocketProvider } from './context/SocketContext'

const Discussion = lazy(() => import('./pages/Discussion'))
const Recherche = lazy(() => import('./pages/Recherche'))
const Statistiques = lazy(() => import('./pages/Statistiques'))
const Export = lazy(() => import('./pages/Export'))

function RoutePrivee({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function PageLoader() {
  return (
    <div
      className="mh-feed-loading mh-route-enter"
      style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      Chargement…
    </div>
  )
}

function SessionSync() {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) refreshCurrentUser().catch(() => {})
  }, [])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  const element = useRoutes(
    [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/dashboard', element: <RoutePrivee><Dashboard /></RoutePrivee> },
      { path: '/albums', element: <RoutePrivee><Albums /></RoutePrivee> },
      { path: '/arbre', element: <RoutePrivee><Arbre /></RoutePrivee> },
      { path: '/membres', element: <RoutePrivee><Membres /></RoutePrivee> },
      { path: '/compte', element: <RoutePrivee><Compte /></RoutePrivee> },
      { path: '/ajouter', element: <RoutePrivee><Ajouter /></RoutePrivee> },
      {
        path: '/discussion',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Discussion />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/recherche',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Recherche />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/statistiques',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Statistiques />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/export',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Export />
            </Suspense>
          </RoutePrivee>
        )
      },
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '*', element: <Navigate to="/login" replace /> }
    ],
    location
  )

  return <PageTransition>{element}</PageTransition>
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <SessionSync />
        <MobileInstallBanner />
        <AnimatedRoutes />
      </SocketProvider>
    </BrowserRouter>
  )
}
