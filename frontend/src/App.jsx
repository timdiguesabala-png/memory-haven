import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, useLocation, useRoutes } from 'react-router-dom'
import { refreshCurrentUser } from './services/profileApi'
import PageTransition from './components/PageTransition'
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

function PageLoader() {
  return (
    <div
      className="mh-feed-loading"
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
      {
        path: '/dashboard',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/albums',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Albums />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/arbre',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Arbre />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/membres',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Membres />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/compte',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Compte />
            </Suspense>
          </RoutePrivee>
        )
      },
      {
        path: '/ajouter',
        element: (
          <RoutePrivee>
            <Suspense fallback={<PageLoader />}>
              <Ajouter />
            </Suspense>
          </RoutePrivee>
        )
      },
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
