import { useState, useEffect } from 'react'
import api from '../services/api'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    chargerNotifications()
    const interval = setInterval(chargerNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const chargerNotifications = async () => {
    try {
      const rep = await api.get('/notifications')
      setNotifications(rep.data.data)
      setUnreadCount(rep.data.data.filter(n => !n.lu).length)
    } catch (err) {
      console.error('Erreur chargement notifications:', err)
    }
  }

  const marquerLu = async (id) => {
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
    switch(type) {
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
        onClick={() => setShowDropdown(!showDropdown)} 
        style={styles.bellButton}
      >
        🔔
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={toutMarquerLu} style={styles.markAllBtn}>
                Tout marquer lu
              </button>
            )}
          </div>
          <div style={styles.dropdownList}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>Aucune notification</div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  style={{...styles.notifItem, ...(!notif.lu ? styles.notifUnread : {})}}
                  onClick={() => marquerLu(notif.id)}
                >
                  <span style={styles.notifIcon}>{getIcon(notif.type)}</span>
                  <div style={styles.notifContent}>
                    <div style={styles.notifMessage}>{notif.message}</div>
                    <div style={styles.notifTime}>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { position: 'relative' },
  bellButton: { 
    background: 'none', 
    border: 'none', 
    fontSize: '20px', 
    cursor: 'pointer', 
    position: 'relative',
    color: '#FDF6EE'
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-10px',
    background: '#C06060',
    color: '#FFF',
    fontSize: '10px',
    borderRadius: '10px',
    padding: '2px 6px',
    minWidth: '16px'
  },
  dropdown: {
    position: 'absolute',
    top: '40px',
    right: '0',
    width: '320px',
    background: '#FFF',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    overflow: 'hidden'
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#9B6240',
    color: '#FFF',
    fontWeight: '500'
  },
  markAllBtn: {
    background: 'none',
    border: 'none',
    color: '#FFF',
    fontSize: '11px',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  dropdownList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  empty: {
    padding: '20px',
    textAlign: 'center',
    color: '#B08060'
  },
  notifItem: {
    display: 'flex',
    gap: '12px',
    padding: '10px 14px',
    borderBottom: '1px solid #E8C9A0',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  notifUnread: {
    background: '#FFF5EB'
  },
  notifIcon: {
    fontSize: '20px'
  },
  notifContent: {
    flex: 1
  },
  notifMessage: {
    fontSize: '13px',
    color: '#3D2410',
    marginBottom: '4px'
  },
  notifTime: {
    fontSize: '10px',
    color: '#B08060'
  }
}