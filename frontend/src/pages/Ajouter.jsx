import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSouvenir } from '../services/souvenirsApi'
import AppLayout from '../components/AppLayout'
import FileUploadField from '../components/FileUploadField'
import { DEFAULT_MEDIA_LAYOUT, getLayoutOptions, normalizeMediaLayout } from '../lib/mediaLayout'

export default function Ajouter() {
  const navigate = useNavigate()
  const [uploadProgress, setUploadProgress] = useState(false)
  const [mediaWarning, setMediaWarning] = useState(null)
  const [form, setForm] = useState({
    titre: '',
    description: '',
    type: 'PHOTO',
    date_souvenir: '',
    lieu: '',
    tags: '',
    fichiers: [],
    mediaLayout: DEFAULT_MEDIA_LAYOUT
  })

  useEffect(() => {
    const cloudOk = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    if (import.meta.env.PROD && !cloudOk) {
      setMediaWarning(
        'Photos : variables Cloudinary manquantes sur Vercel. Contactez l’admin ou redéployez le frontend.'
      )
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleTypeChange = (type) => {
    setForm({ ...form, type, fichiers: [], mediaLayout: DEFAULT_MEDIA_LAYOUT })
  }

  const removeFile = (index) => {
    const newFiles = [...form.fichiers]
    newFiles.splice(index, 1)
    const mediaLayout = normalizeMediaLayout(form.mediaLayout, newFiles.length)
    setForm({ ...form, fichiers: newFiles, mediaLayout })
  }

  const moveFile = (index, direction) => {
    const newFiles = [...form.fichiers]
    const target = index + direction
    if (target < 0 || target >= newFiles.length) return
    ;[newFiles[index], newFiles[target]] = [newFiles[target], newFiles[index]]
    setForm({ ...form, fichiers: newFiles })
  }

  const setMediaLayout = (mediaLayout) => {
    setForm({ ...form, mediaLayout })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titre || !form.date_souvenir) {
      alert('Le titre et la date sont obligatoires')
      return
    }

    try {
      setUploadProgress(true)
      const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

      await createSouvenir({
        titre: form.titre,
        description: form.description,
        type: form.type,
        date_souvenir: form.date_souvenir,
        lieu: form.lieu,
        tags,
        fichiers: form.type !== 'TEXTE' ? form.fichiers : [],
        mediaLayout: form.fichiers.length > 1 ? form.mediaLayout : undefined
      })

      navigate('/dashboard')
    } catch (err) {
      console.error('Erreur ajout:', err)
      alert(err.userMessage || err.response?.data?.message || err.message || "Erreur lors de l'ajout")
    } finally {
      setUploadProgress(false)
    }
  }

  const typeOptions = [
    { value: 'PHOTO', label: '📷 Photos', accept: 'image/*', multiple: true },
    { value: 'AUDIO', label: '🎙️ Audio', accept: 'audio/*', multiple: true },
    { value: 'VIDEO', label: '🎬 Vidéo', accept: 'video/*', multiple: true },
    { value: 'TEXTE', label: '📝 Texte', accept: '', multiple: false }
  ]

  const currentType = typeOptions.find((o) => o.value === form.type)

  return (
    <AppLayout activePath="/ajouter">
      <div className="mh-form-page fade-in-up">
        <div className="mh-card mh-glass-card mh-form-card--light mh-mirror-surface">
          {mediaWarning && (
            <div className="mh-form-alert mh-form-alert--warning">⚠️ {mediaWarning}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mh-form-field">
              <label className="mh-label">Type de souvenir *</label>
              <div className="mh-type-row">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`mh-type-chip ${form.type === opt.value ? 'mh-type-chip--active' : ''}`}
                    onClick={() => handleTypeChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mh-form-field">
              <label className="mh-label">Titre *</label>
              <input
                type="text"
                name="titre"
                className="mh-input"
                value={form.titre}
                onChange={handleChange}
                placeholder="Ex : Vacances à Lomé, Anniversaire de grand-mère…"
                required
              />
            </div>

            <div className="mh-form-grid">
              <div className="mh-form-field" style={{ marginBottom: 0 }}>
                <label className="mh-label">Date *</label>
                <input
                  type="date"
                  name="date_souvenir"
                  className="mh-input"
                  value={form.date_souvenir}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mh-form-field" style={{ marginBottom: 0 }}>
                <label className="mh-label">Lieu</label>
                <input
                  type="text"
                  name="lieu"
                  className="mh-input"
                  value={form.lieu}
                  onChange={handleChange}
                  placeholder="Ex : Lomé, Togo"
                />
              </div>
            </div>

            <div className="mh-form-field">
              <label className="mh-label">Description</label>
              <textarea
                name="description"
                className="mh-textarea"
                value={form.description}
                onChange={handleChange}
                placeholder="Racontez ce moment spécial…"
                rows={4}
              />
            </div>

            {form.type !== 'TEXTE' && (
              <div className="mh-form-field">
                <label className="mh-label">
                  Fichiers
                  {currentType?.multiple && (
                    <span style={{ fontWeight: 400, color: 'var(--text-soft)', marginLeft: '0.35rem' }}>
                      (plusieurs possibles)
                    </span>
                  )}
                </label>
                <FileUploadField
                  accept={currentType?.accept}
                  multiple={currentType?.multiple || false}
                  photoMode={form.type === 'PHOTO'}
                  hintFormats={
                    form.type === 'PHOTO'
                      ? 'JPG, PNG, GIF, WEBP'
                      : form.type === 'AUDIO'
                        ? 'MP3, WAV, OGG, M4A'
                        : 'MP4, MOV, AVI'
                  }
                  onFiles={(picked) => {
                    const fichiers = [...form.fichiers, ...picked]
                    setForm({
                      ...form,
                      fichiers,
                      mediaLayout: normalizeMediaLayout(form.mediaLayout, fichiers.length)
                    })
                  }}
                />

                {form.fichiers.length > 0 && (
                  <div className="mh-file-list">
                    {form.fichiers.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="mh-file-item">
                        {form.fichiers.length > 1 && (
                          <div className="mh-file-order">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveFile(idx, -1)}
                              aria-label="Monter"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={idx === form.fichiers.length - 1}
                              onClick={() => moveFile(idx, 1)}
                              aria-label="Descendre"
                            >
                              ↓
                            </button>
                          </div>
                        )}
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {idx + 1}. {file.name}
                        </span>
                        <button type="button" className="mh-file-remove" onClick={() => removeFile(idx)} aria-label="Retirer">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.fichiers.length > 1 && (
                  <div className="mh-layout-picker" role="group" aria-labelledby="mh-layout-picker-title">
                    <p id="mh-layout-picker-title" className="mh-layout-picker-label">
                      Disposition des fichiers
                    </p>
                    <p className="mh-layout-picker-hint">
                      Choisissez comment afficher vos {form.fichiers.length} fichiers dans le fil. Utilisez ↑ ↓ pour l’ordre.
                    </p>
                    <div className="mh-layout-options">
                      {getLayoutOptions(form.fichiers.length).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`mh-layout-chip ${form.mediaLayout === opt.id ? 'mh-layout-chip--active' : ''}`}
                          onClick={() => setMediaLayout(opt.id)}
                          title={opt.hint}
                        >
                          <span aria-hidden>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mh-form-field">
              <label className="mh-label">Tags (séparés par des virgules)</label>
              <input
                type="text"
                name="tags"
                className="mh-input"
                value={form.tags}
                onChange={handleChange}
                placeholder="vacances, famille, anniversaire…"
              />
            </div>

            <button
              type="submit"
              className="mh-btn mh-btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={uploadProgress}
            >
              {uploadProgress
                ? `📤 Envoi de ${form.fichiers.length} fichier(s)…`
                : form.fichiers.length > 0
                  ? `✨ Publier (${form.fichiers.length} fichier${form.fichiers.length > 1 ? 's' : ''})`
                  : '✨ Publier le souvenir'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
