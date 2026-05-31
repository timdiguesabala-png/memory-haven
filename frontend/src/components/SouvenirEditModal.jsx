import { useState } from 'react'
import api from '../services/api'
import { estAdmin } from '../lib/roles'

export default function SouvenirEditModal({ souvenir, utilisateur, onClose, onSaved }) {
  const [form, setForm] = useState({
    titre: souvenir.titre,
    description: souvenir.description || '',
    lieu: souvenir.lieu || '',
    date_souvenir: souvenir.date_souvenir ? String(souvenir.date_souvenir).slice(0, 10) : '',
    visibilite: souvenir.visibilite || 'FAMILLE'
  })
  const [saving, setSaving] = useState(false)

  const enregistrer = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/souvenirs/${souvenir.id}`, {
        titre: form.titre,
        description: form.description,
        lieu: form.lieu,
        date_souvenir: form.date_souvenir || undefined,
        visibilite: form.visibilite
      })
      onSaved?.()
      onClose()
    } catch (err) {
      alert(err.userMessage || err.response?.data?.message || 'Erreur modification')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mh-arbre-modal-root" role="presentation">
      <button type="button" className="mh-arbre-modal-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="mh-arbre-modal" role="dialog" aria-modal="true">
        <header className="mh-arbre-modal-head">
          <h2>Modifier le souvenir</h2>
          <button type="button" className="mh-arbre-modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        <form className="mh-arbre-modal-body" onSubmit={enregistrer}>
          <label className="mh-form-label">
            Titre *
            <input
              className="mh-input"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              required
            />
          </label>
          <label className="mh-form-label">
            Description
            <textarea
              className="mh-input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="mh-form-label">
            Lieu
            <input className="mh-input" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
          </label>
          <label className="mh-form-label">
            Date
            <input
              type="date"
              className="mh-input"
              value={form.date_souvenir}
              onChange={(e) => setForm({ ...form, date_souvenir: e.target.value })}
            />
          </label>
          {estAdmin(utilisateur?.role) && (
            <label className="mh-form-label">
              Visibilité
              <select
                className="mh-input"
                value={form.visibilite}
                onChange={(e) => setForm({ ...form, visibilite: e.target.value })}
              >
                <option value="FAMILLE">Toute la famille</option>
                <option value="MEMBRES_PROCHES">Membres proches</option>
                <option value="ADMINS">Administrateurs</option>
              </select>
            </label>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="submit" className="mh-btn mh-btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" className="mh-btn" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
