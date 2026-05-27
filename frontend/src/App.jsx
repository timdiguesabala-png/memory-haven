import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Albums from './pages/Albums'
import Arbre from './pages/Arbre'
import Membres from './pages/Membres'
import Discussion from './pages/Discussion'
import Ajouter from './pages/Ajouter'
import Recherche from './pages/Recherche'
import Statistiques from './pages/Statistiques'
import Export from './pages/Export'

function RoutePrivee({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <RoutePrivee>
            <Dashboard />
          </RoutePrivee>
        } />
        <Route path="/albums" element={
          <RoutePrivee>
            <Albums />
          </RoutePrivee>
        } />
        <Route path="/arbre" element={
          <RoutePrivee>
            <Arbre />
          </RoutePrivee>
        } />
        <Route path="/membres" element={
          <RoutePrivee>
            <Membres />
          </RoutePrivee>
        } />
        <Route path="/discussion" element={
          <RoutePrivee>
            <Discussion />
          </RoutePrivee>
        } />
        <Route path="/ajouter" element={
          <RoutePrivee>
            <Ajouter />
          </RoutePrivee>
        } />
        <Route path="/recherche" element={
          <RoutePrivee>
            <Recherche />
          </RoutePrivee>
        } />
        <Route path="/statistiques" element={
          <RoutePrivee>
            <Statistiques />
          </RoutePrivee>
        } />
        <Route path="/export" element={
          <RoutePrivee>
            <Export />
          </RoutePrivee>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}