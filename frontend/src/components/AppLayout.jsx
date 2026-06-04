import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import StandardSidebar from './StandardSidebar'
import UpdateStatusBar from './UpdateStatusBar'
import { useTheme } from '../context/ThemeContext'
import ProfilePhotoPicker from './ProfilePhotoPicker'
import { getStoredUser } from '../lib/userStorage'
import { SIDEBAR_NAV } from '../lib/navigation'
import FamilyBackground from './FamilyBackground'
import { appBuildLabel, forceAppRefresh } from '../lib/appVersion.js'
import { isSupabaseMode } from '../lib/supabaseClient'
import { supabaseSignOut, clearSupabaseSession } from '../services/supabaseAuth'
import { prefetchPage } from '../lib/prefetchPages'

export default function AppLayout({ children, sidebar, activePath, sidebarBadges }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { darkMode, setDarkMode, comfortMode, setComfortMode } = useTheme()
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

  useEffect(() => {
    document.body.classList.remove('mh-scroll-lock')
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
  }, [current])

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.classList.remove('mh-scroll-lock')
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      return undefined
    }
    document.body.classList.add('mh-scroll-lock')
    return () => {
      document.body.classList.remove('mh-scroll-lock')
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [sidebarOpen])

  const deconnecter = async () => {
    if (isSupabaseMode()) {
      await supabaseSignOut()
      clearSupabaseSession()
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('utilisateur')
    }
    navigate('/login')
  }

  const go = (path) => {
    prefetchPage(path)
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
          <button type="button" className="mh-nav-brand" onClick={() => go('/accueil')}>
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
        </div>

        <div className="mh-nav-actions">
          <div className="mh-nav-actions-bar">
            <div className="mh-nav-tools">
              <button
                type="button"
                className="mh-icon-btn mh-nav-discussion-btn"
                onClick={() => go('/discussion')}
                title="Discussion familiale"
                aria-label="Discussion familiale"
              >
                💬
              </button>
              <NotificationBell />
              <button
                type="button"
                className="mh-icon-btn"
                onClick={() => setComfortMode(!comfortMode)}
                title={comfortMode ? 'Mode standard' : 'Mode confort (texte agrandi)'}
                aria-label={comfortMode ? 'Mode standard' : 'Mode confort'}
              >
                {comfortMode ? '🔤' : '👓'}
              </button>
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

            <button
              type="button"
              className="mh-nav-logout"
              onClick={deconnecter}
              title="Se déconnecter"
            >
              Déconnexion
            </button>

            <button
              type="button"
              className="mh-nav-profile-card mh-nav-profile-card--link"
              onClick={() => go('/compte')}
              title="Gérer mon compte"
            >
              <ProfilePhotoPicker
                compact
                navInline
                size={48}
                hideBadge
                editable={false}
                nom={utilisateur.nom}
                prenom={utilisateur.prenom}
                avatarUrl={utilisateur.avatar_url}
              />
              <div className="mh-nav-profile-text">
                <span className="mh-nav-profile-name">
                  {utilisateur.prenom} {utilisateur.nom}
                </span>
              </div>
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
              <button
                type="button"
                className="mh-sidebar-account mh-sidebar-account--link"
                onClick={() => go('/compte')}
              >
                <ProfilePhotoPicker
                  compact
                  size={40}
                  editable={false}
                  nom={utilisateur.nom}
                  prenom={utilisateur.prenom}
                  avatarUrl={utilisateur.avatar_url}
                />
                <div className="mh-sidebar-account-meta">
                  <span className="mh-sidebar-account-name">
                    {utilisateur.prenom} {utilisateur.nom}
                  </span>
                  {utilisateur.famille && (
                    <span className="mh-sidebar-account-family">{utilisateur.famille}</span>
                  )}
                </div>
              </button>
              <button type="button" className="mh-side-item mh-side-item--account" onClick={() => go('/compte')}>
                <span>⚙️</span>
                <span>Gérer mon compte</span>
              </button>
              <div className="mh-sidebar-footer-actions">
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
                Déconnexion
              </button>
              <p className="mh-build-footer" title="Version de l'application">
                Build {appBuildLabel()}
              </p>
              <button
                type="button"
                className="mh-sidebar-refresh-app"
                onClick={forceAppRefresh}
              >
                Mettre à jour l&apos;app
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
        <main className="mh-main fade-in-up">
          <UpdateStatusBar />
          {children}
        </main>
      </div>
    </div>
  )
}

export function SideNav({ items, groups, active, onNavigate }) {
  if (groups?.length) {
    return (
      <>
        {groups.map((group) => (
          <div key={group.label} className="mh-side-group">
            <div className="mh-side-label">{group.label}</div>
            {group.items.map((item) => (
              <SideNavButton key={item.key} item={item} active={active} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </>
    )
  }
  return (
    <>
      <div className="mh-side-label">Navigation</div>
      {items.map((item) => (
        <SideNavButton key={item.key || item.label} item={item} active={active} onNavigate={onNavigate} />
      ))}
    </>
  )
}

function SideNavButton({ item, active, onNavigate }) {
  return (
    <button
      type="button"
      className={`mh-side-item ${active === item.key ? 'mh-side-item--active' : ''} ${item.key === 'ajouter' ? 'mh-side-item--cta' : ''}`}
      onMouseEnter={() => item.path && prefetchPage(item.path)}
      onFocus={() => item.path && prefetchPage(item.path)}
      onClick={() => item.onClick?.() || onNavigate?.(item.path)}
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
      {item.badge != null && <span className="mh-side-badge">{item.badge}</span>}
    </button>
  )
}
