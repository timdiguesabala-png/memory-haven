import { useState, useEffect } from 'react'
import api from '../services/api'
import { parseSouvenirMedia } from '../lib/mediaUrl'
import { downloadMedia } from '../lib/downloadMedia'
import SouvenirDocuments from './SouvenirDocuments'
import CommentSection from './CommentSection'
import SouvenirEditModal from './SouvenirEditModal'
import { peutModifierContenuAuteur } from '../lib/contentOwnership'
import { peutEcrire } from '../lib/roles'

function countCommentairesThread(list) {
  if (!Array.isArray(list)) return 0
  return list.reduce(
    (n, c) => n + 1 + countCommentairesThread(c.reponses),
    0
  )
}

export default function SouvenirCard({ souvenir, utilisateur, onSupprimer, onUpdated }) {
  const [commentaires, setCommentaires] = useState([])
  const [reactions, setReactions] = useState(souvenir.reactions || [])
  const [showCommentaires, setShowCommentaires] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [card, setCard] = useState(souvenir)

  useEffect(() => {
    setCard(souvenir)
  }, [souvenir])

  useEffect(() => {
    let cancelled = false
    api
      .get(`/commentaires/${card.id}`)
      .then((rep) => {
        if (!cancelled) setCommentaires(rep.data.data || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [card.id])

  const totalCommentaires =
    countCommentairesThread(commentaires) ||
    souvenir.commentaires?.length ||
    0

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
        await api.delete('/reactions/' + card.id)
        const nouvellesReactions = reactions.filter(r => r.utilisateur_id !== utilisateur.id)
        setReactions(nouvellesReactions)
      } else {
        await api.post('/reactions/' + card.id, { type })
        const nouvellesReactions = reactions.filter(r => r.utilisateur_id !== utilisateur.id)
        setReactions([...nouvellesReactions, { type, utilisateur_id: utilisateur.id }])
      }
    } catch (err) {
      console.error('Erreur reaction:', err)
    }
  }

  const getTypeStyle = (type) => {
    const styles = {
      PHOTO: { bg: '#FFF0E0', color: '#8B5E30', border: '#E8C080', label: '📷 Photo' },
      AUDIO: { bg: '#E8F0FF', color: '#4060A0', border: '#A0B8E0', label: '🎙️ Audio' },
      VIDEO: { bg: '#F8E8F0', color: '#803060', border: '#D090B0', label: '🎬 Vidéo' },
      DOCUMENT: { bg: '#E8F4F8', color: '#306080', border: '#90C0D0', label: '📎 Document' },
      TEXTE: { bg: '#F0F8E8', color: '#4A7030', border: '#A0C870', label: '📝 Texte' }
    }
    return styles[type] || styles.PHOTO
  }

  const typeStyle = getTypeStyle(card.type)
  const avatarBg = card.auteur?.prenom === 'Afi' ? '#C5B8E0' : '#C8E0C8'

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
    image: { width: '100%', borderRadius: '10px', marginBottom: '8px', maxHeight: '250px', objectFit: 'cover' },
    audio: { width: '100%', marginBottom: '8px' },
    video: { width: '100%', borderRadius: '10px', marginBottom: '8px', maxHeight: '200px' },
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

  const { urls: mediaUrls, mediaItems, cleanDescription } = parseSouvenirMedia(card)
  const canEdit = peutModifierContenuAuteur(card) && peutEcrire(utilisateur?.role)
  const canDelete =
    peutEcrire(utilisateur?.role) && onSupprimer && peutModifierContenuAuteur(card)

  return (
    <div className="mh-fb-post" style={styles.card}>
      <div style={styles.header}>
        <div style={styles.meta}>
          <div style={styles.avatar}>{card.auteur?.prenom?.[0] || '?'}{card.auteur?.nom?.[0] || ''}</div>
          <div>
            <div style={styles.auteurNom}>{card.auteur?.prenom || '?'} {card.auteur?.nom || ''}</div>
            <div style={styles.date}>{new Date(card.date_souvenir).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        <span style={styles.typeBadge}>{typeStyle.label}</span>
      </div>

      <div style={styles.titre}>{card.titre}</div>
      {cleanDescription && <div style={styles.desc}>{cleanDescription}</div>}
      {card.lieu && <div style={styles.lieu}>📍 {card.lieu}</div>}

      {mediaUrls[0] && card.type === 'PHOTO' && (
        <img src={mediaUrls[0]} alt={card.titre} style={styles.image} />
      )}
      {mediaUrls[0] && card.type === 'AUDIO' && (
        <audio controls style={styles.audio}><source src={mediaUrls[0]} /></audio>
      )}
      {mediaUrls[0] && card.type === 'VIDEO' && (
        <video controls style={styles.video}><source src={mediaUrls[0]} /></video>
      )}
      {card.type === 'DOCUMENT' && mediaItems.length > 0 && (
        <SouvenirDocuments items={mediaItems} titre={card.titre} />
      )}

      {card.tags?.length > 0 && (
        <div style={styles.tags}>
          {card.tags.map(t => <span key={t.tag_id} style={styles.tag}>#{t.tag?.libelle || t}</span>)}
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
          💬 {totalCommentaires}
        </button>

        {mediaUrls[0] && (
          <button type="button" onClick={() => downloadMedia(mediaUrls[0], card.titre)} style={styles.actionBtn}>
            ⬇️ Télécharger
          </button>
        )}

        {canEdit && (
          <button type="button" onClick={() => setEditOpen(true)} style={styles.actionBtn} title="Modifier">
            ✏️ Modifier
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => onSupprimer(card.id)}
            style={{ ...styles.actionBtn, marginLeft: 'auto', color: '#C06060' }}
          >
            🗑️ Supprimer
          </button>
        )}
      </div>

      {showCommentaires && (
        <CommentSection
          souvenirId={card.id}
          utilisateur={utilisateur}
          onUpdate={(data) => setCommentaires(data)}
        />
      )}

      {editOpen && (
        <SouvenirEditModal
          souvenir={card}
          utilisateur={utilisateur}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            onUpdated?.()
            api.get(`/souvenirs/${card.id}`).then((rep) => setCard(rep.data.data)).catch(() => {})
          }}
        />
      )}
    </div>
  )
}