import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { refreshCurrentUser } from './services/profileApi'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Albums from './pages/Albums'
import Arbre from './pages/Arbre'
import Membres from './pages/Membres'
import Ajouter from './pages/Ajouter'
import MobileInstallBanner from './components/MobileInstallBanner'

const Discussion = lazy(() => import('./pages/Discussion'))
const Recherche = lazy(() => import('./pages/Recherche'))
const Statistiques = lazy(() => import('./pages/Statistiques'))
const Export = lazy(() => import('./pages/Export'))

function RoutePrivee({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function PageLoader() {
  return <div className="mh-feed-loading" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement…</div>
}

function SessionSync() {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) refreshCurrentUser().catch(() => {})
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionSync />
      <MobileInstallBanner />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<RoutePrivee><Dashboard /></RoutePrivee>} />
        <Route path="/albums" element={<RoutePrivee><Albums /></RoutePrivee>} />
        <Route path="/arbre" element={<RoutePrivee><Arbre /></RoutePrivee>} />
        <Route path="/membres" element={<RoutePrivee><Membres /></RoutePrivee>} />
        <Route path="/ajouter" element={<RoutePrivee><Ajouter /></RoutePrivee>} />
        <Route path="/discussion" element={<RoutePrivee><Suspense fallback={<PageLoader />}><Discussion /></Suspense></RoutePrivee>} />
        <Route path="/recherche" element={<RoutePrivee><Suspense fallback={<PageLoader />}><Recherche /></Suspense></RoutePrivee>} />
        <Route path="/statistiques" element={<RoutePrivee><Suspense fallback={<PageLoader />}><Statistiques /></Suspense></RoutePrivee>} />
        <Route path="/export" element={<RoutePrivee><Suspense fallback={<PageLoader />}><Export /></Suspense></RoutePrivee>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
