import { useState, useEffect } from 'react'
import api from '../services/api'
import { parseSouvenirMedia } from '../lib/mediaUrl'
import { downloadMedia } from '../lib/downloadMedia'

export default function SouvenirCard({ souvenir, utilisateur, onSupprimer }) {
  const [commentaires, setCommentaires] = useState([])
  const [reactions, setReactions] = useState(souvenir.reactions || [])
  const [showCommentaires, setShowCommentaires] = useState(false)
  const [nouveauComment, setNouveauComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [loadingReply, setLoadingReply] = useState(false)

  useEffect(() => {
    if (showCommentaires) {
      chargerCommentaires()
    }
  }, [showCommentaires, souvenir.id])

  const chargerCommentaires = async () => {
    try {
      const rep = await api.get(`/commentaires/${souvenir.id}`)
      setCommentaires(rep.data.data || [])
    } catch (err) {
      console.error('Erreur chargement commentaires:', err)
    }
  }

  const compterReactions = (type) => reactions.filter(r => r.type === type).length
  const maReaction = reactions.find(r => r.utilisateur_id === utilisateur.id)

  const reagir = async (type) => {
    try {
      let reactionEmoji = ''
      switch(type) {
        case 'COEUR': reactionEmoji = '❤️'; break
        case 'LIKE': reactionEmoji = '👍'; break
        case 'LARME': reactionEmoji = '😢'; break
        case 'RIRE': reactionEmoji = '😄'; break
        default: reactionEmoji = ''
      }
      
      if (maReaction && maReaction.type === type) {
        await api.delete('/reactions/' + souvenir.id)
        const nouvellesReactions = reactions.filter(r => r.utilisateur_id !== utilisateur.id)
        setReactions(nouvellesReactions)
      } else {
        await api.post('/reactions/' + souvenir.id, { type })
        const nouvellesReactions = reactions.filter(r => r.utilisateur_id !== utilisateur.id)
        setReactions([...nouvellesReactions, { type, utilisateur_id: utilisateur.id }])
      }
      // Recharger les souvenirs pour mettre à jour l'affichage
      window.location.reload()
    } catch (err) {
      console.error('Erreur reaction:', err)
    }
  }

  const envoyerCommentaire = async (e) => {
    e.preventDefault()
    if (!nouveauComment.trim()) return
    setLoadingComment(true)
    try {
      await api.post(`/commentaires/${souvenir.id}`, { contenu: nouveauComment })
      setNouveauComment('')
      await chargerCommentaires()
    } catch (err) {
      console.error('Erreur commentaire:', err)
    } finally {
      setLoadingComment(false)
    }
  }

  const supprimerCommentaire = async (id) => {
    try {
      await api.delete('/commentaires/' + id)
      await chargerCommentaires()
    } catch (err) {
      console.error('Erreur suppression commentaire:', err)
    }
  }

  const envoyerReponse = async (commentaireId) => {
    if (!replyText.trim()) return
    setLoadingReply(true)
    try {
      await api.post(`/commentaires/${commentaireId}/repondre`, { contenu: replyText })
      setReplyText('')
      setShowReplyForm(null)
      await chargerCommentaires()
    } catch (err) {
      console.error('Erreur réponse:', err)
    } finally {
      setLoadingReply(false)
    }
  }

  const getTypeStyle = (type) => {
    const styles = {
      PHOTO: { bg: '#FFF0E0', color: '#8B5E30', border: '#E8C080', label: '📷 Photo' },
      AUDIO: { bg: '#E8F0FF', color: '#4060A0', border: '#A0B8E0', label: '🎙️ Audio' },
      VIDEO: { bg: '#F8E8F0', color: '#803060', border: '#D090B0', label: '🎬 Vidéo' },
      TEXTE: { bg: '#F0F8E8', color: '#4A7030', border: '#A0C870', label: '📝 Texte' }
    }
    return styles[type] || styles.PHOTO
  }

  const typeStyle = getTypeStyle(souvenir.type)
  const avatarBg = souvenir.auteur?.prenom === 'Afi' ? '#C5B8E0' : '#C8E0C8'

  const styles = {
    card: { background: '#F8F6FC', border: '1px solid #C5B8E0', borderRadius: '16px', padding: '1rem', marginBottom: '12px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    meta: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', color: '#3D3268' },
    auteurNom: { fontSize: '13px', fontWeight: '600', color: '#2A2640' },
    date: { fontSize: '10px', color: '#7A7394', marginTop: '2px' },
    typeBadge: { fontSize: '10px', padding: '3px 10px', borderRadius: '12px', fontWeight: '500', background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` },
    titre: { fontSize: '15px', fontWeight: '500', color: '#2A2640', marginBottom: '6px' },
    desc: { fontSize: '12px', color: '#4A4568', lineHeight: '1.5', marginBottom: '6px' },
    lieu: { fontSize: '11px', color: '#7A7394', marginBottom: '6px' },
    image: { width: '100%', borderRadius: '10px', marginBottom: '8px', maxHeight: '380px', minHeight: '200px', objectFit: 'cover' },
    audio: { width: '100%', marginBottom: '8px' },
    video: { width: '100%', borderRadius: '10px', marginBottom: '8px', maxHeight: '360px', minHeight: '220px' },
    tags: { display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' },
    tag: { background: '#EDE8F5', color: '#4A4568', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', border: '1px solid #C5B8E0' },
    actions: { display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px', borderTop: '1px solid #F0DCC8', flexWrap: 'wrap' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#7A7394', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', borderRadius: '16px' },
    actionBtnActive: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#C06060', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', borderRadius: '16px' },
    commentsSection: { marginTop: '10px', background: '#F3F0FA', borderRadius: '10px', padding: '10px' },
    comment: { display: 'flex', gap: '8px', marginBottom: '8px' },
    commentAvatar: { width: '24px', height: '24px', borderRadius: '50%', background: '#C5B8E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 },
    commentBody: { flex: 1, background: '#FFF', borderRadius: '8px', padding: '6px 8px' },
    commentAuteur: { fontSize: '10px', fontWeight: '600', color: '#2A2640', marginBottom: '2px' },
    commentContenu: { fontSize: '11px', color: '#4A4568' },
    replyBtn: { background: 'none', border: 'none', color: '#5B4D9E', fontSize: '10px', cursor: 'pointer', marginTop: '4px', padding: 0 },
    commentForm: { display: 'flex', gap: '6px', marginTop: '8px' },
    commentInput: { flex: 1, padding: '6px 10px', borderRadius: '16px', border: '1px solid #C5B8E0', fontSize: '11px', background: '#FFF', outline: 'none' },
    commentSendBtn: { background: '#5B4D9E', color: '#FFF', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 },
    replyForm: { display: 'flex', gap: '6px', marginTop: '8px', marginLeft: '24px' },
    replyInput: { flex: 1, padding: '6px 10px', borderRadius: '16px', border: '1px solid #C5B8E0', fontSize: '11px', outline: 'none' },
    btnEnvoyerReponse: { background: '#5B4D9E', color: '#FFF', border: 'none', borderRadius: '16px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px' }
  }

  const { urls: mediaUrls, cleanDescription } = parseSouvenirMedia(souvenir)

  return (
    <div className="mh-fb-post" style={styles.card}>
      <div style={styles.header}>
        <div style={styles.meta}>
          <div style={styles.avatar}>{souvenir.auteur?.prenom?.[0] || '?'}{souvenir.auteur?.nom?.[0] || ''}</div>
          <div>
            <div style={styles.auteurNom}>{souvenir.auteur?.prenom || '?'} {souvenir.auteur?.nom || ''}</div>
            <div style={styles.date}>{new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        <span style={styles.typeBadge}>{typeStyle.label}</span>
      </div>

      <div style={styles.titre}>{souvenir.titre}</div>
      {cleanDescription && <div style={styles.desc}>{cleanDescription}</div>}
      {souvenir.lieu && <div style={styles.lieu}>📍 {souvenir.lieu}</div>}

      {mediaUrls[0] && souvenir.type === 'PHOTO' && (
        <img src={mediaUrls[0]} alt={souvenir.titre} style={styles.image} />
      )}
      {mediaUrls[0] && souvenir.type === 'AUDIO' && (
        <audio controls style={styles.audio}>
          <source src={mediaUrls[0]} />
        </audio>
      )}
      {mediaUrls[0] && souvenir.type === 'VIDEO' && (
        <video controls style={styles.video}>
          <source src={mediaUrls[0]} />
        </video>
      )}

      {souvenir.tags?.length > 0 && (
        <div style={styles.tags}>
          {souvenir.tags.map(t => <span key={t.tag_id} style={styles.tag}>#{t.tag?.libelle || t}</span>)}
        </div>
      )}

      <div style={styles.actions}>
        <button onClick={() => reagir('COEUR')} style={maReaction?.type === 'COEUR' ? styles.actionBtnActive : styles.actionBtn}>
          ❤️ {compterReactions('COEUR') > 0 && compterReactions('COEUR')}
        </button>
        <button onClick={() => reagir('LIKE')} style={maReaction?.type === 'LIKE' ? styles.actionBtnActive : styles.actionBtn}>
          👍 {compterReactions('LIKE') > 0 && compterReactions('LIKE')}
        </button>
        <button onClick={() => reagir('LARME')} style={maReaction?.type === 'LARME' ? styles.actionBtnActive : styles.actionBtn}>
          😢 {compterReactions('LARME') > 0 && compterReactions('LARME')}
        </button>
        <button onClick={() => reagir('RIRE')} style={maReaction?.type === 'RIRE' ? styles.actionBtnActive : styles.actionBtn}>
          😄 {compterReactions('RIRE') > 0 && compterReactions('RIRE')}
        </button>

        <button type="button" onClick={() => setShowCommentaires(!showCommentaires)} style={styles.actionBtn}>
          💬 {commentaires.length}
        </button>

        {mediaUrls[0] && (
          <button type="button" onClick={() => downloadMedia(mediaUrls[0], souvenir.titre)} style={styles.actionBtn}>
            ⬇️ Télécharger
          </button>
        )}

        {souvenir.auteur_id === utilisateur.id && (
          <button type="button" onClick={() => onSupprimer(souvenir.id)} style={{ ...styles.actionBtn, marginLeft: 'auto', color: '#C06060' }}>🗑️ Supprimer</button>
        )}
      </div>

      {showCommentaires && (
        <div style={styles.commentsSection}>
          {commentaires.length === 0 && <div style={{ fontSize: '11px', color: '#7A7394', textAlign: 'center', padding: '6px' }}>Aucun commentaire</div>}
          {commentaires.map(com => (
            <div key={com.id}>
              <div style={styles.comment}>
                <div style={styles.commentAvatar}>{com.auteur?.prenom?.[0] || '?'}{com.auteur?.nom?.[0] || ''}</div>
                <div style={styles.commentBody}>
                  <div style={styles.commentAuteur}>{com.auteur?.prenom || '?'} {com.auteur?.nom || ''}</div>
                  <div style={styles.commentContenu}>{com.contenu}</div>
                  <button onClick={() => setShowReplyForm(showReplyForm === com.id ? null : com.id)} style={styles.replyBtn}>Répondre</button>
                </div>
              </div>
              {showReplyForm === com.id && (
                <div style={styles.replyForm}>
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Répondre..." style={styles.replyInput} />
                  <button onClick={() => envoyerReponse(com.id)} style={styles.btnEnvoyerReponse} disabled={loadingReply}>{loadingReply ? '...' : 'Envoyer'}</button>
                </div>
              )}
            </div>
          ))}
          <form onSubmit={envoyerCommentaire} style={styles.commentForm}>
            <input value={nouveauComment} onChange={e => setNouveauComment(e.target.value)} placeholder="Ajouter un commentaire..." style={styles.commentInput} />
            <button type="submit" style={styles.commentSendBtn} disabled={loadingComment}>{loadingComment ? '...' : 'Envoyer'}</button>
          </form>
        </div>
      )}
    </div>
  )
}