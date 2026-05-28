import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSouvenir, fetchApiHealth } from '../services/souvenirsApi'
import { useTheme } from '../context/ThemeContext'
import AppLayout from '../components/AppLayout'
import StandardSidebar from '../components/StandardSidebar'

export default function Ajouter() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()
  
  const [uploadProgress, setUploadProgress] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
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

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#141210' : '#FDF6EE', fontFamily: 'sans-serif' },
    nav: { background: darkMode ? '#1E1A16' : '#3D2410', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: darkMode ? '#e0e0e0' : '#FDF6EE', fontSize: '18px', fontFamily: 'Georgia,serif', fontWeight: '500', flex: 1 },
    navLinks: { display: 'flex', gap: '6px' },
    navBtn: { background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#FDF6EE', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    navBtnActive: { background: '#C8956C', color: '#3D2410', borderColor: '#C8956C', fontWeight: '500' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    navAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#C8956C', color: '#3D2410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
    btnLogout: { background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#FDF6EE', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    app: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '200px', background: darkMode ? '#262220' : '#F5E6D3', borderRight: `1px solid ${darkMode ? '#141210' : '#E8C9A0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#B08060', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#7A5035', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#C8956C' : '#C8956C', color: '#FFF', fontWeight: '500' },
    main: { flex: 1, padding: '1.5rem', overflowY: 'auto', maxWidth: '800px', margin: '0 auto' },
    header: { marginBottom: '1.5rem' },
    titre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#3D2410', fontFamily: 'Georgia,serif', margin: '0 0 3px' },
    sousTitre: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#7A5035', margin: 0 },
    formCard: { background: darkMode ? '#262220' : '#FFF9F3', border: `1px solid ${darkMode ? '#C8956C' : '#E8C9A0'}`, borderRadius: '16px', padding: '1.5rem' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    formChamp: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '13px', color: darkMode ? '#e0e0e0' : '#7A5035', marginBottom: '5px', fontWeight: '500' },
    input: { width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${darkMode ? '#C8956C' : '#E8C9A0'}`, fontSize: '14px', background: darkMode ? '#141210' : '#FFF', color: darkMode ? '#e0e0e0' : '#3D2410', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' },
    textarea: { width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${darkMode ? '#C8956C' : '#E8C9A0'}`, fontSize: '14px', background: darkMode ? '#141210' : '#FFF', color: darkMode ? '#e0e0e0' : '#3D2410', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', resize: 'vertical', minHeight: '100px' },
    uploadZone: { border: `2px dashed ${darkMode ? '#C8956C' : '#E8C9A0'}`, borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer', color: darkMode ? '#a0a0a0' : '#7A5035', fontSize: '14px', transition: 'all 0.2s', background: darkMode ? '#141210' : '#FFF9F3' },
    typeSelector: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    typeBtn: { padding: '8px 20px', borderRadius: '20px', border: `1.5px solid ${darkMode ? '#C8956C' : '#E8C9A0'}`, background: 'transparent', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', color: darkMode ? '#e0e0e0' : '#7A5035' },
    typeBtnActive: { background: '#9B6240', color: '#FFF', borderColor: '#9B6240' },
    btnSubmit: { background: '#9B6240', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', width: '100%', marginTop: '16px' },
    btnSubmitDisabled: { background: '#C8956C', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', width: '100%', marginTop: '16px', cursor: 'not-allowed' },
    fileList: { marginTop: '12px', maxHeight: '200px', overflowY: 'auto' },
    fileItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: darkMode ? '#141210' : '#FFF', borderRadius: '8px', marginBottom: '6px', border: `1px solid ${darkMode ? '#C8956C' : '#E8C9A0'}` },
    fileName: { fontSize: '12px', color: darkMode ? '#e0e0e0' : '#3D2410', flex: 1 },
    fileRemove: { background: 'none', border: 'none', color: '#C06060', cursor: 'pointer', fontSize: '16px' }
  }

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
    setForm({ ...form, type, fichiers: [] })
    setUploadedFiles([])
  }

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || [])
    if (picked.length === 0) return
    const merged = [...form.fichiers, ...picked]
    setForm({ ...form, fichiers: merged })
    setUploadedFiles(merged.map((f) => ({ name: f.name, progress: 0, url: null })))
    e.target.value = ''
  }

  const removeFile = (index) => {
    const newFiles = [...form.fichiers]
    newFiles.splice(index, 1)
    setForm({ ...form, fichiers: newFiles })
    
    const newUploaded = [...uploadedFiles]
    newUploaded.splice(index, 1)
    setUploadedFiles(newUploaded)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.titre || !form.date_souvenir) {
      alert('Le titre et la date sont obligatoires')
      return
    }

    try {
      setUploadProgress(true)
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(t => t) : []

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
      console.error('❌ Erreur ajout:', err)
      alert(err.userMessage || err.response?.data?.message || err.message || 'Erreur lors de l\'ajout')
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

  return (
    <AppLayout activePath="/ajouter" sidebar={<StandardSidebar active="ajouter" />}>
        <div style={{ ...styles.main, padding: 0, maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <div style={styles.header}>
            <h1 className="mh-title">➕ Ajouter un souvenir</h1>
            <p className="mh-subtitle">Partagez un moment précieux avec votre famille</p>
          </div>

          <div className="mh-card" style={styles.formCard}>
            {mediaWarning && (
              <div style={{
                background: '#FFF3CD',
                border: '1px solid #E8C9A0',
                color: '#7A5035',
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                ⚠️ {mediaWarning}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={styles.formChamp}>
                <label style={styles.label}>Type de souvenir *</label>
                <div style={styles.typeSelector}>
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTypeChange(opt.value)}
                      style={form.type === opt.value ? { ...styles.typeBtn, ...styles.typeBtnActive } : styles.typeBtn}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formChamp}>
                <label style={styles.label}>Titre *</label>
                <input
                  type="text"
                  name="titre"
                  value={form.titre}
                  onChange={handleChange}
                  placeholder="Ex: Vacances à Lomé, Anniversaire de Grand-mère..."
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Date *</label>
                  <input
                    type="date"
                    name="date_souvenir"
                    value={form.date_souvenir}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Lieu</label>
                  <input
                    type="text"
                    name="lieu"
                    value={form.lieu}
                    onChange={handleChange}
                    placeholder="Ex: Lomé, Togo"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formChamp}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Racontez ce moment spécial..."
                  style={styles.textarea}
                />
              </div>

              {form.type !== 'TEXTE' && (
                <div style={styles.formChamp}>
                  <label style={styles.label}>
                    Fichiers (plusieurs possibles)
                    {typeOptions.find(o => o.value === form.type)?.multiple && 
                      <span style={{ fontSize: '11px', marginLeft: '8px', color: '#9B6240' }}>📁 Sélection multiple possible</span>
                    }
                  </label>
                  <div 
                    style={styles.uploadZone}
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    📁 Cliquez pour ajouter des fichiers (plusieurs à la fois)
                    <div style={{ fontSize: '12px', marginTop: '8px', color: '#B08060' }}>
                      Astuce : maintenez <strong>Ctrl</strong> enfoncé pour choisir plusieurs photos d’un coup.
                      Vous pouvez cliquer à nouveau pour en ajouter d’autres.
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#B08060' }}>
                      Formats : {form.type === 'PHOTO' ? 'JPG, PNG, GIF, WEBP' : form.type === 'AUDIO' ? 'MP3, WAV, OGG, M4A' : form.type === 'VIDEO' ? 'MP4, MOV, AVI' : ''}
                    </div>
                  </div>
                  <input
                    type="file"
                    id="fileInput"
                    multiple={typeOptions.find(o => o.value === form.type)?.multiple || false}
                    accept={typeOptions.find(o => o.value === form.type)?.accept}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  
                  {form.fichiers.length > 0 && (
                    <div style={styles.fileList}>
                      {form.fichiers.map((file, idx) => (
                        <div key={idx} style={styles.fileItem}>
                          <span style={styles.fileName}>
                            {file.name}
                          </span>
                          <button type="button" onClick={() => removeFile(idx)} style={styles.fileRemove}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={styles.formChamp}>
                <label style={styles.label}>Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="vacances, famille, anniversaire..."
                  style={styles.input}
                />
              </div>

              <button 
                type="submit" 
                className="mh-btn mh-btn-primary"
                style={{ ...(uploadProgress ? styles.btnSubmitDisabled : styles.btnSubmit), width: '100%' }}
                disabled={uploadProgress}
              >
                {uploadProgress
                  ? `📤 Envoi de ${form.fichiers.length} fichier(s)...`
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