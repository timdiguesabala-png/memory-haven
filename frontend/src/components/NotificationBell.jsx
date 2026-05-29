import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export default function NotificationBell({ variant = 'nav' }) {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [erreur, setErreur] = useState(null)
  const [loading, setLoading] = useState(false)

  const chargerNotifications = useCallback(async () => {
    try {
      setErreur(null)
      const rep = await api.get('/notifications')
      const list = rep.data?.data || []
      setNotifications(list)
      setUnreadCount(list.filter((n) => !n.lu).length)
    } catch (err) {
      console.error('Erreur chargement notifications:', err)
      setErreur(err.userMessage || 'Impossible de charger les notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    chargerNotifications()
    const interval = setInterval(chargerNotifications, 15000)
    return () => clearInterval(interval)
  }, [chargerNotifications])

  useEffect(() => {
    if (showDropdown) chargerNotifications()
  }, [showDropdown, chargerNotifications])

  useEffect(() => {
    if (!showDropdown) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setShowDropdown(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [showDropdown])

  const toggleDropdown = () => {
    setShowDropdown((open) => !open)
  }

  const marquerLu = async (id, e) => {
    e?.stopPropagation()
    try {
      await api.put(`/notifications/${id}/lire`)
      chargerNotifications()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const toutMarquerLu = async () => {
    try {
      await api.put('/notifications/lire-tout')
      chargerNotifications()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'COMMENTAIRE': return '💬'
      case 'REACTION': return '❤️'
      case 'SOUVENIR': return '📸'
      case 'INVITATION': return '📧'
      case 'DISCUSSION': return '💭'
      default: return '🔔'
    }
  }

  return (
    <div className="mh-notif-root">
      <button
        type="button"
        onClick={toggleDropdown}
        className={`mh-notif-bell ${variant === 'sidebar' ? 'mh-notif-bell--sidebar' : ''}`}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={showDropdown}
      >
        🔔
        {unreadCount > 0 && (
          <span className="mh-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="mh-overlay-root mh-notif-overlay-root">
          <button
            type="button"
            className="mh-overlay-backdrop"
            aria-label="Fermer les notifications"
            onClick={() => setShowDropdown(false)}
          />
          <div className="mh-notif-panel" role="dialog" aria-label="Notifications">
            <div className="mh-notif-panel-header">
              <span>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
              {unreadCount > 0 && (
                <button type="button" onClick={toutMarquerLu} className="mh-notif-mark-all">
                  Tout lu
                </button>
              )}
            </div>
            <div className="mh-notif-panel-list">
              {loading && <div className="mh-notif-empty">Chargement…</div>}
              {erreur && <div className="mh-notif-error">{erreur}</div>}
              {!loading && !erreur && notifications.length === 0 && (
                <div className="mh-notif-empty">
                  Aucune notification pour l’instant.
                  <div className="mh-notif-empty-hint">
                    Un autre membre doit commenter ou réagir à vos souvenirs.
                  </div>
                </div>
              )}
              {!erreur &&
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    className={`mh-notif-item ${!notif.lu ? 'mh-notif-item--unread' : ''}`}
                    onClick={(e) => marquerLu(notif.id, e)}
                    onKeyDown={(e) => e.key === 'Enter' && marquerLu(notif.id, e)}
                  >
                    <span aria-hidden="true">{getIcon(notif.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mh-notif-item-msg">{notif.message}</div>
                      <div className="mh-notif-item-time">
                        {new Date(notif.created_at).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notif.lu && <span className="mh-notif-dot" aria-hidden="true" />}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
