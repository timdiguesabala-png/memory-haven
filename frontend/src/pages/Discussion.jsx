import { useState, useEffect, useRef, useMemo } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import UserAvatar from '../components/UserAvatar'
import { getSocket } from '../services/socket'
import { peutEcrire } from '../lib/roles'
import { uploadFilesToCloudinary } from '../services/cloudinaryClient'
import { compressImageIfNeeded } from '../lib/compressImage'
import '../styles/discussion-whatsapp.css'

const REACTION_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏']

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
  const [reactionPicker, setReactionPicker] = useState(null)
  const [pendingImage, setPendingImage] = useState(null)
  const [pendingPreview, setPendingPreview] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const imageInputRef = useRef(null)

  const appendMessage = (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
    scrollToBottom()
  }

  const updateMessage = (msg) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
  }

  useEffect(() => {
    chargerHistorique()

    const attach = () => {
      const socket = getSocket()
      if (!socket) return undefined

      const onConnect = () => setSocketLive(true)
      const onDisconnect = () => setSocketLive(false)
      const onNew = (msg) => appendMessage(msg)
      const onUpdated = (msg) => updateMessage(msg)
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
      socket.on('message_updated', onUpdated)
      socket.on('message_deleted', onDeleted)
      socket.on('user_typing', onTyping)
      setSocketLive(socket.connected)

      return () => {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
        socket.off('new_message', onNew)
        socket.off('message_updated', onUpdated)
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
    const close = () => {
      setContextMenu({ visible: false, x: 0, y: 0, message: null })
      setReactionPicker(null)
    }
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

  const clearPendingImage = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingImage(null)
    setPendingPreview(null)
  }

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingImage(file)
    setPendingPreview(URL.createObjectURL(file))
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text && !pendingImage) return

    setNewMessage('')
    setLoading(true)
    try {
      let image_url = null
      if (pendingImage) {
        const prepared = await compressImageIfNeeded(pendingImage)
        const [url] = await uploadFilesToCloudinary([prepared], 'PHOTO', 'memory_haven/discussion')
        image_url = url
        clearPendingImage()
      }

      const rep = await api.post('/discussion/messages', {
        contenu: text,
        ...(image_url ? { image_url } : {})
      })
      if (rep.data?.data) appendMessage(rep.data.data)
      else if (!getSocket()?.connected) await chargerHistorique()
    } catch (err) {
      setNewMessage(text)
      alert('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const toggleReaction = async (messageId, emoji) => {
    try {
      const rep = await api.post(`/discussion/messages/${messageId}/reaction`, { emoji })
      if (rep.data?.data) updateMessage(rep.data.data)
      setReactionPicker(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Réaction impossible')
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

  const renderReactions = (msg) => {
    const reactions = msg.reactions || []
    if (!reactions.length) return null
    return (
      <div className="wa-reactions-bar">
        {reactions.map((r) => {
          const mine = r.user_ids?.some((id) => sameUser(id, myId))
          return (
            <button
              key={r.emoji}
              type="button"
              className={`wa-reaction-chip ${mine ? 'wa-reaction-chip--mine' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleReaction(msg.id, r.emoji)
              }}
            >
              {r.emoji} {r.count}
            </button>
          )
        })}
      </div>
    )
  }

  const renderBubble = (msg, isMine) => {
    const contenu = msg.contenu || ''
    const replyPrefix = contenu && isReplyContent(contenu)
    const hasText = replyPrefix
      ? contenu.split('\n').slice(1).join('\n').trim()
      : contenu.trim()

    return (
      <div
        className={`wa-bubble ${isMine ? 'wa-bubble--mine' : 'wa-bubble--other'}`}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (!lectureSeule) {
            setReactionPicker({ messageId: msg.id, x: e.clientX, y: e.clientY })
          }
        }}
      >
        {replyPrefix && <div className="wa-reply-quote">{contenu.split('\n')[0]}</div>}
        {msg.image_url && (
          <img
            src={msg.image_url}
            alt=""
            className="wa-bubble-image"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxUrl(msg.image_url)
            }}
          />
        )}
        {hasText && (
          <span className="wa-bubble-text">
            {replyPrefix ? contenu.split('\n').slice(1).join('\n').trim() : contenu}
          </span>
        )}
        <span className="wa-bubble-meta">
          {formatTime(msg.created_at)}
          {isMine && <span aria-hidden="true"> ✓✓</span>}
        </span>
      </div>
    )
  }

  const canSend = newMessage.trim() || pendingImage

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
          <p className="mh-subtitle" style={{ margin: 0 }}>
            Style WhatsApp — photos, réactions 👍❤️, vos messages à droite
          </p>
        </div>

        <div className="wa-chat-messages">
          {sortedMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#667781' }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>💬</div>
              <div style={{ fontWeight: 500 }}>Aucun message</div>
              <div style={{ fontSize: '14px' }}>Texte ou photo — double-clic pour réagir</div>
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
                          {renderReactions(msg)}
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

        {pendingPreview && (
          <div className="wa-image-preview">
            <img src={pendingPreview} alt="Aperçu" />
            <span style={{ fontSize: '13px', color: '#667781' }}>Photo prête à envoyer</span>
            <button type="button" onClick={clearPendingImage} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

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
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImagePick}
            />
            <button
              type="button"
              className="wa-attach-btn"
              aria-label="Joindre une photo"
              onClick={() => imageInputRef.current?.click()}
            >
              📷
            </button>
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
            <button type="submit" className="wa-send-btn" disabled={loading || !canSend} aria-label="Envoyer">
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

      {reactionPicker && (
        <div
          className="wa-reaction-picker"
          style={{ left: reactionPicker.x, top: reactionPicker.y - 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {REACTION_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => toggleReaction(reactionPicker.messageId, emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

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
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => {
              setReactionPicker({ messageId: contextMenu.message.id, x: contextMenu.x, y: contextMenu.y })
              setContextMenu({ visible: false, x: 0, y: 0, message: null })
            }}
          >
            😀 Réagir
          </button>
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

      {lightboxUrl && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px' }} />
        </div>
      )}
    </AppLayout>
  )
}
