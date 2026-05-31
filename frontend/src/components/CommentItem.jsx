import { memo, useState } from 'react'
import UserAvatar from './UserAvatar'
import CommentReplyForm from './CommentReplyForm'
import { peutModifierContenuAuteur } from '../lib/contentOwnership'

function CommentItem({
  comment,
  niveau = 0,
  replyToId,
  lectureSeule,
  utilisateur,
  onToggleReply,
  onSubmitReply,
  onDelete,
  onUpdate
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.contenu)
  const [saving, setSaving] = useState(false)
  const showReply = replyToId === comment.id
  const canManage = peutModifierContenuAuteur(comment)

  const enregistrer = async () => {
    if (!draft.trim()) return
    setSaving(true)
    try {
      await onUpdate(comment.id, draft.trim())
      setEditing(false)
    } catch {
      /* alert handled in parent */
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mh-comment-thread" style={{ marginLeft: Math.min(niveau, 12) * 16 }}>
      <div className="mh-comment-row">
        <UserAvatar
          nom={comment.auteur?.nom}
          prenom={comment.auteur?.prenom}
          avatarUrl={comment.auteur?.avatar_url}
          size={32}
        />
        <div className="mh-comment-body">
          <div className="mh-comment-author">
            {comment.auteur?.prenom || 'Ancien'} {comment.auteur?.nom || 'membre'}
          </div>
          {editing ? (
            <div className="mh-comment-edit">
              <textarea
                className="mh-input"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="mh-temoignage-actions">
                <button type="button" className="mh-btn mh-btn-primary" disabled={saving} onClick={enregistrer}>
                  {saving ? '…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  className="mh-btn mh-btn-secondary"
                  onClick={() => {
                    setDraft(comment.contenu)
                    setEditing(false)
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="mh-comment-text">{comment.contenu}</div>
          )}
          {!lectureSeule && !editing && (
            <div className="mh-comment-actions">
              <button type="button" className="mh-comment-action-btn" onClick={() => onToggleReply(comment.id)}>
                Répondre
              </button>
              {canManage && (
                <>
                  <button type="button" className="mh-comment-action-btn" onClick={() => setEditing(true)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="mh-comment-action-btn mh-comment-action-btn--danger"
                    onClick={() => onDelete(comment.id)}
                  >
                    Supprimer
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showReply && (
        <CommentReplyForm
          key={`reply-form-${comment.id}`}
          placeholder={`Répondre à ${comment.auteur?.prenom || 'ce commentaire'}...`}
          onSubmit={(text) => onSubmitReply(comment.id, text)}
          onCancel={() => onToggleReply(comment.id)}
        />
      )}

      {comment.reponses?.length > 0 && (
        <div className="mh-comment-children">
          {comment.reponses.map((rep) => (
            <CommentItem
              key={rep.id}
              comment={rep}
              niveau={niveau + 1}
              replyToId={replyToId}
              lectureSeule={lectureSeule}
              utilisateur={utilisateur}
              onToggleReply={onToggleReply}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(CommentItem)
