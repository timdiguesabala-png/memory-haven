import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, useLocation, useRoutes } from 'react-router-dom'
import { refreshCurrentUser } from './services/profileApi'
import { prefetchAllAppPages, prefetchPage } from './lib/prefetchPages'
import Login from './pages/Login'
import Register from './pages/Register'
import MobileInstallBanner from './components/MobileInstallBanner'
import { SocketProvider } from './context/SocketContext'

const Accueil = lazy(() => import('./pages/Accueil'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Heritage = lazy(() => import('./pages/Heritage'))
const Hommage = lazy(() => import('./pages/Hommage'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Carte = lazy(() => import('./pages/Carte'))
const Capsules = lazy(() => import('./pages/Capsules'))
const Livre = lazy(() => import('./pages/Livre'))
const Albums = lazy(() => import('./pages/Albums'))
const Arbre = lazy(() => import('./pages/Arbre'))
const Membres = lazy(() => import('./pages/Membres'))
const Compte = lazy(() => import('./pages/Compte'))
const Ajouter = lazy(() => import('./pages/Ajouter'))
const Discussion = lazy(() => import('./pages/Discussion'))
const Recherche = lazy(() => import('./pages/Recherche'))
const Statistiques = lazy(() => import('./pages/Statistiques'))

function RoutePrivee({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

/** Pas d’écran « Chargement » — préfetch en amont, repli invisible */
function PrivatePage({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

function SessionSync() {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    refreshCurrentUser().catch(() => {})
    prefetchAllAppPages()
  }, [])
  return null
}

function AppRoutes() {
  const location = useLocation()

  useEffect(() => {
    if (localStorage.getItem('token')) prefetchPage(location.pathname)
  }, [location.pathname])

  return useRoutes(
    [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      {
        path: '/accueil',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Accueil />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/dashboard',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Dashboard />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/heritage',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Heritage />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/hommage',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Hommage />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/timeline',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Timeline />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/carte',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Carte />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/capsules',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Capsules />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/livre',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Livre />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/albums',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Albums />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/arbre',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Arbre />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/membres',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Membres />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/compte',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Compte />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/ajouter',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Ajouter />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/discussion',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Discussion />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/recherche',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Recherche />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      {
        path: '/statistiques',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Statistiques />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      { path: '/', element: <Navigate to="/accueil" replace /> },
      { path: '*', element: <Navigate to="/login" replace /> }
    ],
    location
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <SessionSync />
        <MobileInstallBanner />
        <AppRoutes />
      </SocketProvider>
    </BrowserRouter>
  )
}
