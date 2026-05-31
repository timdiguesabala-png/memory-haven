import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { fetchTimeline, createEvenement, updateEvenement, deleteEvenement } from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import { peutModifierContenuAuteur } from '../lib/contentOwnership'
import PlatformLocalNotice from '../components/PlatformLocalNotice'

const KIND_LABELS = {
  NAISSANCE: '👶 Naissance',
  DECES: '🕯️',
  MARIAGE: '💍 Mariage',
  EVENEMENT: '📅 Événement',
  SOUVENIR: '💜 Souvenir',
  VOYAGE: '✈️ Voyage',
  DIPLOME: '🎓 Diplôme',
  DEMENAGEMENT: '🏠 Déménagement',
  AUTRE: '📌'
}

function TimelineEventItem({ ev, editingId, editForm, setEditForm, onEdit, onCancelEdit, onSave, onDelete }) {
  const editable = ev.source === 'evenement' && peutModifierContenuAuteur(ev)
  const isEditing = editingId === ev.ref_id

  if (isEditing) {
    return (
      <div className="mh-timeline-item mh-timeline-item--editing">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(ev.ref_id)
          }}
        >
          <label className="mh-label">
            Titre
            <input
              className="mh-input"
              value={editForm.titre}
              onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
              required
            />
          </label>
          <label className="mh-label">
            Type
            <select
              className="mh-input"
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            >
              <option value="VOYAGE">Voyage</option>
              <option value="DIPLOME">Diplôme</option>
              <option value="DEMENAGEMENT">Déménagement</option>
              <option value="MARIAGE">Mariage</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>
          <label className="mh-label">
            Date
            <input
              type="date"
              className="mh-input"
              value={editForm.date_debut}
              onChange={(e) => setEditForm({ ...editForm, date_debut: e.target.value })}
              required
            />
          </label>
          <label className="mh-label">
            Lieu
            <input
              className="mh-input"
              value={editForm.lieu}
              onChange={(e) => setEditForm({ ...editForm, lieu: e.target.value })}
            />
          </label>
          <div className="mh-temoignage-actions">
            <button type="submit" className="mh-btn mh-btn-primary">
              Enregistrer
            </button>
            <button type="button" className="mh-btn mh-btn-secondary" onClick={onCancelEdit}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mh-timeline-item" style={{ animationDelay: `${ev._index * 0.03}s` }}>
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
      {editable && (
        <div className="mh-temoignage-actions">
          <button type="button" className="mh-btn mh-btn-secondary" onClick={() => onEdit(ev)}>
            Modifier
          </button>
          <button type="button" className="mh-btn mh-btn-ghost-danger" onClick={() => onDelete(ev.ref_id)}>
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

export default function Timeline() {
  const lectureSeule = !peutEcrire(getStoredUser()?.role)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', type: 'VOYAGE', date_debut: '', lieu: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ titre: '', type: 'VOYAGE', date_debut: '', lieu: '' })

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

  const demarrerEdition = (ev) => {
    setEditingId(ev.ref_id)
    setEditForm({
      titre: ev.titre,
      type: ev.kind || 'AUTRE',
      date_debut: ev.date?.slice?.(0, 10) || ev.date,
      lieu: ev.lieu || ''
    })
  }

  const enregistrerEdition = async (id) => {
    try {
      await updateEvenement(id, editForm)
      setEditingId(null)
      charger()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible de modifier')
    }
  }

  const supprimerEvent = async (id) => {
    if (!window.confirm('Supprimer cet événement ?')) return
    try {
      await deleteEvenement(id)
      if (editingId === id) setEditingId(null)
      charger()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible de supprimer')
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
              <input
                className="mh-input"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                required
              />
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
              <input
                type="date"
                className="mh-input"
                value={form.date_debut}
                onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                required
              />
            </label>
            <label className="mh-label">
              Lieu
              <input className="mh-input" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
            </label>
            <button type="submit" className="mh-btn mh-btn-primary">
              Enregistrer
            </button>
          </form>
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : (
          <div className="mh-timeline">
            {events.map((ev, i) => (
              <TimelineEventItem
                key={`${ev.kind}-${ev.ref_id}-${i}`}
                ev={{ ...ev, _index: i }}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={demarrerEdition}
                onCancelEdit={() => setEditingId(null)}
                onSave={enregistrerEdition}
                onDelete={supprimerEvent}
              />
            ))}
            {!events.length && <p>Aucun événement enregistré.</p>}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
