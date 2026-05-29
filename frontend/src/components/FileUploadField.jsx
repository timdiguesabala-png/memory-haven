import { useId, useRef } from 'react'

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Sélection de fichiers : ouvre le gestionnaire du système (obligatoire pour la sécurité).
 * Sur mobile + photos : boutons séparés Appareil photo / Galerie.
 */
export default function FileUploadField({
  accept = 'image/*',
  multiple = true,
  photoMode = false,
  onFiles,
  hintFormats = 'JPG, PNG, GIF, WEBP'
}) {
  const id = useId()
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)
  const mobilePhoto = photoMode && isMobileDevice()

  const emitFiles = (e) => {
    const list = Array.from(e.target.files || [])
    if (list.length) onFiles?.(list)
    e.target.value = ''
  }

  return (
    <div className="mh-file-picker">
      <p className="mh-file-picker-system-note">
        La fenêtre qui s’ouvre (fichiers, galerie ou appareil photo) est celle de votre téléphone ou
        navigateur. Memory Haven ne peut pas la personnaliser — c’est normal pour protéger vos
        fichiers.
      </p>

      {mobilePhoto ? (
        <div className="mh-file-picker-actions">
          <button
            type="button"
            className="mh-file-picker-btn mh-file-picker-btn--primary"
            onClick={() => cameraRef.current?.click()}
          >
            📷 Prendre une photo
          </button>
          <button
            type="button"
            className="mh-file-picker-btn"
            onClick={() => galleryRef.current?.click()}
          >
            🖼️ Galerie / fichiers
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="mh-file-input-native"
            onChange={emitFiles}
            tabIndex={-1}
            aria-hidden
          />
          <input
            ref={galleryRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="mh-file-input-native"
            onChange={emitFiles}
            tabIndex={-1}
            aria-hidden
          />
        </div>
      ) : (
        <>
          <label htmlFor={id} className="mh-upload-zone">
            📁 Touchez ici…
            <span className="mh-upload-hint">
              Formats : {hintFormats}
              {multiple && (
                <>
                  {' '}
                  · plusieurs fichiers possibles
                </>
              )}
            </span>
          </label>
          <input
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            className="mh-file-input-native"
            onChange={emitFiles}
          />
        </>
      )}

      {!mobilePhoto && multiple && (
        <p className="mh-upload-hint" style={{ marginTop: '0.5rem' }}>
          Sur ordinateur : maintenez <strong>Ctrl</strong> pour en sélectionner plusieurs.
        </p>
      )}
    </div>
  )
}
