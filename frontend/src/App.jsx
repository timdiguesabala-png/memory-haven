import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, useLocation, useRoutes } from 'react-router-dom'
import { refreshCurrentUser } from './services/profileApi'
import { prefetchAllAppPages, prefetchPage } from './lib/prefetchPages'
import Login from './pages/Login'
import Register from './pages/Register'
import MobileInstallBanner from './components/MobileInstallBanner'
import { SocketProvider } from './context/SocketContext'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Albums = lazy(() => import('./pages/Albums'))
const Arbre = lazy(() => import('./pages/Arbre'))
const Membres = lazy(() => import('./pages/Membres'))
const Compte = lazy(() => import('./pages/Compte'))
const Ajouter = lazy(() => import('./pages/Ajouter'))
const Discussion = lazy(() => import('./pages/Discussion'))
const Recherche = lazy(() => import('./pages/Recherche'))
const Statistiques = lazy(() => import('./pages/Statistiques'))
const Export = lazy(() => import('./pages/Export'))

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
      {
        path: '/export',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <Export />
            </PrivatePage>
          </RoutePrivee>
        )
      },
      { path: '/', element: <Navigate to="/login" replace /> },
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
