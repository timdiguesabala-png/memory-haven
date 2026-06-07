import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, useLocation, useRoutes } from 'react-router-dom'
import { refreshCurrentUser } from './services/profileApi'
import { prefetchAllAppPages, prefetchPage } from './lib/prefetchPages'
import { isSupabaseMode } from './lib/supabaseClient'
import { supabaseGetSession } from './services/supabaseAuth'
import { AuthProvider, useAuth } from './context/AuthContext'
import MobileInstallBanner from './components/MobileInstallBanner'
import { SocketProvider } from './context/SocketContext'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const MotDePasseOublie = lazy(() => import('./pages/MotDePasseOublie'))
const ReinitialiserMotDePasse = lazy(() => import('./pages/ReinitialiserMotDePasse'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))

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
const MembreFiche = lazy(() => import('./pages/MembreFiche'))
const Compte = lazy(() => import('./pages/Compte'))
const Ajouter = lazy(() => import('./pages/Ajouter'))
const Discussion = lazy(() => import('./pages/Discussion'))
const Recherche = lazy(() => import('./pages/Recherche'))
const Statistiques = lazy(() => import('./pages/Statistiques'))

function AuthBootScreen() {
  return (
    <div className="mh-auth-boot" role="status" aria-live="polite" aria-label="Chargement">
      <span className="mh-auth-boot-dot" aria-hidden="true" />
    </div>
  )
}

function RoutePrivee({ children }) {
  const { authReady, session, utilisateur, isSupabaseMode: supabase } = useAuth()

  if (supabase) {
    if (!authReady) return <AuthBootScreen />
    if (session && utilisateur) return children
    return <Navigate to="/login" replace />
  }

  const legacyToken = localStorage.getItem('token')
  return legacyToken ? children : <Navigate to="/login" replace />
}

/** Pas d’écran « Chargement » — préfetch en amont, repli invisible */
function PrivatePage({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

function PublicPage({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

function SessionSync() {
  useEffect(() => {
    ;(async () => {
      if (isSupabaseMode()) {
        const session = await supabaseGetSession()
        if (session) {
          refreshCurrentUser().catch(() => {})
          prefetchAllAppPages()
        }
        return
      }
      const token = localStorage.getItem('token')
      if (!token) return
      refreshCurrentUser().catch(() => {})
      prefetchAllAppPages()
    })()
  }, [])
  return null
}

function AppRoutes() {
  const location = useLocation()

  useEffect(() => {
    if (localStorage.getItem('token') || (isSupabaseMode() && localStorage.getItem('utilisateur'))) {
      prefetchPage(location.pathname)
    }
  }, [location.pathname])

  return useRoutes(
    [
      { path: '/login', element: <PublicPage><Login /></PublicPage> },
      { path: '/register', element: <PublicPage><Register /></PublicPage> },
      { path: '/auth/callback', element: <PublicPage><AuthCallback /></PublicPage> },
      { path: '/mot-de-passe-oublie', element: <PublicPage><MotDePasseOublie /></PublicPage> },
      { path: '/reinitialiser-mot-de-passe', element: <PublicPage><ReinitialiserMotDePasse /></PublicPage> },
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
        path: '/membre/:id',
        element: (
          <RoutePrivee>
            <PrivatePage>
              <MembreFiche />
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
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
          <SessionSync />
          <MobileInstallBanner />
          <AppRoutes />
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
