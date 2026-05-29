import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSouvenir } from '../services/souvenirsApi'
import AppLayout from '../components/AppLayout'
import FileUploadField from '../components/FileUploadField'
import { DOCUMENT_ACCEPT, iconForMediaKind, detectMediaKind } from '../lib/mediaKinds'

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
    fichiers: []
  })

  useEffect(() => {
    if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
      setMediaWarning(
        'VITE_API_URL manquante sur Vercel : les fichiers sont envoyés via Railway. Vérifiez la configuration du frontend.'
      )
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleTypeChange = (type) => {
    setForm({ ...form, type, fichiers: [] })
  }

  const removeFile = (index) => {
    const newFiles = [...form.fichiers]
    newFiles.splice(index, 1)
    setForm({ ...form, fichiers: newFiles })
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
        fichiers: form.type !== 'TEXTE' ? form.fichiers : []
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
    { value: 'VIDEO', label: '🎬 Vidéo', accept: 'video/*', multiple: true },
    { value: 'AUDIO', label: '🎙️ Audio', accept: 'audio/*', multiple: true },
    {
      value: 'DOCUMENT',
      label: '📎 Documents',
      accept: DOCUMENT_ACCEPT,
      multiple: true
    },
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
                        : form.type === 'VIDEO'
                          ? 'MP4, MOV, AVI'
                          : 'PDF, Word, Excel, PowerPoint, JPG, PNG, TXT…'
                  }
                  onFiles={(picked) => {
                    setForm({ ...form, fichiers: [...form.fichiers, ...picked] })
                  }}
                />

                {form.fichiers.length > 0 && (
                  <div className="mh-file-list">
                    {form.fichiers.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="mh-file-item">
                        <span>
                          {iconForMediaKind(detectMediaKind('', file.name))} {file.name}
                        </span>
                        <button type="button" className="mh-file-remove" onClick={() => removeFile(idx)} aria-label="Retirer">
                          ✕
                        </button>
                      </div>
                    ))}
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
