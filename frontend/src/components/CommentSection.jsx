import { useState, useEffect } from 'react'
import api from '../services/api'

export default function CommentSection({ souvenirId, utilisateur }) {
  const [commentaires, setCommentaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState({})

  useEffect(() => {
    chargerCommentaires()
  }, [souvenirId])

  const chargerCommentaires = async () => {
    try {
      setLoading(true)
      const rep = await api.get(`/commentaires/${souvenirId}`)
      setCommentaires(rep.data.data || [])
    } catch (err) {
      console.error('Erreur chargement commentaires:', err)
    } finally {
      setLoading(false)
    }
  }

  const envoyerCommentaire = async (parentId = null) => {
    const contenu = parentId ? replyText[parentId] : newComment
    if (!contenu?.trim()) return

    try {
      if (parentId) {
        await api.post(`/commentaires/${parentId}/repondre`, { contenu })
        setReplyText({ ...replyText, [parentId]: '' })
        setReplyTo(null)
      } else {
        await api.post(`/commentaires/${souvenirId}`, { contenu })
        setNewComment('')
      }
      await chargerCommentaires()
    } catch (err) {
      console.error('Erreur envoi commentaire:', err)
    }
  }

  const supprimerCommentaire = async (id) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return
    try {
      await api.delete(`/commentaires/${id}`)
      await chargerCommentaires()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const CommentItem = ({ comment, niveau = 0 }) => {
    const maxNiveau = 5
    const showReply = replyTo === comment.id
    const avatarColor = comment.auteur?.prenom === 'Afi' ? '#C5B8E0' : '#C8E0C8'

    return (
      <div style={{ marginLeft: niveau * 20 }}>
        <div style={styles.comment}>
          <div style={{ ...styles.avatar, background: avatarColor, color: '#3D3268' }}>
            {comment.auteur?.prenom?.[0] || '?'}{comment.auteur?.nom?.[0] || ''}
          </div>
          <div style={styles.commentContent}>
            <div style={styles.author}>
              {comment.auteur?.prenom || 'Ancien'} {comment.auteur?.nom || 'membre'}
            </div>
            <div style={styles.text}>{comment.contenu}</div>
            <div style={styles.actions}>
              <button style={styles.replyBtn} onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                Répondre
              </button>
              {comment.auteur?.id === utilisateur.id && (
                <button style={styles.deleteBtn} onClick={() => supprimerCommentaire(comment.id)}>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {showReply && (
          <div style={styles.replyForm}>
            <input
              type="text"
              placeholder={`Répondre à ${comment.auteur?.prenom || 'ce commentaire'}...`}
              value={replyText[comment.id] || ''}
              onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
              style={styles.replyInput}
            />
            <button onClick={() => envoyerCommentaire(comment.id)} style={styles.replySendBtn}>
              Envoyer
            </button>
          </div>
        )}

        {comment.reponses?.length > 0 && niveau < maxNiveau && (
          <div style={styles.reponses}>
            {comment.reponses.map(rep => (
              <CommentItem key={rep.id} comment={rep} niveau={niveau + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const styles = {
    section: {
      marginTop: '12px',
      background: '#F3F0FA',
      borderRadius: '12px',
      padding: '12px'
    },
    comment: {
      display: 'flex',
      gap: '10px',
      marginBottom: '12px'
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      flexShrink: 0
    },
    commentContent: {
      flex: 1
    },
    author: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#2A2640',
      marginBottom: '2px'
    },
    text: {
      fontSize: '13px',
      color: '#4A4568',
      marginBottom: '4px'
    },
    actions: {
      display: 'flex',
      gap: '12px'
    },
    replyBtn: {
      background: 'none',
      border: 'none',
      color: '#5B4D9E',
      fontSize: '11px',
      cursor: 'pointer',
      padding: 0
    },
    deleteBtn: {
      background: 'none',
      border: 'none',
      color: '#C06060',
      fontSize: '11px',
      cursor: 'pointer',
      padding: 0
    },
    replyForm: {
      display: 'flex',
      gap: '8px',
      marginLeft: '42px',
      marginBottom: '12px'
    },
    replyInput: {
      flex: 1,
      padding: '6px 12px',
      borderRadius: '20px',
      border: '1px solid #C5B8E0',
      fontSize: '12px',
      outline: 'none'
    },
    replySendBtn: {
      background: '#5B4D9E',
      color: '#FFF',
      border: 'none',
      borderRadius: '20px',
      padding: '6px 14px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    reponses: {
      marginLeft: '10px'
    },
    newCommentForm: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
      marginBottom: '12px'
    },
    newInput: {
      flex: 1,
      padding: '8px 14px',
      borderRadius: '20px',
      border: '1px solid #C5B8E0',
      fontSize: '13px',
      outline: 'none'
    },
    sendBtn: {
      background: '#5B4D9E',
      color: '#FFF',
      border: 'none',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    loading: {
      textAlign: 'center',
      padding: '12px',
      fontSize: '12px',
      color: '#7A7394'
    }
  }

  if (loading) {
    return <div style={styles.loading}>Chargement des commentaires...</div>
  }

  return (
    <div style={styles.section}>
      {commentaires.length === 0 && (
        <div style={{ fontSize: '12px', color: '#7A7394', textAlign: 'center', padding: '8px' }}>
          Aucun commentaire — soyez le premier à commenter !
        </div>
      )}

      {commentaires.map(comment => (
        <CommentItem key={comment.id} comment={comment} niveau={0} />
      ))}

      <div style={styles.newCommentForm}>
        <input
          type="text"
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={styles.newInput}
        />
        <button onClick={() => envoyerCommentaire()} style={styles.sendBtn}>
          ➤
        </button>
      </div>
    </div>
  )
}