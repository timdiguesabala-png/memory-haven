import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { fetchCapsules, createCapsule, updateCapsule, deleteCapsule } from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import { peutModifierContenuAuteur } from '../lib/contentOwnership'
import PlatformLocalNotice from '../components/PlatformLocalNotice'

function CapsuleCard({ capsule, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    titre: capsule.titre,
    message: capsule.message || '',
    date_ouverture: capsule.date_ouverture?.slice?.(0, 10) || capsule.date_ouverture
  })
  const [saving, setSaving] = useState(false)
  const ouverte = capsule.ouverte || new Date(capsule.date_ouverture) <= new Date()
  const canEdit = peutModifierContenuAuteur(capsule) && !ouverte

  const enregistrer = async () => {
    setSaving(true)
    try {
      await updateCapsule(capsule.id, draft)
      setEditing(false)
      onChanged()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible de modifier')
    } finally {
      setSaving(false)
    }
  }

  const supprimer = async () => {
    if (!window.confirm('Supprimer cette capsule ?')) return
    try {
      await deleteCapsule(capsule.id)
      onChanged()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible de supprimer')
    }
  }

  return (
    <article className="mh-platform-card mh-temoignage-card">
      {editing ? (
        <>
          <label className="mh-label">
            Titre
            <input
              className="mh-input"
              value={draft.titre}
              onChange={(e) => setDraft({ ...draft, titre: e.target.value })}
              required
            />
          </label>
          <label className="mh-label">
            Message
            <textarea
              className="mh-input"
              rows={3}
              value={draft.message}
              onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            />
          </label>
          <label className="mh-label">
            Date d&apos;ouverture
            <input
              type="date"
              className="mh-input"
              value={draft.date_ouverture}
              onChange={(e) => setDraft({ ...draft, date_ouverture: e.target.value })}
              required
            />
          </label>
          <div className="mh-temoignage-actions">
            <button type="button" className="mh-btn mh-btn-primary" disabled={saving} onClick={enregistrer}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" className="mh-btn mh-btn-secondary" onClick={() => setEditing(false)}>
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>
            {ouverte ? '🔓' : '🔒'} {capsule.titre}
          </h3>
          <p className="mh-temoignage-meta">
            Ouverture : {new Date(capsule.date_ouverture).toLocaleDateString('fr-FR')} · Par{' '}
            {capsule.auteur?.prenom} {capsule.auteur?.nom}
          </p>
          {ouverte ? (
            <p>{capsule.message || 'Capsule ouverte.'}</p>
          ) : (
            <p style={{ fontStyle: 'italic', color: 'var(--text-soft)' }}>
              Contenu scellé jusqu&apos;à la date d&apos;ouverture.
            </p>
          )}
          {peutModifierContenuAuteur(capsule) && (
            <div className="mh-temoignage-actions">
              {canEdit && (
                <button type="button" className="mh-btn mh-btn-secondary" onClick={() => setEditing(true)}>
                  Modifier
                </button>
              )}
              <button type="button" className="mh-btn mh-btn-ghost-danger" onClick={supprimer}>
                Supprimer
              </button>
            </div>
          )}
        </>
      )}
    </article>
  )
}

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
              <input
                className="mh-input"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                required
              />
            </label>
            <label className="mh-label">
              Message
              <textarea
                className="mh-input"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </label>
            <label className="mh-label">
              Date d&apos;ouverture
              <input
                type="date"
                className="mh-input"
                value={form.date_ouverture}
                onChange={(e) => setForm({ ...form, date_ouverture: e.target.value })}
                required
              />
            </label>
            <button type="submit" className="mh-btn mh-btn-primary">
              Sceller la capsule
            </button>
          </form>
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : capsules.length === 0 ? (
          <p className="mh-platform-card">Aucune capsule pour le moment.</p>
        ) : (
          capsules.map((c) => <CapsuleCard key={c.id} capsule={c} onChanged={charger} />)
        )}
      </div>
    </AppLayout>
  )
}
