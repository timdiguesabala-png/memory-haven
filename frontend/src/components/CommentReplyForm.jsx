import { useState } from 'react'

/** Formulaire de réponse isolé — la saisie ne re-rend pas tout le fil */
export default function CommentReplyForm({ placeholder, onSubmit, onCancel }) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onSubmit(text)
    setDraft('')
  }

  return (
    <div className="mh-comment-reply-form">
      <input
        type="text"
        className="mh-comment-reply-input"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
          if (e.key === 'Escape') onCancel?.()
        }}
        autoFocus
      />
      <button type="button" className="mh-comment-reply-send" onClick={submit}>
        Envoyer
      </button>
    </div>
  )
}
