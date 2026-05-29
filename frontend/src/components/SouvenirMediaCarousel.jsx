import { useRef, useState, useEffect, useCallback } from 'react'
import { getMediaKind } from '../lib/mediaUrl'
import '../styles/souvenir-media.css'

function MediaSlide({ url, titre, kind, onClick }) {
  if (kind === 'video') {
    return (
      <button type="button" className="mh-media-slide mh-media-slide--btn" onClick={onClick}>
        <video
          className="mh-media-slide-video"
          src={url}
          controls
          playsInline
          preload="metadata"
          onClick={(e) => e.stopPropagation()}
        />
      </button>
    )
  }

  if (kind === 'audio') {
    return (
      <div className="mh-media-slide mh-media-slide--audio">
        <audio controls src={url} className="mh-media-slide-audio" preload="metadata" />
        <span className="mh-media-slide-audio-label">{titre || 'Audio'}</span>
      </div>
    )
  }

  return (
    <button type="button" className="mh-media-slide mh-media-slide--btn" onClick={onClick}>
      <img src={url} alt={titre} className="mh-media-slide-img" loading="lazy" />
    </button>
  )
}

/**
 * Carrousel style Facebook : un média à la fois, swipe horizontal, pastilles.
 */
export default function SouvenirMediaCarousel({ urls, titre, onOpenAt }) {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)
  const items = (urls || []).filter(Boolean)

  const scrollToIndex = useCallback((i) => {
    const track = trackRef.current
    if (!track || !items.length) return
    const slide = track.children[i]
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
    setIndex(i)
  }, [items.length])

  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || !items.length) return
    const w = track.offsetWidth
    if (w <= 0) return
    const i = Math.round(track.scrollLeft / w)
    if (i !== index && i >= 0 && i < items.length) setIndex(i)
  }, [index, items.length])

  useEffect(() => {
    setIndex(0)
    if (trackRef.current) trackRef.current.scrollLeft = 0
  }, [urls?.join('|')])

  if (!items.length) return null

  if (items.length === 1) {
    const kind = getMediaKind(items[0])
    return (
      <div className="mh-media-carousel mh-media-carousel--single">
        <MediaSlide
          url={items[0]}
          titre={titre}
          kind={kind}
          onClick={() => onOpenAt?.(0)}
        />
      </div>
    )
  }

  return (
    <div className="mh-media-carousel">
      <div
        ref={trackRef}
        className="mh-media-carousel-track"
        onScroll={onScroll}
        role="region"
        aria-label={`Médias du souvenir : ${titre || ''}`}
      >
        {items.map((url, i) => (
          <div key={`${url}-${i}`} className="mh-media-carousel-item">
            <MediaSlide
              url={url}
              titre={titre}
              kind={getMediaKind(url)}
              onClick={() => onOpenAt?.(i)}
            />
          </div>
        ))}
      </div>

      {index > 0 && (
        <button
          type="button"
          className="mh-media-carousel-arrow mh-media-carousel-arrow--prev"
          aria-label="Média précédent"
          onClick={() => scrollToIndex(index - 1)}
        >
          ‹
        </button>
      )}
      {index < items.length - 1 && (
        <button
          type="button"
          className="mh-media-carousel-arrow mh-media-carousel-arrow--next"
          aria-label="Média suivant"
          onClick={() => scrollToIndex(index + 1)}
        >
          ›
        </button>
      )}

      <div className="mh-media-carousel-dots" role="tablist">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Média ${i + 1} sur ${items.length}`}
            className={`mh-media-dot ${i === index ? 'mh-media-dot--active' : ''}`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>

      <span className="mh-media-carousel-counter">
        {index + 1} / {items.length}
      </span>
    </div>
  )
}
