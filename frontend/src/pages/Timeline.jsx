import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { fetchTimeline, createEvenement } from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import PlatformLocalNotice from '../components/PlatformLocalNotice'

const KIND_LABELS = {
  NAISSANCE: '👶 Naissance',
  DECES: '🕯️',
  MARIAGE: '💍 Mariage',
  EVENEMENT: '📅 Événement',
  SOUVENIR: '💜 Souvenir',
  AUTRE: '📌'
}

export default function Timeline() {
  const lectureSeule = !peutEcrire(getStoredUser()?.role)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', type: 'VOYAGE', date_debut: '', lieu: '' })

  const charger = async () => {
    setLoading(true)
    try {
      setEvents(await fetchTimeline())
    } catch {
      setEvents([])
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
      await createEvenement(form)
      setShowForm(false)
      setForm({ titre: '', type: 'VOYAGE', date_debut: '', lieu: '' })
      charger()
    } catch (err) {
      alert(err.response?.data?.message || err.userMessage || 'Impossible d’enregistrer l’événement')
    }
  }

  return (
    <AppLayout activePath="/timeline">
      <div className="mh-platform-page fade-in-up">
        <div className="mh-platform-hero">
          <h1>Chronologie familiale</h1>
          <p>Naissances, mariages, voyages, diplômes et événements marquants de votre histoire.</p>
        </div>
        <PlatformLocalNotice />

        {!lectureSeule && (
          <button type="button" className="mh-btn mh-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter un événement'}
          </button>
        )}

        {showForm && !lectureSeule && (
          <form className="mh-platform-form" onSubmit={submit}>
            <label className="mh-label">
              Titre
              <input className="mh-input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
            </label>
            <label className="mh-label">
              Type
              <select className="mh-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="VOYAGE">Voyage</option>
                <option value="DIPLOME">Diplôme</option>
                <option value="DEMENAGEMENT">Déménagement</option>
                <option value="MARIAGE">Mariage</option>
                <option value="AUTRE">Autre</option>
              </select>
            </label>
            <label className="mh-label">
              Date
              <input type="date" className="mh-input" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} required />
            </label>
            <label className="mh-label">
              Lieu
              <input className="mh-input" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
            </label>
            <button type="submit" className="mh-btn mh-btn-primary">Enregistrer</button>
          </form>
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : (
          <div className="mh-timeline">
            {events.map((ev, i) => (
              <div key={`${ev.kind}-${ev.ref_id}-${i}`} className="mh-timeline-item" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="mh-timeline-date">
                  {new Date(ev.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {ev.lieu && ` · ${ev.lieu}`}
                </div>
                <div className="mh-timeline-title">
                  {KIND_LABELS[ev.kind] || ev.kind} {ev.titre}
                </div>
              </div>
            ))}
            {!events.length && <p>Aucun événement enregistré.</p>}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
