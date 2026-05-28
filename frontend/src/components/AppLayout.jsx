import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import { useTheme } from '../context/ThemeContext'
import { useAppTheme } from '../styles/useAppTheme'
import ProfilePhotoPicker from './ProfilePhotoPicker'
import { getStoredUser } from '../lib/userStorage'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Fil', icon: '📄' },
  { path: '/albums', label: 'Albums', icon: '📸' },
  { path: '/arbre', label: 'Arbre', icon: '🌳' },
  { path: '/membres', label: 'Membres', icon: '👪' },
  { path: '/discussion', label: 'Discussion', icon: '💬' },
  { path: '/ajouter', label: 'Ajouter', icon: '➕', highlight: true }
]

export default function AppLayout({ children, sidebar, activePath }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { darkMode, setDarkMode } = useTheme()
  const t = useAppTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())
  const current = activePath || location.pathname

  useEffect(() => {
    const sync = (e) => setUtilisateur(e.detail || getStoredUser())
    window.addEventListener('mh-user-updated', sync)
    return () => window.removeEventListener('mh-user-updated', sync)
  }, [])

  const deconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('utilisateur')
    navigate('/login')
  }

  const go = (path) => {
    navigate(path)
    setMenuOpen(false)
    setSidebarOpen(false)
  }

  return (
    <div className="mh-page" style={{ background: t.bg, minHeight: '100vh' }}>
      <nav className="mh-nav" style={{ background: t.navBg }}>
        <button
          type="button"
          className="mh-nav-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          ☰
        </button>
        <button type="button" className="mh-nav-brand" onClick={() => go('/dashboard')}>
          <span className="mh-nav-brand-icon">🏡</span>
          <span>
            Memory Haven
            {utilisateur.famille && (
              <em style={{ color: t.navMuted, fontWeight: 400, fontSize: '0.85em' }}>
                {' '}
                · {utilisateur.famille}
              </em>
            )}
          </span>
        </button>

        <div className={`mh-nav-links ${menuOpen ? 'mh-nav-links--open' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`mh-nav-link ${current === item.path ? 'mh-nav-link--active' : ''} ${item.highlight ? 'mh-nav-link--cta' : ''}`}
              onClick={() => go(item.path)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div className="mh-nav-actions">
          <NotificationBell />
          <button
            type="button"
            className="mh-icon-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <ProfilePhotoPicker
            compact
            size={34}
            nom={utilisateur.nom}
            prenom={utilisateur.prenom}
            avatarUrl={utilisateur.avatar_url}
            onUpdated={setUtilisateur}
          />
          <span className="mh-nav-user">{utilisateur.prenom}</span>
          <button type="button" className="mh-nav-logout" onClick={deconnecter}>
            Sortir
          </button>
          <button
            type="button"
            className="mh-nav-burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Navigation"
          >
            ⋮
          </button>
        </div>
      </nav>

      <div className="mh-app-shell">
        <aside
          className={`mh-sidebar ${sidebarOpen ? 'mh-sidebar--open' : ''}`}
          style={{ background: t.sidebarBg, borderColor: t.sidebarBorder }}
        >
          <div className="mh-sidebar-inner fade-in">{sidebar}</div>
        </aside>
        {sidebarOpen && (
          <button
            type="button"
            className="mh-sidebar-backdrop"
            aria-label="Fermer"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="mh-main fade-in-up">{children}</main>
      </div>
    </div>
  )
}

export function SideNav({ items, active, onNavigate }) {
  const t = useAppTheme()
  return (
    <>
      <div className="mh-side-label">Navigation</div>
      {items.map((item) => (
        <button
          key={item.key || item.label}
          type="button"
          className={`mh-side-item ${active === item.key ? 'mh-side-item--active' : ''}`}
          style={active === item.key ? { background: t.sideActive } : undefined}
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
