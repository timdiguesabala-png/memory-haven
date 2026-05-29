import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import StandardSidebar from './StandardSidebar'
import { useTheme } from '../context/ThemeContext'
import ProfilePhotoPicker from './ProfilePhotoPicker'
import { getStoredUser } from '../lib/userStorage'
import { SIDEBAR_NAV } from '../lib/navigation'
import FamilyBackground from './FamilyBackground'

const NAV_QUICK = [
  { path: '/dashboard', label: 'Fil' },
  { path: '/albums', label: 'Albums' },
  { path: '/arbre', label: 'Arbre' },
  { path: '/membres', label: 'Membres' },
  { path: '/export', label: 'Export' }
]

export default function AppLayout({ children, sidebar, activePath, sidebarBadges }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { darkMode, setDarkMode } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())

  const current = activePath || location.pathname
  const navKey =
    SIDEBAR_NAV.find((item) => current === item.path || current.startsWith(`${item.path}/`))
      ?.key || 'dashboard'
  useEffect(() => {
    const sync = (e) => setUtilisateur(e.detail || getStoredUser())
    window.addEventListener('mh-user-updated', sync)
    return () => window.removeEventListener('mh-user-updated', sync)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [current])

  const deconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('utilisateur')
    navigate('/login')
  }

  const go = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  return (
    <div className="mh-page mh-mirror-app">
      <FamilyBackground />
      <nav className="mh-nav mh-glass-nav mh-mirror-surface">
        <div className="mh-nav-start">
          <button
            type="button"
            className="mh-nav-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <button type="button" className="mh-nav-brand" onClick={() => go('/dashboard')}>
            <span className="mh-nav-brand-icon">🏡</span>
            <span className="mh-nav-brand-text">
              <span className="mh-nav-brand-title">Memory Haven</span>
              {utilisateur.famille && (
                <span className="mh-nav-brand-family mh-nav-brand-family--desktop">
                  · {utilisateur.famille}
                </span>
              )}
            </span>
          </button>
          <nav className="mh-nav-quick" aria-label="Navigation principale">
            {NAV_QUICK.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`mh-nav-quick-btn ${
                  current === item.path || current.startsWith(`${item.path}/`)
                    ? 'mh-nav-quick-btn--active'
                    : ''
                }`}
                onClick={() => go(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mh-nav-actions">
          <div className="mh-nav-actions-bar">
            <div className="mh-nav-tools">
              <NotificationBell />
              <button
                type="button"
                className="mh-icon-btn"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
                aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>

            <div className="mh-nav-profile-card">
              <ProfilePhotoPicker
                compact
                navInline
                size={48}
                hideBadge
                nom={utilisateur.nom}
                prenom={utilisateur.prenom}
                avatarUrl={utilisateur.avatar_url}
                onUpdated={setUtilisateur}
              />
              <div className="mh-nav-profile-text">
                <span className="mh-nav-profile-name">
                  {utilisateur.prenom} {utilisateur.nom}
                </span>
                {utilisateur.famille && (
                  <span className="mh-nav-profile-family">{utilisateur.famille}</span>
                )}
              </div>
            </div>

            <button type="button" className="mh-nav-logout" onClick={deconnecter}>
              Sortir
            </button>
          </div>
        </div>
      </nav>

      <div className={`mh-app-shell ${sidebarOpen ? 'mh-menu-open' : ''}`}>
        <aside
          className={`mh-sidebar mh-glass-sidebar mh-mirror-surface ${sidebarOpen ? 'mh-sidebar--open' : ''}`}
        >
          <div className="mh-sidebar-inner fade-in">
            <StandardSidebar active={navKey} badges={sidebarBadges} />
            {sidebar}
            <div className="mh-sidebar-footer">
              <div className="mh-side-label">Compte</div>
              <div className="mh-sidebar-account">
                <ProfilePhotoPicker
                  compact
                  size={40}
                  nom={utilisateur.nom}
                  prenom={utilisateur.prenom}
                  avatarUrl={utilisateur.avatar_url}
                  onUpdated={setUtilisateur}
                />
                <div className="mh-sidebar-account-meta">
                  <span className="mh-sidebar-account-name">
                    {utilisateur.prenom} {utilisateur.nom}
                  </span>
                  {utilisateur.famille && (
                    <span className="mh-sidebar-account-family">{utilisateur.famille}</span>
                  )}
                </div>
              </div>
              <div className="mh-sidebar-footer-actions">
                <NotificationBell variant="sidebar" />
                <button
                  type="button"
                  className="mh-icon-btn mh-icon-btn--sidebar"
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Mode clair' : 'Mode sombre'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
              <button type="button" className="mh-sidebar-logout" onClick={deconnecter}>
                Sortir
              </button>
            </div>
          </div>
        </aside>
        {sidebarOpen && (
          <button
            type="button"
            className="mh-sidebar-backdrop"
            aria-label="Fermer le menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="mh-main fade-in-up">{children}</main>
      </div>
    </div>
  )
}

export function SideNav({ items, active, onNavigate }) {
  return (
    <>
      <div className="mh-side-label">Navigation</div>
      {items.map((item) => (
        <button
          key={item.key || item.label}
          type="button"
          className={`mh-side-item ${active === item.key ? 'mh-side-item--active' : ''} ${item.key === 'ajouter' ? 'mh-side-item--cta' : ''}`}
          onClick={() => item.onClick?.() || onNavigate?.(item.path)}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
          {item.badge != null && <span className="mh-side-badge">{item.badge}</span>}
        </button>
      ))}
    </>
  )
}
