import { useEffect, useState, useCallback } from 'react'
import '../styles/image-lightbox.css'

function preloadUrl(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('no url'))
      return
    }
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = reject
    img.src = url
  })
}

export default function ImageLightbox({
  open,
  images = [],
  currentIndex = 0,
  onClose,
  onPrev,
  onNext,
  onSave
}) {
  const [shellOpen, setShellOpen] = useState(false)
  const [imgReady, setImgReady] = useState(false)
  const current = images[currentIndex]
  const url = current?.url

  useEffect(() => {
    if (open) {
      document.body.classList.add('mh-lightbox-open')
      const t = requestAnimationFrame(() => setShellOpen(true))
      return () => cancelAnimationFrame(t)
    }
    setShellOpen(false)
    setImgReady(false)
    document.body.classList.remove('mh-lightbox-open')
  }, [open])

  useEffect(() => {
    if (!open || !url) return
    let cancelled = false
    setImgReady(false)
    preloadUrl(url)
      .then(() => {
        if (!cancelled) setImgReady(true)
      })
      .catch(() => {
        if (!cancelled) setImgReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [open, url, currentIndex])

  useEffect(() => {
    if (!open || images.length < 2) return
    const next = images[currentIndex + 1]?.url
    const prev = images[currentIndex - 1]?.url
    if (next) preloadUrl(next).catch(() => {})
    if (prev) preloadUrl(prev).catch(() => {})
  }, [open, currentIndex, images])

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose?.()
    },
    [onClose]
  )

  if (!open && !shellOpen) return null

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1
  const titre = current?.titre || 'souvenir'

  return (
    <div
      className={`mh-lightbox ${shellOpen ? 'mh-lightbox--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Photo agrandie"
      onClick={handleBackdropClick}
    >
      {url && (
        <div
          className="mh-lightbox-backdrop"
          style={{ backgroundImage: `url(${url})` }}
          aria-hidden
        />
      )}

      <div className="mh-lightbox-stage">
        {!imgReady && <div className="mh-lightbox-loader" aria-hidden />}
        {url && (
          <img
            key={url}
            src={url}
            alt={titre}
            className={`mh-lightbox-img ${imgReady ? 'mh-lightbox-img--ready' : ''}`}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        )}
      </div>

      <button type="button" className="mh-lightbox-close" onClick={onClose} aria-label="Fermer">
        ✕
      </button>

      {hasPrev && (
        <button
          type="button"
          className="mh-lightbox-nav mh-lightbox-nav--prev"
          onClick={(e) => {
            e.stopPropagation()
            onPrev?.()
          }}
          aria-label="Photo précédente"
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          className="mh-lightbox-nav mh-lightbox-nav--next"
          onClick={(e) => {
            e.stopPropagation()
            onNext?.()
          }}
          aria-label="Photo suivante"
        >
          ›
        </button>
      )}

      <div className="mh-lightbox-footer">
        {images.length > 1 && (
          <span className="mh-lightbox-counter">
            {currentIndex + 1} / {images.length}
          </span>
        )}
        {url && (
          <button
            type="button"
            className="mh-lightbox-save"
            onClick={(e) => {
              e.stopPropagation()
              onSave?.(url, titre)
            }}
          >
            Enregistrer
          </button>
        )}
      </div>
    </div>
  )
}
