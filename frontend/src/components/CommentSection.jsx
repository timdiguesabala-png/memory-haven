import { useState, useEffect, useCallback } from 'react'
import {
  fetchCommentaires,
  postCommentaire,
  replyCommentaire,
  updateCommentaire,
  deleteCommentaire
} from '../services/feedApi'
import CommentItem from './CommentItem'
import { peutEcrire } from '../lib/roles'

export default function CommentSection({ souvenirId, utilisateur, onUpdate }) {
  const lectureSeule = !peutEcrire(utilisateur?.role)
  const [commentaires, setCommentaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyToId, setReplyToId] = useState(null)

  const chargerCommentaires = useCallback(async () => {
    try {
      setLoading(true)
      const rep = await fetchCommentaires(souvenirId)
      const data = rep.data || []
      setCommentaires(data)
      onUpdate?.(data)
    } catch (err) {
      console.error('Erreur chargement commentaires:', err)
    } finally {
      setLoading(false)
    }
  }, [souvenirId, onUpdate])

  useEffect(() => {
    chargerCommentaires()
  }, [chargerCommentaires])

  const envoyerCommentaire = useCallback(
    async (contenu, parentId = null) => {
      if (!contenu?.trim()) return

      try {
        if (parentId) {
          await replyCommentaire(parentId, contenu.trim())
          setReplyToId(null)
        } else {
          await postCommentaire(souvenirId, contenu.trim())
          setNewComment('')
        }
        await chargerCommentaires()
      } catch (err) {
        console.error('Erreur envoi commentaire:', err)
        alert(err.response?.data?.message || err.userMessage || 'Impossible d’envoyer le commentaire')
      }
    },
    [souvenirId, chargerCommentaires]
  )

  const supprimerCommentaire = useCallback(
    async (id) => {
      if (!window.confirm('Supprimer ce commentaire ?')) return
      try {
        await deleteCommentaire(id)
        await chargerCommentaires()
      } catch (err) {
        alert(err.response?.data?.message || err.userMessage || 'Impossible de supprimer')
      }
    },
    [chargerCommentaires]
  )

  const modifierCommentaire = useCallback(
    async (id, contenu) => {
      try {
        await updateCommentaire(id, contenu)
        await chargerCommentaires()
      } catch (err) {
        alert(err.response?.data?.message || err.userMessage || 'Impossible de modifier')
        throw err
      }
    },
    [chargerCommentaires]
  )

  const handleToggleReply = useCallback((id) => {
    setReplyToId((current) => (current === id ? null : id))
  }, [])

  const handleSubmitReply = useCallback(
    (parentId, text) => {
      envoyerCommentaire(text, parentId)
    },
    [envoyerCommentaire]
  )

  const handleDelete = useCallback(
    (id) => {
      supprimerCommentaire(id)
    },
    [supprimerCommentaire]
  )

  if (loading) {
    return <div className="mh-comment-section-loading">Chargement des commentaires...</div>
  }

  return (
    <div className="mh-comment-section">
      {commentaires.length === 0 && (
        <p className="mh-comment-section-empty">Aucun commentaire — soyez le premier à commenter !</p>
      )}

      {commentaires.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          niveau={0}
          replyToId={replyToId}
          lectureSeule={lectureSeule}
          utilisateur={utilisateur}
          onToggleReply={handleToggleReply}
          onSubmitReply={handleSubmitReply}
          onDelete={handleDelete}
          onUpdate={modifierCommentaire}
        />
      ))}

      {!lectureSeule ? (
        <div className="mh-comment-new-form">
          <p className="mh-compte-hint" style={{ margin: '0 0 0.35rem' }}>
            Astuce : tapez @prenom pour notifier un membre de la famille.
          </p>
          <input
            type="text"
            className="mh-comment-new-input"
            placeholder="Ajouter un commentaire… (@prenom pour mentionner)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                envoyerCommentaire(newComment)
              }
            }}
          />
          <button type="button" className="mh-comment-new-send" onClick={() => envoyerCommentaire(newComment)}>
            ➤
          </button>
        </div>
      ) : (
        <p className="mh-comment-section-readonly">Compte lecture seule — commentaires désactivés.</p>
      )}
    </div>
  )
}
