import { useState, useEffect } from 'react'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import UserAvatar from './UserAvatar'
import CommentSection from './CommentSection'
import SouvenirDocuments from './SouvenirDocuments'
import { parseSouvenirMedia } from '../lib/mediaUrl'
import { downloadMedia } from '../lib/downloadMedia'
import { estAdmin, peutEcrire } from '../lib/roles'
import { peutModifierContenuAuteur } from '../lib/contentOwnership'
import { getTypeLabel, getTypeClass, getPostClass } from '../lib/souvenirFeedUtils'

export default function SouvenirFeedPost({
  souvenir,
  utilisateur,
  reactions: reactionsProp,
  onReactionsChange,
  favori = false,
  onToggleFavori,
  onSupprimer,
  onEdit,
  onToggleEpingle,
  className = ''
}) {
  const { darkMode } = useTheme()
  const [commentairesOuverts, setCommentairesOuverts] = useState(false)
  const [reactionsLocal, setReactionsLocal] = useState(souvenir.reactions || [])
  const [imageViewer, setImageViewer] = useState({
    open: false,
    currentImage: null,
    currentIndex: 0,
    images: []
  })

  const reactions = reactionsProp ?? reactionsLocal
  const setReactions = onReactionsChange ?? setReactionsLocal

  useEffect(() => {
    if (reactionsProp == null) setReactionsLocal(souvenir.reactions || [])
  }, [souvenir.id, souvenir.reactions, reactionsProp])

  const openImageViewer = (imageUrl) => {
    const allImages = parseSouvenirMedia(souvenir).urls
    const currentIndex = allImages.findIndex((url) => url === imageUrl)
    setImageViewer({
      open: true,
      currentImage: imageUrl,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      images: allImages
    })
  }

  const closeImageViewer = () => {
    setImageViewer({ open: false, currentImage: null, currentIndex: 0, images: [] })
  }

  const prevImage = () => {
    if (imageViewer.currentIndex > 0) {
      const newIndex = imageViewer.currentIndex - 1
      setImageViewer({
        ...imageViewer,
        currentImage: imageViewer.images[newIndex],
        currentIndex: newIndex
      })
    }
  }

  const nextImage = () => {
    if (imageViewer.currentIndex < imageViewer.images.length - 1) {
      const newIndex = imageViewer.currentIndex + 1
      setImageViewer({
        ...imageViewer,
        currentImage: imageViewer.images[newIndex],
        currentIndex: newIndex
      })
    }
  }

  useEffect(() => {
    if (!imageViewer.open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeImageViewer()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageViewer.open, imageViewer.currentIndex, imageViewer.images.length])

  const compterReactions = (type) => {
    const count = reactions.filter((r) => r.type === type).length
    return count > 0 ? count : ''
  }

  const getMaReaction = () =>
    reactions.find((r) => r.utilisateur_id === utilisateur?.id)?.type

  const reagir = async (type) => {
    if (!peutEcrire(utilisateur?.role)) return
    const avant = [...reactions]
    const list = [...reactions]
    const idx = list.findIndex((r) => r.utilisateur_id === utilisateur.id)
    if (idx >= 0 && list[idx].type === type) {
      list.splice(idx, 1)
    } else if (idx >= 0) {
      list[idx] = { ...list[idx], type }
    } else {
      list.push({ utilisateur_id: utilisateur.id, type })
    }
    setReactions(list)
    try {
      await api.post(`/reactions/${souvenir.id}`, { type })
    } catch (err) {
      setReactions(avant)
      alert(err.userMessage || 'Erreur réaction')
    }
  }

  const galleryBg = darkMode ? '#7B6BB8' : '#C5B8E0'
  const galleryItemBg = darkMode ? '#1A1828' : '#B8A8CC'

  const styles = {
    galleryContainer: { marginBottom: '8px', borderRadius: '10px', overflow: 'hidden', maxWidth: '100%' },
    galleryGrid: {
      display: 'grid',
      gap: '3px',
      backgroundColor: galleryBg,
      borderRadius: '10px',
      overflow: 'hidden'
    },
    galleryItem: {
      position: 'relative',
      cursor: 'pointer',
      height: '100px',
      maxHeight: '100px',
      overflow: 'hidden',
      backgroundColor: galleryItemBg
    },
    galleryImage: { width: '100%', height: '100%', objectFit: 'cover' },
    galleryOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFF',
      fontSize: '20px',
      fontWeight: 'bold'
    },
    singleImage: {
      width: '100%',
      borderRadius: '10px',
      maxHeight: '220px',
      objectFit: 'cover',
      cursor: 'pointer',
      display: 'block'
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      paddingTop: '8px',
      borderTop: '1px solid #F0DCC8',
      flexWrap: 'wrap'
    },
    actionBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      color: '#7A7394',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 6px',
      borderRadius: '16px'
    },
    actionBtnActive: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      color: '#C06060',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 6px',
      borderRadius: '16px'
    },
    tagsContainer: { display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' },
    imageModal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      cursor: 'pointer'
    },
    imageModalContent: { maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', cursor: 'default' },
    navButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255,255,255,0.15)',
      border: 'none',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      fontSize: '30px',
      cursor: 'pointer',
      color: '#FFF'
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      fontSize: '1.25rem',
      cursor: 'pointer',
      color: '#FFF',
      zIndex: 1
    },
    saveButton: {
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      borderRadius: '24px',
      padding: '10px 20px',
      color: '#FFF',
      cursor: 'pointer'
    },
    imageCounter: {
      position: 'absolute',
      bottom: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#FFF',
      fontSize: '0.9rem'
    }
  }

  const maReaction = getMaReaction()
  const { cleanDescription, urls, mediaItems } = parseSouvenirMedia(souvenir)

  return (
    <>
      <article
        className={`memory-card mh-card mh-fb-post mh-mirror-surface ${getPostClass(souvenir.type)} ${className}`.trim()}
      >
        <header className="mh-post-head">
          <UserAvatar
            nom={souvenir.auteur?.nom}
            prenom={souvenir.auteur?.prenom}
            avatarUrl={souvenir.auteur?.avatar_url}
            size={40}
          />
          <div className="mh-post-head-meta">
            <p className="mh-post-author">
              {souvenir.auteur?.prenom || '?'} {souvenir.auteur?.nom || ''}
            </p>
            <p className="mh-post-date">
              {souvenir.date_souvenir && (
                <time dateTime={souvenir.date_souvenir}>
                  {new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </time>
              )}
              {souvenir.lieu && <span className="mh-post-date-lieu">📍 {souvenir.lieu}</span>}
            </p>
          </div>
          <span className={`mh-memory-type mh-post-type ${getTypeClass(souvenir.type)}`}>
            {getTypeLabel(souvenir.type)}
          </span>
        </header>

        <div className="mh-fb-post-body mh-post-body-inner">
          <h3 className="mh-post-title">
            {souvenir.epingle && <span title="Épinglé">📌 </span>}
            {souvenir.titre}
          </h3>

          {cleanDescription && <p className="mh-post-desc">{cleanDescription}</p>}

          {souvenir.type === 'PHOTO' && urls.length > 0 && (
            <div className="mh-fb-media" style={styles.galleryContainer}>
              {urls.length === 1 ? (
                <img
                  src={urls[0]}
                  alt={souvenir.titre}
                  style={styles.singleImage}
                  onClick={() => openImageViewer(urls[0])}
                />
              ) : (
                <div
                  style={{
                    ...styles.galleryGrid,
                    gridTemplateColumns:
                      urls.length === 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)'
                  }}
                >
                  {urls.slice(0, 4).map((imgUrl, imgIdx) => (
                    <div
                      key={imgIdx}
                      style={{
                        ...styles.galleryItem,
                        ...(urls.length === 3 && imgIdx === 0
                          ? { gridRow: 'span 2', aspectRatio: 'auto', height: '100%' }
                          : {})
                      }}
                      onClick={() => openImageViewer(imgUrl)}
                      onKeyDown={(e) => e.key === 'Enter' && openImageViewer(imgUrl)}
                      role="button"
                      tabIndex={0}
                    >
                      <img src={imgUrl} alt={`${souvenir.titre} - ${imgIdx + 1}`} style={styles.galleryImage} />
                      {imgIdx === 3 && urls.length > 4 && (
                        <div style={styles.galleryOverlay}>+{urls.length - 4}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {urls[0] && souvenir.type === 'AUDIO' && (
            <audio controls style={{ width: '100%', marginBottom: '10px', borderRadius: '12px' }}>
              <source src={urls[0]} />
            </audio>
          )}
          {urls[0] && souvenir.type === 'VIDEO' && (
            <video controls className="mh-souvenir-video mh-fb-media">
              <source src={urls[0]} />
            </video>
          )}

          {souvenir.type === 'DOCUMENT' && mediaItems.length > 0 && (
            <SouvenirDocuments
              items={mediaItems}
              titre={souvenir.titre}
              onImageClick={(imgUrl) => openImageViewer(imgUrl)}
            />
          )}

          {souvenir.tags?.length > 0 && (
            <div style={styles.tagsContainer}>
              {souvenir.tags.map((t) => (
                <span key={t.tag_id} className="mh-memory-tag">
                  #{t.tag?.libelle || t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mh-fb-actions" style={styles.actions}>
          {estAdmin(utilisateur?.role) && onToggleEpingle && (
            <button
              type="button"
              onClick={() => onToggleEpingle(souvenir)}
              style={souvenir.epingle ? styles.actionBtnActive : styles.actionBtn}
              title={souvenir.epingle ? 'Désépingler' : 'Épingler'}
            >
              📌
            </button>
          )}
          {peutModifierContenuAuteur(souvenir) && peutEcrire(utilisateur?.role) && onEdit && (
            <button type="button" onClick={() => onEdit(souvenir)} style={styles.actionBtn} title="Modifier">
              ✏️
            </button>
          )}
          {onToggleFavori && (
            <button
              type="button"
              onClick={() => onToggleFavori(souvenir.id)}
              style={favori ? styles.actionBtnActive : styles.actionBtn}
              title={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {favori ? '⭐' : '☆'}
            </button>
          )}
          <button
            type="button"
            onClick={() => reagir('COEUR')}
            style={maReaction === 'COEUR' ? styles.actionBtnActive : styles.actionBtn}
          >
            ❤️ {compterReactions('COEUR')}
          </button>
          <button
            type="button"
            onClick={() => reagir('LIKE')}
            style={maReaction === 'LIKE' ? styles.actionBtnActive : styles.actionBtn}
          >
            👍 {compterReactions('LIKE')}
          </button>
          <button
            type="button"
            onClick={() => reagir('LARME')}
            style={maReaction === 'LARME' ? styles.actionBtnActive : styles.actionBtn}
          >
            😢 {compterReactions('LARME')}
          </button>
          <button
            type="button"
            onClick={() => reagir('RIRE')}
            style={maReaction === 'RIRE' ? styles.actionBtnActive : styles.actionBtn}
          >
            😄 {compterReactions('RIRE')}
          </button>
          <button
            type="button"
            onClick={() => setCommentairesOuverts((v) => !v)}
            style={styles.actionBtn}
          >
            💬 {souvenir.commentaires?.length || 0}
          </button>
          {urls[0] && (
            <button
              type="button"
              onClick={() => downloadMedia(urls[0], souvenir.titre)}
              style={styles.actionBtn}
              title="Télécharger"
            >
              ⬇️ Télécharger
            </button>
          )}
          {peutEcrire(utilisateur?.role) && onSupprimer && peutModifierContenuAuteur(souvenir) && (
              <button
                type="button"
                onClick={() => onSupprimer(souvenir.id)}
                style={{ ...styles.actionBtn, marginLeft: 'auto', color: '#C06060' }}
                title="Supprimer"
              >
                🗑️
              </button>
            )}
        </div>

        {commentairesOuverts && (
          <CommentSection souvenirId={souvenir.id} utilisateur={utilisateur} />
        )}
      </article>

      {imageViewer.open && (
        <div style={styles.imageModal} onClick={closeImageViewer} role="dialog" aria-modal="true">
          <button type="button" style={styles.closeButton} onClick={closeImageViewer} aria-label="Fermer">
            ✕
          </button>
          {imageViewer.currentIndex > 0 && (
            <button
              type="button"
              style={{ ...styles.navButton, left: '16px' }}
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
            >
              ‹
            </button>
          )}
          <img
            src={imageViewer.currentImage}
            alt="Agrandie"
            style={styles.imageModalContent}
            onClick={(e) => e.stopPropagation()}
          />
          {imageViewer.currentIndex < imageViewer.images.length - 1 && (
            <button
              type="button"
              style={{ ...styles.navButton, right: '16px' }}
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
            >
              ›
            </button>
          )}
          <button
            type="button"
            style={styles.saveButton}
            onClick={(e) => {
              e.stopPropagation()
              downloadMedia(imageViewer.currentImage, souvenir.titre)
            }}
          >
            💾 Enregistrer
          </button>
          {imageViewer.images.length > 1 && (
            <div style={styles.imageCounter}>
              {imageViewer.currentIndex + 1} / {imageViewer.images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
