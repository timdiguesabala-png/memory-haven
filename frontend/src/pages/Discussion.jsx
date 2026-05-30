import { useState, useEffect, useRef, useMemo } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import UserAvatar from '../components/UserAvatar'
import { getSocket } from '../services/socket'
import { peutEcrire } from '../lib/roles'
import '../styles/discussion-whatsapp.css'

function sameUser(a, b) {
  return Number(a) === Number(b)
}

function isReplyContent(contenu) {
  return typeof contenu === 'string' && contenu.startsWith('↩ ')
}

export default function Discussion() {
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const myId = Number(utilisateur.id)
  const lectureSeule = !peutEcrire(utilisateur.role)

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [socketLive, setSocketLive] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const appendMessage = (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
    scrollToBottom()
  }

  useEffect(() => {
    chargerHistorique()

    const attach = () => {
      const socket = getSocket()
      if (!socket) return undefined

      const onConnect = () => setSocketLive(true)
      const onDisconnect = () => setSocketLive(false)
      const onNew = (msg) => appendMessage(msg)
      const onDeleted = ({ id }) => setMessages((prev) => prev.filter((m) => m.id !== id))
      const onTyping = (data) => {
        if (!sameUser(data.userId, myId) && data.isTyping) {
          setTypingUser(data.prenom || 'Quelqu\'un')
        } else {
          setTypingUser(null)
        }
      }

      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)
      socket.on('new_message', onNew)
      socket.on('message_deleted', onDeleted)
      socket.on('user_typing', onTyping)
      setSocketLive(socket.connected)

      return () => {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
        socket.off('new_message', onNew)
        socket.off('message_deleted', onDeleted)
        socket.off('user_typing', onTyping)
      }
    }

    let cleanup = attach()
    const retry = setInterval(() => {
      if (!getSocket()?.connected) {
        cleanup?.()
        cleanup = attach()
        chargerHistorique()
      }
    }, 20000)

    return () => {
      clearInterval(retry)
      cleanup?.()
    }
  }, [myId])

  useEffect(() => {
    const close = () => setContextMenu({ visible: false, x: 0, y: 0, message: null })
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
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
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const text = newMessage.trim()
    setNewMessage('')
    setLoading(true)
    try {
      const rep = await api.post('/discussion/messages', { contenu: text })
      if (rep.data?.data) appendMessage(rep.data.data)
      else if (!getSocket()?.connected) await chargerHistorique()
    } catch (err) {
      setNewMessage(text)
      alert('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const envoyerReponse = async () => {
    if (!replyText.trim() || !replyTo) return
    setLoading(true)
    try {
      const rep = await api.post('/discussion/repondre', {
        message_id: replyTo.id,
        contenu: replyText.trim()
      })
      if (rep.data?.data) appendMessage(rep.data.data)
      setReplyText('')
      setShowReplyInput(false)
      setReplyTo(null)
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const supprimerMessage = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return
    try {
      await api.delete(`/discussion/messages/${id}`)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      setContextMenu({ visible: false, x: 0, y: 0, message: null })
    } catch {
      alert('Impossible de supprimer ce message')
    }
  }

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages]
  )

  const messageGroups = useMemo(() => {
    const groups = []
    let current = null
    sortedMessages.forEach((msg) => {
      const dateKey = new Date(msg.created_at).toDateString()
      if (!current || current.dateKey !== dateKey) {
        current = { dateKey, label: formatDate(msg.created_at), items: [] }
        groups.push(current)
      }
      current.items.push(msg)
    })
    return groups
  }, [sortedMessages])

  const renderBubble = (msg, isMine) => {
    const contenu = msg.contenu || ''
    const replyPrefix = isReplyContent(contenu)
    return (
      <div className={`wa-bubble ${isMine ? 'wa-bubble--mine' : 'wa-bubble--other'}`}>
        {replyPrefix && (
          <div className="wa-reply-quote">{contenu.split('\n')[0]}</div>
        )}
        <span className="wa-bubble-text">
          {replyPrefix ? contenu.split('\n').slice(1).join('\n').trim() || contenu : contenu}
        </span>
        <span className="wa-bubble-meta">
          {formatTime(msg.created_at)}
          {isMine && <span aria-hidden="true"> ✓✓</span>}
        </span>
      </div>
    )
  }

  return (
    <AppLayout activePath="/discussion">
      <div
        className="wa-chat"
        style={{
          minHeight: 'calc(100vh - 140px)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #d1d7db', background: '#f0f2f5' }}>
          <h2 className="mh-title" style={{ fontSize: '1.25rem', margin: 0 }}>💬 Discussion familiale</h2>
          <p className="mh-subtitle" style={{ margin: 0 }}>Comme un groupe WhatsApp — vos messages à droite</p>
        </div>

        <div className="wa-chat-messages">
          {sortedMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#667781' }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>💬</div>
              <div style={{ fontWeight: 500 }}>Aucun message</div>
              <div style={{ fontSize: '14px' }}>Soyez le premier à écrire !</div>
            </div>
          ) : (
            messageGroups.map((group) => (
              <div key={group.dateKey}>
                <div className="wa-date-pill">{group.label}</div>
                {group.items.map((msg, idx) => {
                  const isMine = sameUser(msg.auteur_id, myId)
                  const prev = idx > 0 ? group.items[idx - 1] : null
                  const showAvatar = !isMine && (!prev || !sameUser(prev.auteur_id, msg.auteur_id))
                  const showName = showAvatar
                  const nomExpediteur =
                    msg.auteur?.prenom && msg.auteur?.nom
                      ? `${msg.auteur.prenom} ${msg.auteur.nom[0]}.`
                      : msg.auteur?.prenom || 'Membre'

                  return (
                    <div
                      key={msg.id}
                      className={`wa-row ${isMine ? 'wa-row--mine' : 'wa-row--other'}`}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: msg })
                      }}
                    >
                      <div className="wa-bubble-wrap">
                        {!isMine && (
                          <div className={`wa-avatar-slot ${showAvatar ? '' : 'wa-avatar-slot--spacer'}`}>
                            {showAvatar && (
                              <UserAvatar
                                nom={msg.auteur?.nom}
                                prenom={msg.auteur?.prenom}
                                avatarUrl={msg.auteur?.avatar_url}
                                size={28}
                              />
                            )}
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {showName && <div className="wa-author">{nomExpediteur}</div>}
                          {renderBubble(msg, isMine)}
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

        {showReplyInput && replyTo && (
          <div className="wa-input-bar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#667781' }}>
              <span>Répondre à {replyTo.auteur?.prenom || 'ce message'}</span>
              <button type="button" onClick={() => { setShowReplyInput(false); setReplyTo(null); setReplyText('') }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="wa-input"
                onKeyDown={(e) => e.key === 'Enter' && envoyerReponse()}
              />
              <button type="button" className="wa-send-btn" onClick={envoyerReponse} disabled={loading}>➤</button>
            </div>
          </div>
        )}

        {typingUser && (
          <p style={{ fontSize: '12px', color: '#667781', padding: '0 1rem', margin: 0 }}>{typingUser} écrit…</p>
        )}

        {!showReplyInput && !lectureSeule && (
          <form onSubmit={handleSendMessage} className="wa-input-bar">
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
              placeholder="Message"
              className="wa-input"
              disabled={loading}
            />
            <button type="submit" className="wa-send-btn" disabled={loading || !newMessage.trim()} aria-label="Envoyer">
              ➤
            </button>
          </form>
        )}

        {lectureSeule && (
          <p style={{ textAlign: 'center', padding: '0.75rem', fontSize: '13px', color: '#667781' }}>
            Compte lecture seule
          </p>
        )}

        <p className={`wa-live-badge ${socketLive ? 'wa-live-badge--on' : 'wa-live-badge--off'}`}>
          {socketLive ? '● En direct' : '○ Actualisation périodique'}
        </p>
      </div>

      {contextMenu.visible && contextMenu.message && (
        <div
          role="menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '140px'
          }}
        >
          <button
            type="button"
            style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => {
              setReplyTo(contextMenu.message)
              setShowReplyInput(true)
              setContextMenu({ visible: false, x: 0, y: 0, message: null })
              setTimeout(() => inputRef.current?.focus(), 80)
            }}
          >
            ↩ Répondre
          </button>
          {sameUser(contextMenu.message.auteur_id, myId) && (
            <button
              type="button"
              style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#c06060' }}
              onClick={() => supprimerMessage(contextMenu.message.id)}
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </AppLayout>
  )
}
