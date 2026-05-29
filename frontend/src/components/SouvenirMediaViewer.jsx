import { useEffect, useRef, useCallback } from 'react'
import { downloadMedia } from '../lib/downloadMedia'
import '../styles/souvenir-media.css'

function ViewerSlide({ item }) {
  if (item.kind === 'video') {
    return (
      <video
        className="mh-media-viewer-video"
        src={item.url}
        controls
        playsInline
        autoPlay
        key={item.url}
      />
    )
  }

  if (item.kind === 'audio') {
    return (
      <div className="mh-media-viewer-audio-wrap">
        <audio controls src={item.url} className="mh-media-viewer-audio" autoPlay key={item.url} />
        <p className="mh-media-viewer-audio-title">{item.titre}</p>
      </div>
    )
  }

  return <img src={item.url} alt={item.titre || 'Souvenir'} className="mh-media-viewer-img" />
}

/**
 * Visionneuse plein écran — navigation successive (comme Facebook).
 */
export default function SouvenirMediaViewer({
  open,
  items,
  index,
  onClose,
  onIndexChange
}) {
  const trackRef = useRef(null)
  const touchStartX = useRef(null)

  const scrollToIndex = useCallback(
    (i, smooth = true) => {
      const track = trackRef.current
      if (!track || !items?.length) return
      const slide = track.children[i]
      if (slide) {
        slide.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          inline: 'center',
          block: 'nearest'
        })
      }
      onIndexChange?.(i)
    },
    [items, onIndexChange]
  )

  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || !items?.length) return
    const w = track.offsetWidth
    if (w <= 0) return
    const i = Math.round(track.scrollLeft / w)
    if (i >= 0 && i < items.length && i !== index) onIndexChange?.(i)
  }, [index, items, onIndexChange])

  useEffect(() => {
    if (!open) return undefined
    document.body.classList.add('mh-media-viewer-open')
    const t = requestAnimationFrame(() => scrollToIndex(index, false))
    return () => {
      cancelAnimationFrame(t)
      document.body.classList.remove('mh-media-viewer-open')
    }
  }, [open, index, scrollToIndex])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowLeft' && index > 0) scrollToIndex(index - 1)
      if (e.key === 'ArrowRight' && index < items.length - 1) scrollToIndex(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, items?.length, onClose, scrollToIndex])

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    if (dx < 0 && index < items.length - 1) scrollToIndex(index + 1)
    if (dx > 0 && index > 0) scrollToIndex(index - 1)
  }

  if (!open || !items?.length) return null

  const current = items[index]

  return (
    <div
      className="mh-media-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse de médias"
      onClick={onClose}
    >
      <button type="button" className="mh-media-viewer-close" onClick={onClose} aria-label="Fermer">
        ✕
      </button>

      {current?.titre && (
        <p className="mh-media-viewer-header" onClick={(e) => e.stopPropagation()}>
          {current.titre}
        </p>
      )}

      {index > 0 && (
        <button
          type="button"
          className="mh-media-viewer-nav mh-media-viewer-nav--prev"
          onClick={(e) => {
            e.stopPropagation()
            scrollToIndex(index - 1)
          }}
          aria-label="Précédent"
        >
          ‹
        </button>
      )}

      <div
        ref={trackRef}
        className="mh-media-viewer-track"
        onScroll={onScroll}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {items.map((item, i) => (
          <div key={`${item.url}-${i}`} className="mh-media-viewer-slide">
            <ViewerSlide item={item} />
          </div>
        ))}
      </div>

      {index < items.length - 1 && (
        <button
          type="button"
          className="mh-media-viewer-nav mh-media-viewer-nav--next"
          onClick={(e) => {
            e.stopPropagation()
            scrollToIndex(index + 1)
          }}
          aria-label="Suivant"
        >
          ›
        </button>
      )}

      <div className="mh-media-viewer-footer" onClick={(e) => e.stopPropagation()}>
        {items.length > 1 && (
          <span className="mh-media-viewer-counter">
            {index + 1} / {items.length}
          </span>
        )}
        <div className="mh-media-viewer-dots">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`mh-media-dot ${i === index ? 'mh-media-dot--active' : ''}`}
              aria-label={`Média ${i + 1}`}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
        {current?.url && (
          <button
            type="button"
            className="mh-media-viewer-save"
            onClick={() => downloadMedia(current.url, current.titre || 'souvenir')}
          >
            💾 Enregistrer
          </button>
        )}
      </div>
    </div>
  )
}
