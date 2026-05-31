import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import {
  fetchHommage,
  postHommageMessage,
  updateHommageMessage,
  deleteHommageMessage
} from '../lib/platformApi'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import { peutModifierContenuAuteur } from '../lib/contentOwnership'
import PlatformLocalNotice from '../components/PlatformLocalNotice'

function TemoignageCard({ hommage, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(hommage.contenu)
  const [saving, setSaving] = useState(false)
  const canEdit = peutModifierContenuAuteur(hommage)

  const enregistrer = async () => {
    if (!draft.trim()) return
    setSaving(true)
    try {
      await updateHommageMessage(hommage.id, { contenu: draft.trim() })
      setEditing(false)
      onChanged()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible de modifier')
    } finally {
      setSaving(false)
    }
  }

  const supprimer = async () => {
    if (!window.confirm('Supprimer ce témoignage ?')) return
    try {
      await deleteHommageMessage(hommage.id)
      onChanged()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Impossible de supprimer')
    }
  }

  return (
    <div className="mh-platform-card mh-temoignage-card">
      {editing ? (
        <>
          <textarea
            className="mh-input"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mh-temoignage-actions">
            <button type="button" className="mh-btn mh-btn-primary" disabled={saving} onClick={enregistrer}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              className="mh-btn mh-btn-secondary"
              onClick={() => {
                setDraft(hommage.contenu)
                setEditing(false)
              }}
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          <p>{hommage.contenu}</p>
          <p className="mh-temoignage-meta">
            — {hommage.auteur?.prenom} {hommage.auteur?.nom}
            {hommage.created_at &&
              ` · ${new Date(hommage.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}`}
          </p>
          {canEdit && (
            <div className="mh-temoignage-actions">
              <button type="button" className="mh-btn mh-btn-secondary" onClick={() => setEditing(true)}>
                Modifier
              </button>
              <button type="button" className="mh-btn mh-btn-ghost-danger" onClick={supprimer}>
                Supprimer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Hommage() {
  const navigate = useNavigate()
  const utilisateur = getStoredUser()
  const lectureSeule = !peutEcrire(utilisateur?.role)
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState(null)

  const charger = async () => {
    setLoading(true)
    try {
      const data = await fetchHommage()
      setMembres(data)
      if (data.length && selected == null) setSelected(data[0].id)
    } catch {
      setMembres([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const envoyer = async (e) => {
    e.preventDefault()
    if (!selected || !message.trim()) return
    try {
      await postHommageMessage(selected, { contenu: message.trim() })
      setMessage('')
      charger()
    } catch (err) {
      alert(err.response?.data?.message || err.userMessage || 'Impossible d’envoyer le message')
    }
  }

  const actif = membres.find((m) => m.id === selected)

  return (
    <AppLayout activePath="/hommage">
      <div className="mh-platform-page fade-in-up">
        <div className="mh-platform-hero">
          <h1>Espace hommage</h1>
          <p>Biographies, photos, témoignages et messages commémoratifs pour nos proches disparus.</p>
        </div>
        <PlatformLocalNotice />

        {loading ? (
          <p>Chargement…</p>
        ) : membres.length === 0 ? (
          <p className="mh-platform-card">
            Aucun membre avec date de décès dans l&apos;arbre. Ajoutez une date de décès dans l&apos;arbre
            généalogique pour activer cet espace.
          </p>
        ) : (
          <>
            <div className="mh-platform-tabs">
              {membres.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`mh-platform-tab ${selected === m.id ? 'mh-platform-tab--active' : ''}`}
                  onClick={() => setSelected(m.id)}
                >
                  🕯️ {m.nom}
                </button>
              ))}
            </div>

            {actif && (
              <>
                <div className="mh-platform-card">
                  <h3>{actif.nom}</h3>
                  {actif.biographie && <p>{actif.biographie}</p>}
                  {actif.date_deces && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                      {actif.date_naissance &&
                        `${new Date(actif.date_naissance).getFullYear()} – `}
                      {new Date(actif.date_deces).getFullYear()}
                    </p>
                  )}
                  {actif.photo_url && (
                    <img src={actif.photo_url} alt="" style={{ maxWidth: 200, borderRadius: 12, marginTop: 8 }} />
                  )}
                </div>

                <h2 className="mh-section-subtitle">Témoignages</h2>
                {(actif.hommages || []).length === 0 && (
                  <p className="mh-platform-card">Aucun témoignage pour le moment.</p>
                )}
                {(actif.hommages || []).map((h) => (
                  <TemoignageCard key={h.id} hommage={h} onChanged={charger} />
                ))}

                {!lectureSeule && (
                  <form className="mh-platform-form" onSubmit={envoyer}>
                    <label className="mh-label">
                      Message commémoratif
                      <textarea
                        className="mh-input"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </label>
                    <button type="submit" className="mh-btn mh-btn-primary">
                      Publier
                    </button>
                  </form>
                )}

                {actif.souvenirs?.length > 0 && (
                  <>
                    <h2 className="mh-section-subtitle">Souvenirs associés</h2>
                    <ul className="mh-platform-list">
                      {actif.souvenirs.map((s) => (
                        <li key={s.id} className="mh-platform-list-item">
                          <button type="button" onClick={() => navigate(`/dashboard?souvenir=${s.id}`)}>
                            {s.titre} ({new Date(s.date_souvenir).getFullYear()})
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
