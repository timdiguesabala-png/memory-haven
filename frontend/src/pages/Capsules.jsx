import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { fetchCapsules, createCapsule } from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import PlatformLocalNotice from '../components/PlatformLocalNotice'

export default function Capsules() {
  const lectureSeule = !peutEcrire(getStoredUser()?.role)
  const [capsules, setCapsules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', message: '', date_ouverture: '' })

  const charger = async () => {
    setLoading(true)
    try {
      setCapsules(await fetchCapsules())
    } catch {
      setCapsules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await createCapsule(form)
      setForm({ titre: '', message: '', date_ouverture: '' })
      setShowForm(false)
      charger()
    } catch (err) {
      alert(err.response?.data?.message || err.userMessage || 'Impossible de créer la capsule')
    }
  }

  return (
    <AppLayout activePath="/capsules">
      <div className="mh-platform-page fade-in-up">
        <div className="mh-platform-hero">
          <h1>Capsules temporelles</h1>
          <p>Messages, photos et vidéos programmés pour s&apos;ouvrir dans le futur.</p>
        </div>
        <PlatformLocalNotice />

        {!lectureSeule && (
          <button type="button" className="mh-btn mh-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Créer une capsule'}
          </button>
        )}

        {showForm && !lectureSeule && (
          <form className="mh-platform-form" onSubmit={submit}>
            <label className="mh-label">
              Titre
              <input className="mh-input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
            </label>
            <label className="mh-label">
              Message
              <textarea className="mh-input" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
            <label className="mh-label">
              Date d&apos;ouverture
              <input type="date" className="mh-input" value={form.date_ouverture} onChange={(e) => setForm({ ...form, date_ouverture: e.target.value })} required />
            </label>
            <button type="submit" className="mh-btn mh-btn-primary">Sceller la capsule</button>
          </form>
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : capsules.length === 0 ? (
          <p className="mh-platform-card">Aucune capsule pour le moment.</p>
        ) : (
          capsules.map((c) => {
            const ouverte = c.ouverte || new Date(c.date_ouverture) <= new Date()
            return (
              <article key={c.id} className="mh-platform-card">
                <h3>
                  {ouverte ? '🔓' : '🔒'} {c.titre}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                  Ouverture : {new Date(c.date_ouverture).toLocaleDateString('fr-FR')} · Par {c.auteur?.prenom}
                </p>
                {ouverte ? (
                  <p>{c.message || 'Capsule ouverte.'}</p>
                ) : (
                  <p style={{ fontStyle: 'italic', color: 'var(--text-soft)' }}>Contenu scellé jusqu&apos;à la date d&apos;ouverture.</p>
                )}
              </article>
            )
          })
        )}
      </div>
    </AppLayout>
  )
}
