import { normalizeMediaLayout } from '../lib/mediaLayout'

/**
 * Galerie photos/vidéos selon la disposition choisie à la publication.
 */
export default function SouvenirMediaGallery({
  urls = [],
  layout = 'grille',
  titre = '',
  mediaKind = 'image',
  onMediaClick,
  className = 'mh-fb-media'
}) {
  if (!urls.length) return null

  const lay = normalizeMediaLayout(layout, urls.length)
  const display = urls.slice(0, 4)
  const remaining = urls.length - 4

  const renderItem = (url, idx, extraClass = '') => {
    const isVideo = mediaKind === 'video'
    const cellClass = `mh-feed-gallery-cell ${extraClass}`.trim()
    const content = isVideo ? (
      <video controls className="mh-souvenir-video-inline" preload="metadata">
        <source src={url} />
      </video>
    ) : (
      <img src={url} alt={`${titre} - ${idx + 1}`} loading="lazy" />
    )

    return (
      <div
        key={url + idx}
        className={cellClass}
        onClick={() => !isVideo && onMediaClick?.(url)}
        onKeyDown={(e) => {
          if (!isVideo && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onMediaClick?.(url)
          }
        }}
        role={!isVideo ? 'button' : undefined}
        tabIndex={!isVideo ? 0 : undefined}
      >
        {content}
        {idx === 3 && remaining > 0 && (
          <div className="mh-feed-gallery-overlay">+{remaining}</div>
        )}
      </div>
    )
  }

  if (urls.length === 1) {
    const url = urls[0]
    if (mediaKind === 'video') {
      return (
        <div className={className}>
          <video controls className="mh-souvenir-video mh-feed-single-photo">
            <source src={url} />
          </video>
        </div>
      )
    }
    return (
      <div className={className}>
        <img
          src={url}
          alt={titre}
          className="mh-feed-single-photo"
          onClick={() => onMediaClick?.(url)}
        />
      </div>
    )
  }

  if (lay === 'horizontal') {
    return (
      <div className={`${className} mh-media-layout mh-media-layout--horizontal`}>
        <div className="mh-feed-gallery-grid mh-feed-gallery-grid--horizontal">
          {display.map((url, idx) => renderItem(url, idx))}
        </div>
      </div>
    )
  }

  if (lay === 'vertical') {
    return (
      <div className={`${className} mh-media-layout mh-media-layout--vertical`}>
        <div className="mh-feed-gallery-grid mh-feed-gallery-grid--vertical">
          {display.map((url, idx) => renderItem(url, idx))}
        </div>
      </div>
    )
  }

  if (lay === 'mosaique' && urls.length >= 3) {
    return (
      <div className={`${className} mh-media-layout mh-media-layout--mosaique`}>
        <div className="mh-feed-gallery-grid mh-feed-gallery-grid--mosaique">
          {display.map((url, idx) =>
            renderItem(url, idx, idx === 0 ? 'mh-feed-gallery-cell--tall' : '')
          )}
        </div>
      </div>
    )
  }

  const count = display.length
  let gridClass = 'mh-feed-gallery-grid--one'
  if (count === 2) gridClass = 'mh-feed-gallery-grid--two'
  if (count >= 3) gridClass = 'mh-feed-gallery-grid--quad'

  return (
    <div className={`${className} mh-media-layout mh-media-layout--grille`}>
      <div className={`mh-feed-gallery-grid ${gridClass}`}>
        {display.map((url, idx) =>
          renderItem(
            url,
            idx,
            count === 3 && idx === 0 ? 'mh-feed-gallery-cell--tall' : ''
          )
        )}
      </div>
    </div>
  )
}
