import { useState, useEffect, useRef, useCallback } from 'react'
import '../styles/arbre-genealogique.css'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import AppLayout from '../components/AppLayout'
import UserAvatar from '../components/UserAvatar'
import ArbrePhotoPicker from '../components/ArbrePhotoPicker'
import {
  getArbreMemberInitials,
  getArbreMemberPhoto
} from '../services/arbreApi'

const ARBRE_FONT_KEY = 'mh-arbre-font-size'
const ARBRE_FONT_MIN = 9
const ARBRE_FONT_MAX = 24
const ARBRE_FONT_DEFAULT = 13

function readArbreFontSize() {
  const v = parseInt(localStorage.getItem(ARBRE_FONT_KEY), 10)
  if (Number.isFinite(v) && v >= ARBRE_FONT_MIN && v <= ARBRE_FONT_MAX) return v
  return ARBRE_FONT_DEFAULT
}

const formVide = () => ({
  nom: '',
  date_naissance: '',
  date_deces: '',
  biographie: '',
  parent_id: ''
})

export default function Arbre() {
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()

  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [membreSelec, setMembreSelec] = useState(null)
  const [modeEdition, setModeEdition] = useState(false)
  const [form, setForm] = useState(formVide())
  const [formEdit, setFormEdit] = useState(formVide())
  const [zoom, setZoom] = useState(0.75)
  const [fontSize, setFontSize] = useState(readArbreFontSize)
  const scrollRef = useRef(null)
  const innerRef = useRef(null)

  const canvasFontStyle = {
    '--mh-arbre-font-nom': `${fontSize}px`,
    '--mh-arbre-font-annees': `${Math.max(ARBRE_FONT_MIN, Math.round(fontSize * 0.82))}px`
  }

  const changeFontSize = (next) => {
    const clamped = Math.min(ARBRE_FONT_MAX, Math.max(ARBRE_FONT_MIN, next))
    setFontSize(clamped)
    localStorage.setItem(ARBRE_FONT_KEY, String(clamped))
  }

  const fitToView = useCallback(() => {
    const scroll = scrollRef.current
    const inner = innerRef.current
    if (!scroll || !inner) return
    const pad = 24
    const sw = scroll.clientWidth - pad
    const sh = scroll.clientHeight - pad
    const iw = inner.offsetWidth
    const ih = inner.offsetHeight
    if (!iw || !sh) return
    const scaleW = sw / iw
    const scaleH = sh / ih
    const next = Math.min(1, scaleW, scaleH)
    setZoom(Math.max(0.35, Math.min(1, next)))
  }, [])

  useEffect(() => {
    if (loading || membres.length === 0) return
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(fitToView)
    })
    return () => cancelAnimationFrame(t)
  }, [loading, membres.length, fitToView])

  useEffect(() => {
    if (loading || membres.length === 0) return
    const t = requestAnimationFrame(() => requestAnimationFrame(fitToView))
    return () => cancelAnimationFrame(t)
  }, [fontSize, loading, membres.length, fitToView])

  const styles = {
    main: { flex: 1, padding: 0 },
    header: { marginBottom: '1.5rem' },
    alert: {
      background: darkMode ? '#3a2020' : '#fde8e8',
      border: `1px solid ${darkMode ? '#804040' : '#e8a0a0'}`,
      color: darkMode ? '#ffb0b0' : '#803030',
      padding: '0.65rem 1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '0.88rem'
    },
    formCard: {
      background: darkMode ? '#221F32' : 'var(--mh-surface, #faf6f0)',
      border: `1px solid ${darkMode ? '#7B6BB8' : '#e0d0bc'}`,
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1.5rem'
    },
    formTitre: { fontSize: '16px', marginBottom: '1rem' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    formChamp: { marginBottom: '10px' },
    label: { display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '500' },
    input: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1.5px solid ${darkMode ? '#7B6BB8' : '#e0d0bc'}`,
      fontSize: '13px',
      background: darkMode ? '#12101A' : '#fff',
      color: darkMode ? '#e0e0e0' : 'inherit',
      outline: 'none',
      boxSizing: 'border-box'
    },
    btnSubmit: {
      background: '#8b6340',
      color: '#FFF',
      border: 'none',
      padding: '9px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500'
    },
    loading: { textAlign: 'center', padding: '3rem' },
    vide: { textAlign: 'center', padding: '4rem' },
    fichePhoto: { display: 'flex', justifyContent: 'center', marginBottom: '10px' },
    noeudSurface: {
      background: darkMode ? '#1A1828' : '#faf6f0',
      border: `1px solid ${darkMode ? '#7B6BB8' : '#e0d0bc'}`
    },
    ficheHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '0.5rem' },
    ficheLigne: { fontSize: '13px', marginBottom: '4px' },
    ficheActions: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' },
    btnFiche: {
      background: '#8b6340',
      color: '#FFF',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    btnFicheSecondaire: {
      background: 'transparent',
      color: 'inherit',
      border: `1px solid ${darkMode ? '#7B6BB8' : '#e0d0bc'}`,
      padding: '6px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    btnSupprimerFiche: { background: 'none', border: 'none', color: '#C06060', cursor: 'pointer', fontSize: '12px' }
  }

  useEffect(() => {
    chargerArbre()
  }, [])

  const messageErreur = (err, fallback = 'Une erreur est survenue') => {
    return err.response?.data?.message || err.message || fallback
  }

  const chargerArbre = async () => {
    try {
      setLoading(true)
      setErreur('')
      const rep = await api.get('/arbre')
      setMembres(rep.data.data)
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de charger l\'arbre'))
    } finally {
      setLoading(false)
    }
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
        parent_id: form.parent_id || null
      })
      setForm(formVide())
      setShowForm(false)
      chargerArbre()
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible d\'ajouter le membre'))
    }
  }

  const ouvrirEdition = (membre) => {
    setFormEdit({
      nom: membre.nom,
      date_naissance: membre.date_naissance ? membre.date_naissance.slice(0, 10) : '',
      date_deces: membre.date_deces ? membre.date_deces.slice(0, 10) : '',
      biographie: membre.biographie || '',
      parent_id: membre.parent_id ? String(membre.parent_id) : ''
    })
    setModeEdition(true)
  }

  const modifierMembre = async (e) => {
    e.preventDefault()
    if (!membreSelec) return
    try {
      setErreur('')
      await api.put(`/arbre/${membreSelec.id}`, {
        nom: formEdit.nom,
        date_naissance: formEdit.date_naissance || null,
        date_deces: formEdit.date_deces || null,
        biographie: formEdit.biographie || null,
        parent_id: formEdit.parent_id || null
      })
      setModeEdition(false)
      setMembreSelec(null)
      chargerArbre()
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de modifier le membre'))
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
      chargerArbre()
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de supprimer le membre'))
    }
  }

  const racines = membres.filter((m) => !m.parent_id)
  const enfants = (parentId) => membres.filter((m) => m.parent_id === parentId)

  const afficherAnnees = (membre) => {
    const naissance = membre.date_naissance ? new Date(membre.date_naissance).getFullYear() : null
    const deces = membre.date_deces ? new Date(membre.date_deces).getFullYear() : null
    if (naissance && deces) return `${naissance} - ${deces}`
    if (naissance && !deces) return `Né(e) en ${naissance}`
    return ''
  }

  const couleurs = [
    { bg: '#C5B8E0', color: '#3D3268' },
    { bg: '#C8D8E8', color: '#203060' },
    { bg: '#C8E0C8', color: '#2A6030' },
    { bg: '#E8C8D8', color: '#601840' },
    { bg: '#D8C8E0', color: '#402060' }
  ]

  const apresPhotoMiseAJour = (updated) => {
    setMembres((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, photo_url: updated.photo_url } : m))
    )
    setMembreSelec((s) =>
      s?.id === updated.id ? { ...s, photo_url: updated.photo_url } : s
    )
  }

  const parentsDisponibles = (membreId) =>
    membres.filter((m) => m.id !== membreId)

  const selectionnerMembre = (membre) => {
    if (membreSelec?.id === membre.id) {
      setMembreSelec(null)
      setModeEdition(false)
    } else {
      setMembreSelec(membre)
      setModeEdition(false)
    }
  }

  const NoeudArbre = ({ membre, niveau }) => {
    const sesEnfants = enfants(membre.id)
    const couleur = couleurs[niveau % couleurs.length]
    const selected = membreSelec?.id === membre.id

    return (
      <div className="mh-arbre-noeud-wrap">
        <div
          className={`mh-arbre-noeud ${selected ? 'mh-arbre-noeud--selected' : ''}`}
          style={styles.noeudSurface}
          onClick={() => selectionnerMembre(membre)}
          title={membre.nom}
        >
          <UserAvatar
            initials={getArbreMemberInitials(membre.nom)}
            avatarUrl={getArbreMemberPhoto(membre)}
            size={32}
            className="mh-arbre-noeud-photo"
            fallbackStyle={{ background: couleur.bg, color: couleur.color }}
          />
          <div className="mh-arbre-noeud-text">
            <div className="mh-arbre-noeud-nom">{membre.nom}</div>
            {afficherAnnees(membre) && (
              <div className="mh-arbre-noeud-annees">{afficherAnnees(membre)}</div>
            )}
          </div>
        </div>

        {sesEnfants.length > 0 && (
          <div className="mh-arbre-enfants-wrap">
            <div className="mh-arbre-ligne-v" />
            <div className="mh-arbre-enfants-row">
              {sesEnfants.map((enfant) => (
                <NoeudArbre key={enfant.id} membre={enfant} niveau={niveau + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFichePanel = () => {
    if (!membreSelec) return null
    const membre = membreSelec

    return (
      <div className="mh-arbre-fiche-panel">
        {modeEdition ? (
          <form onSubmit={modifierMembre}>
            <h4 style={{ margin: '0 0 0.75rem' }}>Modifier {membre.nom}</h4>
            <div style={styles.formChamp}>
              <label style={styles.label}>Nom *</label>
              <input
                value={formEdit.nom}
                onChange={(e) => setFormEdit({ ...formEdit, nom: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formChamp}>
              <label style={styles.label}>Parent</label>
              <select
                value={formEdit.parent_id}
                onChange={(e) => setFormEdit({ ...formEdit, parent_id: e.target.value })}
                style={styles.input}
              >
                <option value="">Aucun (racine)</option>
                {parentsDisponibles(membre.id).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formChamp}>
                <label style={styles.label}>Naissance</label>
                <input
                  type="date"
                  value={formEdit.date_naissance}
                  onChange={(e) => setFormEdit({ ...formEdit, date_naissance: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formChamp}>
                <label style={styles.label}>Décès</label>
                <input
                  type="date"
                  value={formEdit.date_deces}
                  onChange={(e) => setFormEdit({ ...formEdit, date_deces: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formChamp}>
              <label style={styles.label}>Biographie</label>
              <textarea
                value={formEdit.biographie}
                onChange={(e) => setFormEdit({ ...formEdit, biographie: e.target.value })}
                style={{ ...styles.input, height: '60px', resize: 'vertical' }}
              />
            </div>
            <div style={styles.ficheActions}>
              <button type="submit" style={styles.btnFiche}>
                Enregistrer
              </button>
              <button
                type="button"
                style={styles.btnFicheSecondaire}
                onClick={() => setModeEdition(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={styles.fichePhoto}>
              <ArbrePhotoPicker membre={membre} size={72} onUpdated={apresPhotoMiseAJour} />
            </div>
            <div style={styles.ficheHeader}>
              <strong>{membre.nom}</strong>
              <button
                type="button"
                onClick={() => supprimerMembre(membre)}
                style={styles.btnSupprimerFiche}
              >
                🗑️
              </button>
            </div>
            {membre.date_naissance && (
              <p style={styles.ficheLigne}>
                📅 Naissance : {new Date(membre.date_naissance).toLocaleDateString('fr-FR')}
              </p>
            )}
            {membre.date_deces && (
              <p style={styles.ficheLigne}>
                ⚰️ Décès : {new Date(membre.date_deces).toLocaleDateString('fr-FR')}
              </p>
            )}
            {membre.biographie && <p style={styles.ficheLigne}>📖 {membre.biographie}</p>}
            <div style={styles.ficheActions}>
              <button type="button" onClick={() => ouvrirEdition(membre)} style={styles.btnFicheSecondaire}>
                ✏️ Modifier
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...formVide(), parent_id: String(membre.id) })
                  setShowForm(true)
                  setMembreSelec(null)
                }}
                style={styles.btnFiche}
              >
                + Enfant
              </button>
              <button
                type="button"
                style={styles.btnFicheSecondaire}
                onClick={() => setMembreSelec(null)}
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <AppLayout
      activePath="/arbre"
      sidebar={
        <>
          <div className="mh-side-label">Stats</div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">{membres.length}</div>
            <div className="mh-stat-label">Membres</div>
          </div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">{racines.length}</div>
            <div className="mh-stat-label">Racines</div>
          </div>
          <button
            type="button"
            className="mh-btn mh-btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </>
      }
    >
      <div className="mh-arbre-page" style={styles.main}>
        <div style={styles.header}>
          <h1 className="mh-title">🌳 Arbre généalogique</h1>
          <p className="mh-subtitle">
            {membres.length} membre{membres.length > 1 ? 's' : ''} · {utilisateur.famille}
          </p>
          <p className="mh-subtitle" style={{ marginTop: '0.35rem' }}>
            Pincez ou faites défiler l’arbre · bouton « Voir tout » pour l’ajuster à l’écran.
          </p>
        </div>

        {erreur && <div style={styles.alert}>{erreur}</div>}

        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitre}>Ajouter un membre</h3>
            <form onSubmit={ajouterMembre}>
              <div style={styles.formRow}>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Nom complet *</label>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Kodjo Koffi"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Parent (optionnel)</label>
                  <select
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">Aucun (racine)</option>
                    {membres.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Date de naissance</label>
                  <input
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) => setForm({ ...form, date_naissance: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Date de décès</label>
                  <input
                    type="date"
                    value={form.date_deces}
                    onChange={(e) => setForm({ ...form, date_deces: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formChamp}>
                <label style={styles.label}>Biographie</label>
                <textarea
                  value={form.biographie}
                  onChange={(e) => setForm({ ...form, biographie: e.target.value })}
                  placeholder="Quelques mots..."
                  style={{ ...styles.input, height: '70px', resize: 'vertical' }}
                />
              </div>
              <button type="submit" style={styles.btnSubmit}>
                Ajouter à l&apos;arbre
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : membres.length === 0 ? (
          <div style={styles.vide}>
            <p style={{ fontSize: '48px' }}>🌳</p>
            <p>L&apos;arbre est vide — ajoutez votre premier membre !</p>
            <button
              type="button"
              className="mh-btn mh-btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setShowForm(true)}
            >
              + Ajouter un membre
            </button>
          </div>
        ) : (
          <>
            <div className="mh-arbre-zoom-bar">
              <button
                type="button"
                className="mh-arbre-zoom-btn"
                aria-label="Réduire"
                onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.1).toFixed(2)))}
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="mh-arbre-zoom-btn"
                aria-label="Agrandir"
                onClick={() => setZoom((z) => Math.min(1.25, +(z + 0.1).toFixed(2)))}
              >
                +
              </button>
              <button type="button" className="mh-arbre-zoom-btn mh-arbre-zoom-btn--primary" onClick={fitToView}>
                Voir tout
              </button>
              <div className="mh-arbre-font-control">
                <span className="mh-arbre-font-label">Texte</span>
                <button
                  type="button"
                  className="mh-arbre-zoom-btn"
                  aria-label="Réduire le texte"
                  onClick={() => changeFontSize(fontSize - 1)}
                >
                  A−
                </button>
                <input
                  type="range"
                  className="mh-arbre-font-slider"
                  min={ARBRE_FONT_MIN}
                  max={ARBRE_FONT_MAX}
                  value={fontSize}
                  aria-label="Taille du texte de l'arbre"
                  onChange={(e) => changeFontSize(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="mh-arbre-zoom-btn"
                  aria-label="Agrandir le texte"
                  onClick={() => changeFontSize(fontSize + 1)}
                >
                  A+
                </button>
                <span className="mh-arbre-font-value">{fontSize}px</span>
              </div>
            </div>
            <div className="mh-arbre-scroll" ref={scrollRef}>
              <div
                className="mh-arbre-canvas-inner"
                ref={innerRef}
                style={{ transform: `scale(${zoom})`, ...canvasFontStyle }}
              >
                <div className="mh-arbre-tree">
                  {racines.map((racine) => (
                    <NoeudArbre key={racine.id} membre={racine} niveau={0} />
                  ))}
                </div>
              </div>
            </div>
            {renderFichePanel()}
          </>
        )}
      </div>
    </AppLayout>
  )
}
