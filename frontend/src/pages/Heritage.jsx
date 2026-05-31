import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { fetchHeritage, createHeritage, deleteHeritage } from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'

const TYPES = [
  { id: 'STORY', label: 'Histoires', icon: '📖' },
  { id: 'TRADITION', label: 'Traditions', icon: '🎭' },
  { id: 'RECIPE', label: 'Recettes', icon: '🍲' },
  { id: 'DOCUMENT', label: 'Documents', icon: '📎' },
  { id: 'ARCHIVE', label: 'Archives', icon: '🗄️' },
  { id: 'TESTIMONY', label: 'Témoignages', icon: '🎙️' }
]

export default function Heritage() {
  const lectureSeule = !peutEcrire(getStoredUser()?.role)
  const [type, setType] = useState('STORY')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titre: '', contenu: '', media_url: '' })
  const [showForm, setShowForm] = useState(false)

  const charger = async () => {
    setLoading(true)
    try {
      setItems(await fetchHeritage(type))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [type])

  const submit = async (e) => {
    e.preventDefault()
    await createHeritage({ ...form, type })
    setForm({ titre: '', contenu: '', media_url: '' })
    setShowForm(false)
    charger()
  }

  return (
    <AppLayout activePath="/heritage">
      <div className="mh-platform-page fade-in-up">
        <div className="mh-platform-hero">
          <h1>Héritage familial</h1>
          <p>Histoires, traditions, recettes et archives transmises de génération en génération.</p>
        </div>

        <div className="mh-platform-tabs">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`mh-platform-tab ${type === t.id ? 'mh-platform-tab--active' : ''}`}
              onClick={() => setType(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {!lectureSeule && (
          <button type="button" className="mh-btn mh-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        )}

        {showForm && !lectureSeule && (
          <form className="mh-platform-form" onSubmit={submit}>
            <label className="mh-label">
              Titre
              <input className="mh-input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
            </label>
            <label className="mh-label">
              Contenu
              <textarea className="mh-input" rows={4} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} />
            </label>
            <label className="mh-label">
              Lien média (photo, audio, vidéo)
              <input className="mh-input" value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} placeholder="URL optionnelle" />
            </label>
            <button type="submit" className="mh-btn mh-btn-primary">Enregistrer</button>
          </form>
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : items.length === 0 ? (
          <p className="mh-platform-card">Aucun élément dans cette catégorie.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="mh-platform-card">
              <h3>{item.titre}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                Par {item.auteur?.prenom} {item.auteur?.nom} ·{' '}
                {new Date(item.created_at).toLocaleDateString('fr-FR')}
              </p>
              {item.contenu && <p>{item.contenu}</p>}
              {item.media_url && (
                <img src={item.media_url} alt="" style={{ maxWidth: '100%', borderRadius: 12, marginTop: 8 }} />
              )}
              {item.audio_url && <audio controls src={item.audio_url} style={{ width: '100%', marginTop: 8 }} />}
              {item.video_url && <video controls src={item.video_url} style={{ width: '100%', marginTop: 8, borderRadius: 12 }} />}
              {!lectureSeule && (
                <button type="button" className="mh-btn mh-btn-ghost-danger" style={{ marginTop: 8 }} onClick={() => deleteHeritage(item.id).then(charger)}>
                  Supprimer
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </AppLayout>
  )
}
