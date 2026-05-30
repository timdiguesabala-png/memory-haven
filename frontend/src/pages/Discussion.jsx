import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import AppLayout from '../components/AppLayout'
import UserAvatar from '../components/UserAvatar'
import { initSocket, disconnectSocket, getSocket } from '../services/socket'
import { peutEcrire } from '../lib/roles'

export default function Discussion() {
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()
  const lectureSeule = !peutEcrire(utilisateur.role)

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [socketLive, setSocketLive] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    chargerHistorique()
    const token = localStorage.getItem('token')
    if (!token) return undefined

    const socket = initSocket(token)

    socket.on('connect', () => setSocketLive(true))
    socket.on('disconnect', () => setSocketLive(false))

    socket.on('new_message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      scrollToBottom()
    })

    socket.on('message_deleted', ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id))
    })

    socket.on('user_typing', (data) => {
      if (data.userId !== utilisateur.id && data.isTyping) {
        setTypingUser(data.prenom || 'Quelqu\'un')
      } else {
        setTypingUser(null)
      }
    })

    const fallback = setInterval(() => {
      if (!getSocket()?.connected) chargerHistorique()
    }, 20000)

    return () => {
      clearInterval(fallback)
      disconnectSocket()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, message: null })
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const chargerHistorique = async () => {
    try {
      const rep = await api.get('/discussion')
      setMessages(rep.data.data || [])
      scrollToBottom()
    } catch (err) {
      console.error('Erreur chargement:', err)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setLoading(true)
    try {
      await api.post('/discussion/messages', { contenu: newMessage })
      setNewMessage('')
      if (!getSocket()?.connected) await chargerHistorique()
    } catch (err) {
      console.error('Erreur envoi:', err)
      alert('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const repondreMessage = (message) => {
    setReplyTo(message)
    setShowReplyInput(true)
    setSelectedMessage(message.id)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    setContextMenu({ visible: false, x: 0, y: 0, message: null })
  }

  const envoyerReponse = async () => {
    if (!replyText.trim() || !replyTo) return
    setLoading(true)
    try {
      await api.post('/discussion/repondre', {
        message_id: replyTo.id,
        contenu: replyText
      })
      setReplyText('')
      setShowReplyInput(false)
      setReplyTo(null)
      setSelectedMessage(null)
      await chargerHistorique()
    } catch (err) {
      console.error('Erreur réponse:', err)
      alert('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const supprimerMessage = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return
    try {
      await api.delete(`/discussion/messages/${id}`)
      await chargerHistorique()
      setContextMenu({ visible: false, x: 0, y: 0, message: null })
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Impossible de supprimer ce message')
    }
  }

  const annulerReponse = () => {
    setShowReplyInput(false)
    setReplyTo(null)
    setSelectedMessage(null)
    setReplyText('')
  }

  const handleContextMenu = (e, message) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message: message
    })
    setSelectedMessage(message.id)
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return "Hier"
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const getInitiales = (prenom, nom) => {
    if (!prenom && !nom) return '?'
    return (prenom?.[0] || '') + (nom?.[0] || '')
  }

  const getAvatarColor = (prenom) => {
    const colors = ['#C5B8E0', '#C8E0C8', '#C8D8E8', '#E8C8D8', '#D8C8E0', '#7B6BB8']
    const index = (prenom?.length || 0) % colors.length
    return colors[index]
  }

  const groupMessagesByDate = () => {
    const groups = {}
    messages.forEach(msg => {
      const dateKey = new Date(msg.created_at).toDateString()
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(msg)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate()

  const styles = {
    page: { 
      minHeight: '100vh', 
      background: darkMode ? '#1E1C2C' : '#F8F6FC', 
      fontFamily: 'sans-serif' 
    },
    nav: { 
      background: darkMode ? '#1A1828' : '#2A2640', 
      padding: '0 1rem', 
      height: '56px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    },
    navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    navLogo: { 
      color: darkMode ? '#e0e0e0' : '#F5F0FA', 
      fontSize: '18px', 
      fontFamily: 'Georgia,serif', 
      fontWeight: '500' 
    },
    btnRetour: { 
      background: 'transparent', 
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, 
      color: darkMode ? '#e0e0e0' : '#F5F0FA', 
      padding: '6px 12px', 
      borderRadius: '20px', 
      cursor: 'pointer', 
      fontSize: '12px' 
    },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    onlineDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#7A9E5A' },
    navAvatar: { 
      width: '34px', 
      height: '34px', 
      borderRadius: '50%', 
      background: '#7B6BB8', 
      color: '#2A2640', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '12px', 
      fontWeight: '600' 
    },
    chatContainer: { 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      maxWidth: '800px', 
      margin: '0 auto', 
      width: '100%', 
      height: 'calc(100vh - 56px)' 
    },
    messagesArea: { 
      flex: 1, 
      overflowY: 'auto', 
      padding: '1rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px' 
    },
    emptyState: { 
      textAlign: 'center', 
      padding: '3rem', 
      color: darkMode ? '#a0a0a0' : '#7A7394' 
    },
    emptyEmoji: { fontSize: '48px', marginBottom: '1rem' },
    emptyTitle: { fontSize: '18px', fontWeight: '500', marginBottom: '8px' },
    emptyText: { fontSize: '14px' },
    dateSeparator: { textAlign: 'center', margin: '16px 0 12px' },
    dateText: { 
      background: '#C5B8E0', 
      color: '#2A2640', 
      fontSize: '11px', 
      padding: '4px 12px', 
      borderRadius: '20px', 
      display: 'inline-block' 
    },
    messageWrapper: { 
      display: 'flex', 
      flexDirection: 'column', 
      maxWidth: '70%', 
      marginBottom: '8px',
      transition: 'background 0.2s',
      borderRadius: '12px',
      padding: '4px'
    },
    myMessage: { alignSelf: 'flex-end' },
    otherMessage: { alignSelf: 'flex-start' },
    messageSelected: { 
      background: darkMode ? 'rgba(233,69,96,0.15)' : 'rgba(200,149,108,0.1)',
      borderRadius: '12px'
    },
    messageRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
    avatarContainer: { flexShrink: 0 },
    avatar: { 
      width: '32px', 
      height: '32px', 
      borderRadius: '50%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '12px', 
      fontWeight: '600' 
    },
    messageContent: { flex: 1 },
    messageAuthor: { 
      fontSize: '11px', 
      color: darkMode ? '#a0a0a0' : '#7A7394', 
      marginBottom: '2px', 
      marginLeft: '8px', 
      fontWeight: '500' 
    },
    messageBubble: { 
      position: 'relative',
      padding: '8px 12px',
      borderRadius: '18px',
      fontSize: '13px',
      wordWrap: 'break-word',
      maxWidth: '100%'
    },
    myBubble: { 
      background: '#5B4D9E', 
      color: '#FFF',
      borderBottomRightRadius: '4px'
    },
    otherBubble: { 
      background: darkMode ? '#1A1828' : '#F8F6FC', 
      border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, 
      color: darkMode ? '#e0e0e0' : '#2A2640',
      borderBottomLeftRadius: '4px'
    },
    messageTime: { 
      fontSize: '10px', 
      color: darkMode ? '#a0a0a0' : '#7A7394', 
      marginTop: '2px', 
      marginLeft: '8px' 
    },
    contextMenu: {
      position: 'fixed',
      background: darkMode ? '#1E1C2C' : '#F8F6FC',
      border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`,
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      minWidth: '160px'
    },
    contextMenuItem: {
      padding: '10px 16px',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'background 0.2s',
      color: darkMode ? '#e0e0e0' : '#2A2640',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    replyContainer: {
      borderTop: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`,
      padding: '0.75rem',
      background: darkMode ? '#1A1828' : '#F8F6FC'
    },
    replyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
      fontSize: '12px',
      color: darkMode ? '#a0a0a0' : '#4A4568'
    },
    cancelReplyBtn: {
      background: 'none',
      border: 'none',
      color: '#C06060',
      cursor: 'pointer',
      fontSize: '16px'
    },
    replyQuote: {
      background: darkMode ? '#352A20' : '#F5E6D3',
      padding: '6px 10px',
      borderRadius: '10px',
      fontSize: '11px',
      color: darkMode ? '#a0a0a0' : '#4A4568',
      marginBottom: '8px',
      fontStyle: 'italic',
      borderLeft: `3px solid #5B4D9E`
    },
    inputForm: { 
      display: 'flex', 
      gap: '10px', 
      padding: '0.75rem', 
      background: darkMode ? '#1A1828' : '#F8F6FC', 
      borderTop: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}` 
    },
    input: { 
      flex: 1, 
      padding: '10px 14px', 
      borderRadius: '24px', 
      border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, 
      fontSize: '13px', 
      outline: 'none', 
      background: darkMode ? '#1E1C2C' : '#F8F6FC', 
      color: darkMode ? '#e0e0e0' : '#2A2640' 
    },
    sendButton: { 
      background: '#5B4D9E', 
      color: '#FFF', 
      border: 'none', 
      padding: '10px 20px', 
      borderRadius: '24px', 
      cursor: 'pointer', 
      fontSize: '13px', 
      fontWeight: '500' 
    }
  }

  return (
    <AppLayout activePath="/discussion">
      <div style={{ ...styles.chatContainer, minHeight: 'calc(100vh - 140px)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--warm2)', background: '#F8F6FC' }}>
          <h2 className="mh-title" style={{ fontSize: '1.25rem', margin: 0 }}>💬 Discussion familiale</h2>
          <p className="mh-subtitle" style={{ margin: 0 }}>Échangez en direct avec votre famille</p>
        </div>
        <div style={styles.messagesArea}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyEmoji}>💬</div>
              <div style={styles.emptyTitle}>Aucun message</div>
              <div style={styles.emptyText}>Soyez le premier à envoyer un message !</div>
            </div>
          ) : (
            Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                <div style={styles.dateSeparator}>
                  <span style={styles.dateText}>{formatDate(dateMessages[0].created_at)}</span>
                </div>
                {dateMessages.map((msg) => {
                  const isMyMessage = msg.auteur_id === utilisateur.id
                  const avatarColor = getAvatarColor(msg.auteur?.prenom)
                  const nomExpediteur = msg.auteur?.prenom && msg.auteur?.nom 
                    ? `${msg.auteur.prenom} ${msg.auteur.nom[0]}.`
                    : msg.auteur?.prenom || 'Ancien membre'
                  
                  return (
                    <div
                      key={msg.id}
                      style={{
                        ...styles.messageWrapper,
                        ...(isMyMessage ? styles.myMessage : styles.otherMessage),
                        ...(selectedMessage === msg.id ? styles.messageSelected : {})
                      }}
                      onClick={() => setSelectedMessage(selectedMessage === msg.id ? null : msg.id)}
                      onContextMenu={(e) => handleContextMenu(e, msg)}
                    >
                      <div style={styles.messageRow}>
                        {!isMyMessage && (
                          <div style={styles.avatarContainer}>
                            <UserAvatar
                              nom={msg.auteur?.nom}
                              prenom={msg.auteur?.prenom}
                              avatarUrl={msg.auteur?.avatar_url}
                              size={36}
                              style={styles.avatar}
                            />
                          </div>
                        )}
                        <div style={styles.messageContent}>
                          {!isMyMessage && (
                            <div style={styles.messageAuthor}>
                              {nomExpediteur}
                            </div>
                          )}
                          <div style={{ ...styles.messageBubble, ...(isMyMessage ? styles.myBubble : styles.otherBubble) }}>
                            {msg.reply_to && (
                              <div style={styles.replyQuote}>
                                ⤷ {msg.reply_to.contenu?.substring(0, 50)}...
                              </div>
                            )}
                            {msg.contenu}
                          </div>
                          <div style={styles.messageTime}>
                            {formatTime(msg.created_at)}
                            {isMyMessage && <span style={{ marginLeft: '4px' }}>✓✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de réponse à un message */}
        {showReplyInput && replyTo && (
          <div style={styles.replyContainer}>
            <div style={styles.replyHeader}>
              <span>Répondre à <strong>{replyTo.auteur?.prenom || 'Ancien membre'}</strong></span>
              <button onClick={annulerReponse} style={styles.cancelReplyBtn}>✕</button>
            </div>
            <div style={styles.replyQuote}>
              "{replyTo.contenu.substring(0, 60)}..."
            </div>
            <div style={styles.inputForm}>
              <input
                ref={inputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Répondre à ${replyTo.auteur?.prenom || 'ce message'}...`}
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && envoyerReponse()}
              />
              <button onClick={envoyerReponse} style={styles.sendButton} disabled={loading}>
                {loading ? '⏳' : 'Envoyer'}
              </button>
            </div>
          </div>
        )}

        {/* Zone de nouveau message */}
        {typingUser && (
          <p style={{ fontSize: '12px', color: '#7A7394', padding: '0 1rem 0.25rem' }}>
            {typingUser} écrit…
          </p>
        )}

        {!showReplyInput && !lectureSeule && (
          <form onSubmit={handleSendMessage} style={styles.inputForm}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                const s = getSocket()
                if (s?.connected) {
                  s.emit('typing', { prenom: utilisateur.prenom, isTyping: e.target.value.length > 0 })
                }
              }}
              placeholder="Écris un message…"
              style={styles.input}
              disabled={loading}
            />
            <button type="submit" style={styles.sendButton} disabled={loading}>
              {loading ? '⏳' : 'Envoyer'}
            </button>
          </form>
        )}

        {lectureSeule && (
          <p style={{ textAlign: 'center', padding: '0.75rem', fontSize: '13px', color: '#7A7394' }}>
            Compte lecture seule — vous pouvez lire la discussion.
          </p>
        )}

        <p style={{ textAlign: 'center', fontSize: '11px', color: socketLive ? '#7A9E5A' : '#9a8a7a', margin: '0.25rem 0' }}>
          {socketLive ? '● En direct' : '○ Mode actualisation'}
        </p>
      </div>

      {/* Menu contextuel (clic droit) */}
      {contextMenu.visible && contextMenu.message && (
        <div style={{ ...styles.contextMenu, top: contextMenu.y, left: contextMenu.x }}>
          <div style={styles.contextMenuItem} onClick={() => repondreMessage(contextMenu.message)}>
            💬 Répondre
          </div>
          {contextMenu.message.auteur_id === utilisateur.id && (
            <div 
              style={{ ...styles.contextMenuItem, color: '#C06060' }} 
              onClick={() => supprimerMessage(contextMenu.message.id)}
            >
              🗑️ Supprimer
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}