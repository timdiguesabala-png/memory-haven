import { useState, useEffect, useCallback } from 'react'
import '../styles/arbre-genealogique.css'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import ArbrePhotoPicker from '../components/ArbrePhotoPicker'
import ArbreGenealogyFlow from '../components/arbre/ArbreGenealogyFlow'
import ArbreFlowErrorBoundary from '../components/arbre/ArbreFlowErrorBoundary'
import { peutEcrire } from '../lib/roles'
import { genreLabel } from '../lib/arbreFlowLayout'
import { appBuildLabel } from '../lib/appVersion'
import {
  ARBRE_CARD_SIZES,
  migrateArbreCardSize,
  saveArbreCardSize
} from '../lib/arbreCardSize'
const CONFIRM_VIDER = 'EFFACER'
const POSITIONS_CACHE_PREFIX = 'mh-arbre-positions-'

const formVide = (extra = {}) => ({
  nom: '',
  date_naissance: '',
  date_deces: '',
  biographie: '',
  parent_id: '',
  genre: 'NON_PRECISE',
  type_arbre: 'ENFANT',
  ...extra
})

export default function Arbre() {
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const ecriture = peutEcrire(utilisateur.role)

  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [layoutKey, setLayoutKey] = useState(0)
  const [membreSelec, setMembreSelec] = useState(null)
  const [modeEdition, setModeEdition] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(formVide())
  const [formEdit, setFormEdit] = useState(formVide())
  const [showPhotoPanel, setShowPhotoPanel] = useState(false)
  const [viderEnCours, setViderEnCours] = useState(false)
  const [cardSize, setCardSize] = useState(() =>
    migrateArbreCardSize(utilisateur.famille_id)
  )

  useEffect(() => {
    document.body.classList.add('mh-arbre-flow-active')
    return () => document.body.classList.remove('mh-arbre-flow-active')
  }, [])

  useEffect(() => {
    chargerArbre()
  }, [])

  useEffect(() => {
    const fid = utilisateur.famille_id
    if (fid) {
      try {
        localStorage.removeItem(`${POSITIONS_CACHE_PREFIX}${fid}`)
      } catch {
        /* ignore */
      }
    }
  }, [utilisateur.famille_id])

  const messageErreur = (err, fallback = 'Une erreur est survenue') =>
    err.response?.data?.message || err.message || fallback

  const chargerArbre = async () => {
    try {
      setLoading(true)
      setErreur('')
      const rep = await api.get('/arbre')
      const list = Array.isArray(rep.data?.data) ? rep.data.data : []
      setMembres(list)
      setLayoutKey((k) => k + 1)
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de charger l'arbre"))
    } finally {
      setLoading(false)
    }
  }

  const bumpLayout = () => setLayoutKey((k) => k + 1)

  const changerTailleCartes = (size) => {
    if (!ARBRE_CARD_SIZES[size]) return
    setCardSize(size)
    saveArbreCardSize(utilisateur.famille_id, size)
    bumpLayout()
  }

  const apresPhotoMiseAJour = (updated) => {
    setMembres((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, photo_url: updated.photo_url } : m))
    )
    setMembreSelec((s) => (s?.id === updated.id ? { ...s, photo_url: updated.photo_url } : s))
    bumpLayout()
  }

  const ouvrirPhoto = useCallback((membre) => {
    setMembreSelec(membre)
    setModeEdition(false)
    setShowPhotoPanel(true)
  }, [])

  const selectionner = useCallback((membre) => {
    setMembreSelec(membre)
    setModeEdition(false)
    setShowPhotoPanel(false)
  }, [])

  const ouvrirAjout = (preset = {}) => {
    setForm(formVide(preset))
    setShowForm(true)
    setMembreSelec(null)
    setModeEdition(false)
  }

  const ouvrirAjoutEnfant = (parent) => {
    ouvrirAjout({
      parent_id: String(parent.id),
      type_arbre: 'ENFANT'
    })
  }

  const ouvrirAjoutConjoint = (membre) => {
    ouvrirAjout({
      parent_id: String(membre.id),
      type_arbre: 'CONJOINT',
      genre: 'NON_PRECISE'
    })
  }

  const ouvrirEdition = (membre) => {
    setFormEdit({
      nom: membre.nom,
      date_naissance: membre.date_naissance ? membre.date_naissance.slice(0, 10) : '',
      date_deces: membre.date_deces ? membre.date_deces.slice(0, 10) : '',
      biographie: membre.biographie || '',
      parent_id: membre.parent_id ? String(membre.parent_id) : '',
      genre: membre.genre || 'NON_PRECISE',
      type_arbre: membre.type_arbre || 'ENFANT'
    })
    setModeEdition(true)
    setShowPhotoPanel(false)
  }

  const ajouterMembre = async (e) => {
    e.preventDefault()
    try {
      setErreur('')
      await api.post('/arbre', {
        nom: form.nom,
        date_naissance: form.date_naissance || null,
        date_deces: form.date_deces || null,
        biographie: form.biographie || null,
        parent_id: form.parent_id || null,
        genre: form.genre,
        type_arbre: form.type_arbre
      })
      setShowForm(false)
      setForm(formVide())
      await chargerArbre()
    } catch (err) {
      setErreur(messageErreur(err, "Impossible d'ajouter le membre"))
    }
  }

  const modifierMembre = async (e) => {
    e.preventDefault()
    if (!membreSelec) return
    try {
      setErreur('')
      const payload = {
        nom: formEdit.nom,
        date_naissance: formEdit.date_naissance || null,
        date_deces: formEdit.date_deces || null,
        biographie: formEdit.biographie || null,
        genre: formEdit.genre,
        type_arbre: formEdit.type_arbre
      }
      if (formEdit.type_arbre !== 'CONJOINT') {
        payload.parent_id = formEdit.parent_id || null
      }
      await api.put(`/arbre/${membreSelec.id}`, payload)
      setModeEdition(false)
      setMembreSelec(null)
      await chargerArbre()
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de modifier le membre'))
    }
  }

  const viderArbre = async () => {
    if (!membres.length) return
    if (
      !window.confirm(
        `Supprimer les ${membres.length} membre(s) de l'arbre ?\n\nCette action est définitive pour votre famille.`
      )
    ) {
      return
    }
    const saisie = window.prompt(
      `Tapez ${CONFIRM_VIDER} pour confirmer la suppression de tout l'arbre :`
    )
    if (saisie?.trim().toUpperCase() !== CONFIRM_VIDER) return

    try {
      setViderEnCours(true)
      setErreur('')
      await api.delete('/arbre/vider')
      setMembreSelec(null)
      setModeEdition(false)
      setShowForm(false)
      await chargerArbre()
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de vider l'arbre"))
    } finally {
      setViderEnCours(false)
    }
  }

  const supprimerMembre = async (membre) => {
    const nbEnfants = membres.filter((m) => m.parent_id === membre.id).length
    const msg =
      nbEnfants > 0
        ? `Supprimer ${membre.nom} ? Ses ${nbEnfants} enfant(s) deviendront des racines.`
        : `Supprimer ${membre.nom} ?`
    if (!window.confirm(msg)) return
    try {
      setErreur('')
      await api.delete(`/arbre/${membre.id}`)
      setMembreSelec(null)
      setModeEdition(false)
      await chargerArbre()
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de supprimer le membre'))
    }
  }

  const parentsDisponibles = (membreId) => membres.filter((m) => m.id !== membreId)
  const racines = membres.filter((m) => !m.parent_id && m.type_arbre !== 'CONJOINT')

  const inputCls = 'mh-arbre-flow-input'
  const labelCls = 'mh-arbre-flow-label'

  const renderFormFields = (values, setValues, membreId = null) => (
    <>
      <div className="mh-arbre-flow-field">
        <label className={labelCls}>Nom complet *</label>
        <input
          className={inputCls}
          value={values.nom}
          onChange={(e) => setValues({ ...values, nom: e.target.value })}
          required
        />
      </div>
      <div className="mh-arbre-flow-field-row">
        <div className="mh-arbre-flow-field">
          <label className={labelCls}>Sexe</label>
          <select
            className={inputCls}
            value={values.genre}
            onChange={(e) => setValues({ ...values, genre: e.target.value })}
          >
            <option value="NON_PRECISE">Non précisé</option>
            <option value="HOMME">Homme</option>
            <option value="FEMME">Femme</option>
          </select>
        </div>
        {values.type_arbre !== 'CONJOINT' && (
          <div className="mh-arbre-flow-field">
            <label className={labelCls}>Parent</label>
            <select
              className={inputCls}
              value={values.parent_id}
              onChange={(e) => setValues({ ...values, parent_id: e.target.value })}
            >
              <option value="">— Racine —</option>
              {parentsDisponibles(membreId).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="mh-arbre-flow-field-row">
        <div className="mh-arbre-flow-field">
          <label className={labelCls}>Naissance</label>
          <input
            type="date"
            className={inputCls}
            value={values.date_naissance}
            onChange={(e) => setValues({ ...values, date_naissance: e.target.value })}
          />
        </div>
        <div className="mh-arbre-flow-field">
          <label className={labelCls}>Décès</label>
          <input
            type="date"
            className={inputCls}
            value={values.date_deces}
            onChange={(e) => setValues({ ...values, date_deces: e.target.value })}
          />
        </div>
      </div>
      <div className="mh-arbre-flow-field">
        <label className={labelCls}>Biographie</label>
        <textarea
          className={inputCls}
          rows={3}
          value={values.biographie}
          onChange={(e) => setValues({ ...values, biographie: e.target.value })}
        />
      </div>
    </>
  )

  return (
    <AppLayout
      activePath="/arbre"
      sidebar={
        <>
          <div className="mh-side-label">Arbre</div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">{membres.length}</div>
            <div className="mh-stat-label">Membres</div>
          </div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">{racines.length}</div>
            <div className="mh-stat-label">Racines</div>
          </div>
          {membres.length > 0 && (
            <>
              <div className="mh-side-label" style={{ marginTop: '0.5rem' }}>
                Taille des cartes
              </div>
              <div className="mh-arbre-size-picker" role="group" aria-label="Taille des cartes">
                {Object.entries(ARBRE_CARD_SIZES).map(([key, def]) => (
                  <button
                    key={key}
                    type="button"
                    className={`mh-arbre-size-btn ${cardSize === key ? 'mh-arbre-size-btn--active' : ''}`}
                    onClick={() => changerTailleCartes(key)}
                    aria-pressed={cardSize === key}
                  >
                    {def.label}
                  </button>
                ))}
              </div>
              <p className="mh-arbre-side-hint">
                Racine au centre, conjoint ♥. Cartes agrandies — choisissez la taille ci-dessus.
              </p>
            </>
          )}
          {ecriture && (
            <>
              <button
                type="button"
                className="mh-btn mh-btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => ouvrirAjout()}
              >
                + Personne
              </button>
              {membres.length > 0 && (
                <button
                  type="button"
                  className="mh-btn mh-arbre-btn-vider"
                  style={{ width: '100%', marginTop: '0.45rem' }}
                  disabled={viderEnCours}
                  onClick={viderArbre}
                >
                  {viderEnCours ? 'Suppression…' : 'Effacer tout l\'arbre'}
                </button>
              )}
            </>
          )}
        </>
      }
    >
      <div className="mh-arbre-page--flow">
        {erreur && (
          <div className="mh-arbre-flow-toast" role="alert">
            {erreur}
            <button type="button" onClick={() => setErreur('')} aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        {!loading && membres.length > 0 && (
          <div className="mh-arbre-build-badge" title="Version affichée — si ancienne, rechargez la page">
            {appBuildLabel()}
          </div>
        )}

        {loading ? (
          <div className="mh-arbre-flow-loading">
            <span className="mh-arbre-flow-loading-spinner" aria-hidden />
            Chargement de l&apos;arbre…
          </div>
        ) : membres.length === 0 ? (
          <div className="mh-arbre-flow-empty">
            <p className="mh-arbre-flow-empty-icon" aria-hidden>
              🌳
            </p>
            <p>Aucun membre — commencez votre arbre.</p>
            {ecriture && (
              <button type="button" className="mh-btn mh-btn-primary" onClick={() => ouvrirAjout()}>
                + Premier membre
              </button>
            )}
          </div>
        ) : (
          <ArbreFlowErrorBoundary key={layoutKey}>
            <ArbreGenealogyFlow
              membres={membres}
              selectedId={membreSelec?.id}
              onSelectPerson={selectionner}
              onPhotoClick={ecriture ? ouvrirPhoto : undefined}
              canEdit={ecriture}
              layoutKey={layoutKey}
              cardSize={cardSize}
            />
          </ArbreFlowErrorBoundary>
        )}

        {membreSelec && !showForm && (
          <aside className="mh-arbre-flow-fiche" aria-label="Fiche personne">
            <header className="mh-arbre-flow-fiche-head">
              <h2>{membreSelec.nom}</h2>
              <button
                type="button"
                className="mh-arbre-flow-fiche-close"
                onClick={() => {
                  setMembreSelec(null)
                  setModeEdition(false)
                  setShowPhotoPanel(false)
                }}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            {modeEdition ? (
              <form className="mh-arbre-flow-fiche-body" onSubmit={modifierMembre}>
                {renderFormFields(formEdit, setFormEdit, membreSelec.id)}
                <div className="mh-arbre-flow-fiche-actions">
                  <button type="submit" className="mh-btn mh-btn-primary">
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    className="mh-btn mh-btn-ghost"
                    onClick={() => setModeEdition(false)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="mh-arbre-flow-fiche-body">
                {showPhotoPanel ? (
                  <ArbrePhotoPicker
                    membre={membreSelec}
                    size={88}
                    onUpdated={apresPhotoMiseAJour}
                  />
                ) : (
                  <div className="mh-arbre-flow-fiche-summary">
                    <p>
                      <strong>Sexe :</strong> {genreLabel(membreSelec.genre)}
                    </p>
                    {membreSelec.date_naissance && (
                      <p>
                        <strong>Naissance :</strong>{' '}
                        {new Date(membreSelec.date_naissance).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {membreSelec.date_deces && (
                      <p>
                        <strong>Décès :</strong>{' '}
                        {new Date(membreSelec.date_deces).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {membreSelec.biographie && <p>{membreSelec.biographie}</p>}
                  </div>
                )}

                {ecriture && (
                  <nav className="mh-arbre-flow-fiche-menu" aria-label="Actions">
                    <button type="button" onClick={() => ouvrirEdition(membreSelec)}>
                      ✏️ Modifier
                    </button>
                    <button type="button" onClick={() => setShowPhotoPanel(true)}>
                      📷 Changer la photo
                    </button>
                    <button type="button" onClick={() => ouvrirAjoutEnfant(membreSelec)}>
                      + Enfant
                    </button>
                    <button type="button" onClick={() => ouvrirAjoutConjoint(membreSelec)}>
                      + Conjoint
                    </button>
                    <button
                      type="button"
                      className="mh-arbre-flow-fiche-danger"
                      onClick={() => supprimerMembre(membreSelec)}
                    >
                      Supprimer
                    </button>
                  </nav>
                )}
              </div>
            )}
          </aside>
        )}

        {showForm && ecriture && (
          <div className="mh-arbre-modal-root" role="dialog" aria-modal="true">
            <button
              type="button"
              className="mh-arbre-modal-backdrop"
              aria-label="Fermer"
              onClick={() => setShowForm(false)}
            />
            <div className="mh-arbre-modal">
              <header className="mh-arbre-modal-head">
                <h2>
                  {form.type_arbre === 'CONJOINT'
                    ? 'Ajouter un conjoint'
                    : form.parent_id
                      ? 'Ajouter un enfant'
                      : 'Ajouter une personne'}
                </h2>
                <button
                  type="button"
                  className="mh-arbre-modal-close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>
              </header>
              <form className="mh-arbre-modal-body" onSubmit={ajouterMembre}>
                {renderFormFields(form, setForm)}
                <button type="submit" className="mh-btn mh-btn-primary" style={{ marginTop: '0.75rem' }}>
                  Ajouter
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
