import { memo } from 'react'
import UserAvatar from './UserAvatar'
import CommentReplyForm from './CommentReplyForm'

function CommentItem({
  comment,
  niveau = 0,
  replyToId,
  lectureSeule,
  utilisateurId,
  onToggleReply,
  onSubmitReply,
  onDelete
}) {
  const showReply = replyToId === comment.id

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
          <div className="mh-comment-text">{comment.contenu}</div>
          {!lectureSeule && (
            <div className="mh-comment-actions">
              <button type="button" className="mh-comment-action-btn" onClick={() => onToggleReply(comment.id)}>
                Répondre
              </button>
              {comment.auteur?.id === utilisateurId && (
                <button type="button" className="mh-comment-action-btn mh-comment-action-btn--danger" onClick={() => onDelete(comment.id)}>
                  Supprimer
                </button>
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
              utilisateurId={utilisateurId}
              onToggleReply={onToggleReply}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(CommentItem)
