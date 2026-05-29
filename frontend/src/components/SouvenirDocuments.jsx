import {
  detectMediaKind,
  displayFileName,
  iconForMediaKind,
  labelForMediaKind
} from '../lib/mediaKinds'
import { downloadMedia } from '../lib/downloadMedia'

export default function SouvenirDocuments({ items = [], titre = 'souvenir', onImageClick }) {
  if (!items.length) return null

  return (
    <div className="mh-doc-list">
      {items.map((item, idx) => {
        const url = item.url || item
        const name = displayFileName(typeof item === 'string' ? { url: item } : item)
        const kind = detectMediaKind(url, name)

        if (kind === 'image') {
          return (
            <button
              key={`${url}-${idx}`}
              type="button"
              className="mh-doc-image-btn"
              onClick={() => onImageClick?.(url)}
            >
              <img src={url} alt={name} className="mh-doc-image-preview" loading="lazy" />
            </button>
          )
        }

        return (
          <div key={`${url}-${idx}`} className="mh-doc-card">
            <span className="mh-doc-icon" aria-hidden="true">
              {iconForMediaKind(kind)}
            </span>
            <div className="mh-doc-meta">
              <span className="mh-doc-name" title={name}>
                {name}
              </span>
              <span className="mh-doc-kind">{labelForMediaKind(kind)}</span>
            </div>
            <div className="mh-doc-actions">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mh-doc-link"
              >
                Ouvrir
              </a>
              <button
                type="button"
                className="mh-doc-link mh-doc-link--btn"
                onClick={() => downloadMedia(url, name.replace(/\.[^.]+$/, '') || titre)}
              >
                Télécharger
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
