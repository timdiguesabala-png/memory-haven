import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export default function NotificationBell() {
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
      default: return '🔔'
    }
  }

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={toggleDropdown}
        style={styles.bellButton}
        title="Notifications"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {showDropdown && (
        <>
          <button
            type="button"
            style={styles.backdrop}
            aria-label="Fermer"
            onClick={() => setShowDropdown(false)}
          />
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <span>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
              {unreadCount > 0 && (
                <button type="button" onClick={toutMarquerLu} style={styles.markAllBtn}>
                  Tout lu
                </button>
              )}
            </div>
            <div style={styles.dropdownList}>
              {loading && <div style={styles.empty}>Chargement…</div>}
              {erreur && <div style={styles.error}>{erreur}</div>}
              {!loading && !erreur && notifications.length === 0 && (
                <div style={styles.empty}>
                  Aucune notification pour l’instant.
                  <div style={{ fontSize: '11px', marginTop: '8px' }}>
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
                    style={{ ...styles.notifItem, ...(!notif.lu ? styles.notifUnread : {}) }}
                    onClick={(e) => marquerLu(notif.id, e)}
                  >
                    <span style={styles.notifIcon}>{getIcon(notif.type)}</span>
                    <div style={styles.notifContent}>
                      <div style={styles.notifMessage}>{notif.message}</div>
                      <div style={styles.notifTime}>
                        {new Date(notif.created_at).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notif.lu && <span style={styles.dot} />}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  container: { position: 'relative', zIndex: 1100 },
  bellButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    position: 'relative',
    color: '#FDF6EE',
    padding: '4px 8px'
  },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '0',
    background: '#C06060',
    color: '#FFF',
    fontSize: '10px',
    borderRadius: '10px',
    padding: '2px 6px',
    minWidth: '16px',
    fontWeight: '600'
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1099,
    background: 'transparent',
    border: 'none',
    cursor: 'default'
  },
  dropdown: {
    position: 'absolute',
    top: '40px',
    right: '0',
    width: 'min(320px, 90vw)',
    background: '#FFF',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    zIndex: 1100,
    overflow: 'hidden'
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#9B6240',
    color: '#FFF',
    fontWeight: '500',
    fontSize: '14px'
  },
  markAllBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#FFF',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  dropdownList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  empty: {
    padding: '20px',
    textAlign: 'center',
    color: '#7A5035',
    fontSize: '13px'
  },
  error: {
    padding: '12px',
    margin: '8px',
    background: '#FCEBEB',
    color: '#A32D2D',
    borderRadius: '8px',
    fontSize: '12px'
  },
  notifItem: {
    display: 'flex',
    gap: '12px',
    padding: '10px 14px',
    borderBottom: '1px solid #E8C9A0',
    cursor: 'pointer',
    alignItems: 'flex-start'
  },
  notifUnread: {
    background: '#FFF5EB'
  },
  notifIcon: {
    fontSize: '20px',
    flexShrink: 0
  },
  notifContent: {
    flex: 1,
    minWidth: 0
  },
  notifMessage: {
    fontSize: '13px',
    color: '#3D2410',
    marginBottom: '4px',
    lineHeight: 1.4
  },
  notifTime: {
    fontSize: '10px',
    color: '#B08060'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#C06060',
    flexShrink: 0,
    marginTop: '6px'
  }
}
