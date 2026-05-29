import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import {
  createCoupleRacine as apiCreateCoupleRacine,
  createUnion as apiCreateUnion,
  addEnfantToUnion as apiAddEnfantToUnion,
  checkArbreApiReady
} from '../services/arbreApi'
import AppLayout from '../components/AppLayout'
import ArbrePhotoPicker from '../components/ArbrePhotoPicker'
import ArbreGenealogique from '../components/ArbreGenealogique'
import {
  buildArbreForest,
  parseArbreResponse,
  GENRES,
  texteUnion,
  getMembreFromConjoint,
  filtrerEnfants,
  filtrerConjoints,
  filtrerPartenairesMariage,
  estConjoint,
  estEnfant
} from '../lib/arbreGenealogique'
import '../styles/arbre-genealogique.css'

const formVide = {
  nom: '',
  genre: 'NON_PRECISE',
  date_naissance: '',
  date_deces: '',
  biographie: ''
}

const formEpouseVide = {
  nom: '',
  genre: 'FEMME',
  date_naissance: '',
  date_deces: '',
  biographie: ''
}

const formCoupleRacineVide = {
  ancetre1_nom: '',
  ancetre1_genre: 'HOMME',
  ancetre2_nom: '',
  ancetre2_genre: 'FEMME',
  date_debut: ''
}

export default function Arbre() {
  const [membres, setMembres] = useState([])
  const [unions, setUnions] = useState([])
  const [loading, setLoading] = useState(true)
  const [membreSelec, setMembreSelec] = useState(null)
  const [modeForm, setModeForm] = useState(null)

  const [formPers, setFormPers] = useState(formVide)
  const [formEpouse, setFormEpouse] = useState(formEpouseVide)
  const [formUnion, setFormUnion] = useState({
    partenaire_id: '',
    conjoint_existant_id: '',
    date_debut: ''
  })
  const [formCoupleRacine, setFormCoupleRacine] = useState(formCoupleRacineVide)
  const [enfantPourUnion, setEnfantPourUnion] = useState('')
  const [nouvelEnfantInline, setNouvelEnfantInline] = useState(formVide)
  const [unionPourEnfant, setUnionPourEnfant] = useState('')
  const [apiArbreOk, setApiArbreOk] = useState(null)

  const listeEnfants = useMemo(() => filtrerEnfants(membres), [membres])
  const listeConjoints = useMemo(() => filtrerConjoints(membres), [membres])
  const partenairesMariage = useMemo(() => filtrerPartenairesMariage(membres), [membres])
  const forest = useMemo(() => buildArbreForest(membres, unions), [membres, unions])

  useEffect(() => {
    chargerArbre()
    checkArbreApiReady().then((info) => setApiArbreOk(info.ready))
  }, [])

  const messageErreurApi = (err, action = 'cette action') => {
    const status = err.response?.status
    if (status === 404) {
      return (
        `${action} impossible : l'API Railway n'est pas à jour (route /api/arbre/unions absente).\n\n` +
        'Redéployez le backend sur Railway, puis vérifiez https://memory-haven-api-production.up.railway.app/api/health ' +
        '(version attendue : 10-arbre-unions-postgresql).'
      )
    }
    return err.response?.data?.message || err.message || 'Erreur serveur'
  }

  const chargerArbre = async () => {
    try {
      setLoading(true)
      const rep = await api.get('/arbre')
      const { membres: m, unions: u } = parseArbreResponse(rep.data.data)
      setMembres(m)
      setUnions(u)
    } catch (err) {
      console.error('Erreur arbre:', err)
    } finally {
      setLoading(false)
    }
  }

  const apresPhotoMiseAJour = (updated) => {
    setMembres((prev) => prev.map((m) => (m.id === updated.id ? { ...m, photo_url: updated.photo_url } : m)))
    setMembreSelec((s) => (s?.id === updated.id ? { ...s, photo_url: updated.photo_url } : s))
  }

  const ajouterEnfant = async (e) => {
    e.preventDefault()
    try {
      await api.post('/arbre', {
        ...formPers,
        type_arbre: 'ENFANT',
        date_naissance: formPers.date_naissance || null,
        date_deces: formPers.date_deces || null,
        biographie: formPers.biographie || null
      })
      setFormPers(formVide)
      setModeForm(null)
      chargerArbre()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const ajouterConjointSeul = async (e) => {
    e.preventDefault()
    try {
      await api.post('/arbre', {
        ...formEpouse,
        type_arbre: 'CONJOINT',
        date_naissance: formEpouse.date_naissance || null,
        date_deces: formEpouse.date_deces || null,
        biographie: formEpouse.biographie || null
      })
      setFormEpouse(formEpouseVide)
      setModeForm(null)
      chargerArbre()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const creerMariage = async (e) => {
    e.preventDefault()
    const partenaireId = parseInt(formUnion.partenaire_id, 10)
    const conjointExistantId = parseInt(formUnion.conjoint_existant_id, 10)
    const aConjointNouveau = Boolean(formEpouse.nom?.trim())

    if (!partenaireId) {
      alert('Choisissez la personne de l\'arbre (enfant adulte ou aïeul).')
      return
    }

    if (!conjointExistantId && !aConjointNouveau) {
      alert('Choisissez un conjoint existant ou créez une nouvelle fiche conjoint.')
      return
    }
    try {
      await apiCreateUnion({
        conjoint_ids: [partenaireId, ...(conjointExistantId ? [conjointExistantId] : [])],
        nouveau_conjoint: aConjointNouveau
          ? {
              nom: formEpouse.nom.trim(),
              genre: formEpouse.genre,
              date_naissance: formEpouse.date_naissance || null,
              date_deces: formEpouse.date_deces || null,
              biographie: formEpouse.biographie || null
            }
          : undefined,
        date_debut: formUnion.date_debut || null
      })
      setFormUnion({ partenaire_id: '', conjoint_existant_id: '', date_debut: '' })
      setFormEpouse(formEpouseVide)
      setModeForm(null)
      chargerArbre()
    } catch (err) {
      alert(messageErreurApi(err, 'Création du mariage'))
    }
  }

  const creerCoupleRacine = async (e) => {
    e.preventDefault()
    try {
      await apiCreateCoupleRacine({
        ancetre1: {
          nom: formCoupleRacine.ancetre1_nom,
          genre: formCoupleRacine.ancetre1_genre
        },
        ancetre2: {
          nom: formCoupleRacine.ancetre2_nom,
          genre: formCoupleRacine.ancetre2_genre
        },
        date_debut: formCoupleRacine.date_debut || null
      })
      setFormCoupleRacine(formCoupleRacineVide)
      setModeForm(null)
      chargerArbre()
    } catch (err) {
      alert(messageErreurApi(err, 'Création du couple racine'))
    }
  }

  const modifierPersonne = async (e) => {
    e.preventDefault()
    if (!membreSelec) return
    try {
      const rep = await api.put(`/arbre/${membreSelec.id}`, {
        nom: formPers.nom,
        genre: formPers.genre,
        type_arbre: formPers.type_arbre,
        date_naissance: formPers.date_naissance || null,
        date_deces: formPers.date_deces || null,
        biographie: formPers.biographie || null
      })
      setMembreSelec(rep.data.data)
      setModeForm(null)
      chargerArbre()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const creerEnfantEtLier = async (e) => {
    e.preventDefault()
    const unionId = parseInt(unionPourEnfant, 10)
    if (!unionId) {
      alert('Choisissez le couple parent')
      return
    }
    try {
      const rep = await api.post('/arbre', {
        ...nouvelEnfantInline,
        type_arbre: 'ENFANT',
        date_naissance: nouvelEnfantInline.date_naissance || null,
        date_deces: nouvelEnfantInline.date_deces || null,
        biographie: nouvelEnfantInline.biographie || null
      })
      await apiAddEnfantToUnion(unionId, rep.data.data.id)
      setNouvelEnfantInline(formVide)
      setUnionPourEnfant('')
      setModeForm(null)
      chargerArbre()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const lierEnfantExistant = async (unionId) => {
    const enfantId = parseInt(enfantPourUnion, 10)
    if (!enfantId) return
    try {
      await apiAddEnfantToUnion(unionId, enfantId)
      setEnfantPourUnion('')
      chargerArbre()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const deplacerEnfant = async (unionId, enfantId, direction) => {
    const union = unions.find((u) => u.id === unionId)
    if (!union?.enfants) return
    const sorted = [...union.enfants].sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    const idx = sorted.findIndex((e) => (e.enfant?.id || e.enfant_id) === enfantId)
    const swap = idx + direction
    if (swap < 0 || swap >= sorted.length) return
    const items = sorted.map((e, i) => {
      let ordre = i
      if (i === idx) ordre = swap
      else if (i === swap) ordre = idx
      return { enfant_id: e.enfant?.id || e.enfant_id, ordre }
    })
    try {
      await api.put(`/arbre/unions/${unionId}/enfants/reorder`, { items })
      chargerArbre()
    } catch (err) {
      console.error(err)
    }
  }

  const supprimerMembre = async (id) => {
    if (!window.confirm('Supprimer cette personne de l\'arbre ?')) return
    try {
      await api.delete(`/arbre/${id}`)
      setMembreSelec(null)
      chargerArbre()
    } catch (err) {
      console.error(err)
    }
  }

  const supprimerUnion = async (unionId) => {
    if (!window.confirm('Supprimer ce mariage de l\'arbre ? (les personnes restent)')) return
    try {
      await api.delete(`/arbre/unions/${unionId}`)
      chargerArbre()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const unionsDuMembre = membreSelec
    ? unions.filter((u) => u.conjoints?.some((c) => getMembreFromConjoint(c).id === membreSelec.id))
    : []

  const ouvrirEdition = (m) => {
    setMembreSelec(m)
    setFormPers({
      nom: m.nom,
      genre: m.genre || 'NON_PRECISE',
      type_arbre: m.type_arbre || 'ENFANT',
      date_naissance: m.date_naissance ? m.date_naissance.slice(0, 10) : '',
      date_deces: m.date_deces ? m.date_deces.slice(0, 10) : '',
      biographie: m.biographie || ''
    })
    setModeForm('edit')
  }

  const ouvrirMariagePour = (m) => {
    setMembreSelec(m)
    setFormUnion({ partenaire_id: String(m.id), conjoint_existant_id: '', date_debut: '' })
    setFormEpouse({ ...formEpouseVide, genre: m.genre === 'HOMME' ? 'FEMME' : 'HOMME' })
    setModeForm('mariage')
  }

  const FormEpouse = ({ titre, required = false }) => (
    <>
      <h4 style={{ margin: '1rem 0 0.5rem', color: '#e87ab8', fontSize: '0.9rem' }}>{titre}</h4>
      <div className="mh-arbre-form-grid">
        <label>
          Nom de l&apos;époux / épouse *
          <input
            className="mh-input"
            value={formEpouse.nom}
            onChange={(e) => setFormEpouse({ ...formEpouse, nom: e.target.value })}
            placeholder="Ex: Afi Mensah"
            required={required}
          />
        </label>
        <label>
          Genre *
          <select
            className="mh-input"
            value={formEpouse.genre}
            onChange={(e) => setFormEpouse({ ...formEpouse, genre: e.target.value })}
          >
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.icon} {g.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Naissance
          <input
            type="date"
            className="mh-input"
            value={formEpouse.date_naissance}
            onChange={(e) => setFormEpouse({ ...formEpouse, date_naissance: e.target.value })}
          />
        </label>
        <label>
          Décès
          <input
            type="date"
            className="mh-input"
            value={formEpouse.date_deces}
            onChange={(e) => setFormEpouse({ ...formEpouse, date_deces: e.target.value })}
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Biographie / notes
          <textarea
            className="mh-input"
            rows={2}
            value={formEpouse.biographie}
            onChange={(e) => setFormEpouse({ ...formEpouse, biographie: e.target.value })}
            placeholder="Origine, profession, anecdotes…"
          />
        </label>
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
            <div className="mh-stat-num">{listeEnfants.length}</div>
            <div className="mh-stat-label">Enfants</div>
          </div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">{listeConjoints.length}</div>
            <div className="mh-stat-label">Époux / épouses</div>
          </div>
          <button
            type="button"
            className="mh-btn mh-btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => {
              setModeForm('enfant')
              setFormPers({ ...formVide, genre: 'NON_PRECISE' })
            }}
          >
            + Enfant
          </button>
          <button
            type="button"
            className="mh-btn"
            style={{ width: '100%', marginTop: '0.35rem' }}
            onClick={() => {
              setModeForm('conjoint')
              setFormEpouse(formEpouseVide)
            }}
          >
            + Fiche épouse / époux
          </button>
          <button
            type="button"
            className="mh-btn"
            style={{ width: '100%', marginTop: '0.35rem' }}
            onClick={() => {
              setModeForm('racine')
              setFormCoupleRacine(formCoupleRacineVide)
            }}
          >
            🌱 Couple racine
          </button>
          <button
            type="button"
            className="mh-btn"
            style={{ width: '100%', marginTop: '0.35rem' }}
            onClick={() => {
              setModeForm('mariage')
              setFormUnion({ partenaire_id: '', conjoint_existant_id: '', date_debut: '' })
              setFormEpouse(formEpouseVide)
            }}
          >
            💕 Marier (couple)
          </button>
          <button
            type="button"
            className="mh-btn"
            style={{ width: '100%', marginTop: '0.35rem' }}
            onClick={() => setModeForm('enfant-couple')}
          >
            + Enfant d&apos;un couple
          </button>
          {listeConjoints.length > 0 && (
            <>
              <div className="mh-side-label" style={{ marginTop: '0.75rem' }}>
                Époux / épouses
              </div>
              {listeConjoints.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="mh-side-item"
                  style={{ width: '100%', textAlign: 'left', marginBottom: 2 }}
                  onClick={() => {
                    setMembreSelec(c)
                    setModeForm(null)
                  }}
                >
                  {c.genre === 'FEMME' ? '♀' : c.genre === 'HOMME' ? '♂' : '○'} {c.nom}
                </button>
              ))}
            </>
          )}
        </>
      }
    >
      <div className="mh-arbre-page">
        <h1 className="mh-title">Arbre généalogique</h1>
        <p className="mh-arbre-intro">
          Couple racine en haut, enfants en dessous, conjoints reliés par l&apos;icône d&apos;union (∞).
          Cliquez sur un portrait pour le mettre en avant. Renseignez la biographie pour afficher un sous-titre
          (titre, rôle, note…).
        </p>

        {apiArbreOk === false && (
          <div
            className="mh-form-alert mh-form-alert--warning"
            style={{ marginBottom: '1rem', textAlign: 'left' }}
          >
            <strong>API pas à jour.</strong> Les mariages ne fonctionneront pas tant que Railway n&apos;a
            pas redéployé le backend. Ouvrez{' '}
            <a
              href="https://memory-haven-api-production.up.railway.app/api/health"
              target="_blank"
              rel="noreferrer"
            >
              /api/health
            </a>{' '}
            : la version doit être <code>10-arbre-unions-postgresql</code>.
          </div>
        )}

        {modeForm === 'racine' && (
          <div className="mh-arbre-form-panel">
            <h3>🌱 Créer le couple racine (aïeux)</h3>
            <p style={{ fontSize: '0.85rem', color: '#a89ec4', margin: '0 0 0.75rem' }}>
              Ce couple devient la base de l&apos;arbre. Ensuite vous ajoutez leurs enfants, puis les
              conjoints de ces enfants, puis les générations suivantes.
            </p>
            <form onSubmit={creerCoupleRacine} className="mh-arbre-form-grid">
              <label>
                Aïeul 1 *
                <input
                  className="mh-input"
                  value={formCoupleRacine.ancetre1_nom}
                  onChange={(e) =>
                    setFormCoupleRacine({ ...formCoupleRacine, ancetre1_nom: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Genre aïeul 1
                <select
                  className="mh-input"
                  value={formCoupleRacine.ancetre1_genre}
                  onChange={(e) =>
                    setFormCoupleRacine({ ...formCoupleRacine, ancetre1_genre: e.target.value })
                  }
                >
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.icon} {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Aïeul 2 *
                <input
                  className="mh-input"
                  value={formCoupleRacine.ancetre2_nom}
                  onChange={(e) =>
                    setFormCoupleRacine({ ...formCoupleRacine, ancetre2_nom: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Genre aïeul 2
                <select
                  className="mh-input"
                  value={formCoupleRacine.ancetre2_genre}
                  onChange={(e) =>
                    setFormCoupleRacine({ ...formCoupleRacine, ancetre2_genre: e.target.value })
                  }
                >
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.icon} {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date du mariage
                <input
                  type="date"
                  className="mh-input"
                  value={formCoupleRacine.date_debut}
                  onChange={(e) =>
                    setFormCoupleRacine({ ...formCoupleRacine, date_debut: e.target.value })
                  }
                />
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="mh-btn mh-btn-primary">
                  Créer le couple racine
                </button>
                <button type="button" className="mh-btn" onClick={() => setModeForm(null)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {modeForm === 'enfant' && (
          <div className="mh-arbre-form-panel">
            <h3>+ Ajouter un enfant</h3>
            <form onSubmit={ajouterEnfant} className="mh-arbre-form-grid">
              <label>
                Nom *
                <input
                  className="mh-input"
                  value={formPers.nom}
                  onChange={(e) => setFormPers({ ...formPers, nom: e.target.value })}
                  required
                />
              </label>
              <label>
                Genre
                <select
                  className="mh-input"
                  value={formPers.genre}
                  onChange={(e) => setFormPers({ ...formPers, genre: e.target.value })}
                >
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.icon} {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Naissance
                <input
                  type="date"
                  className="mh-input"
                  value={formPers.date_naissance}
                  onChange={(e) => setFormPers({ ...formPers, date_naissance: e.target.value })}
                />
              </label>
              <label>
                Décès
                <input
                  type="date"
                  className="mh-input"
                  value={formPers.date_deces}
                  onChange={(e) => setFormPers({ ...formPers, date_deces: e.target.value })}
                />
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="mh-btn mh-btn-primary">
                  Ajouter l&apos;enfant
                </button>
                <button type="button" className="mh-btn" onClick={() => setModeForm(null)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {modeForm === 'conjoint' && (
          <div className="mh-arbre-form-panel">
            <h3>+ Fiche époux / épouse</h3>
            <p style={{ fontSize: '0.85rem', color: '#a89ec4', margin: '0 0 0.75rem' }}>
              Identité propre de l&apos;épouse ou de l&apos;époux — ensuite utilisez « Marier » pour lier au
              conjoint.
            </p>
            <form onSubmit={ajouterConjointSeul}>
              <FormEpouse titre="Informations de l'époux / de l'épouse" required />
              <button type="submit" className="mh-btn mh-btn-primary">
                Enregistrer la fiche
              </button>
              <button type="button" className="mh-btn" onClick={() => setModeForm(null)} style={{ marginLeft: 8 }}>
                Annuler
              </button>
            </form>
          </div>
        )}

        {modeForm === 'mariage' && (
          <div className="mh-arbre-form-panel">
            <h3>💕 Mariage — ils se sont mariés</h3>
            <form onSubmit={creerMariage}>
              <label>
                Personne dans l&apos;arbre (père, mère, enfant adulte…) *
                <select
                  className="mh-input"
                  value={formUnion.partenaire_id}
                  onChange={(e) => setFormUnion({ ...formUnion, partenaire_id: e.target.value })}
                >
                  <option value="">— Choisir —</option>
                  {partenairesMariage.map((m) => (
                    <option key={m.id} value={m.id}>
                      {estEnfant(m) ? '👶' : '👤'} {m.nom}
                      {estEnfant(m) ? ' (enfant)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Conjoint existant (optionnel)
                <select
                  className="mh-input"
                  value={formUnion.conjoint_existant_id}
                  onChange={(e) =>
                    setFormUnion({ ...formUnion, conjoint_existant_id: e.target.value })
                  }
                >
                  <option value="">— Aucun (créer une nouvelle fiche) —</option>
                  {listeConjoints
                    .filter((c) => String(c.id) !== formUnion.partenaire_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.genre === 'FEMME' ? '♀' : c.genre === 'HOMME' ? '♂' : '○'} {c.nom}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Date du mariage
                <input
                  type="date"
                  className="mh-input"
                  value={formUnion.date_debut}
                  onChange={(e) => setFormUnion({ ...formUnion, date_debut: e.target.value })}
                />
              </label>
              <FormEpouse
                titre="Fiche de l'époux / de l'épouse (pas un enfant)"
                required={!formUnion.conjoint_existant_id}
              />
              <p style={{ fontSize: '0.8rem', color: '#a89ec4' }}>
                Vous pouvez soit choisir un conjoint existant, soit créer une nouvelle fiche conjoint.
                Pour plusieurs unions (plusieurs conjoints), créez un mariage séparé par couple.
              </p>
              <button type="submit" className="mh-btn mh-btn-primary">
                Enregistrer le mariage
              </button>
              <button type="button" className="mh-btn" onClick={() => setModeForm(null)} style={{ marginLeft: 8 }}>
                Annuler
              </button>
            </form>
          </div>
        )}

        {modeForm === 'enfant-couple' && (
          <div className="mh-arbre-form-panel">
            <h3>+ Enfant d&apos;un couple</h3>
            <form onSubmit={creerEnfantEtLier}>
              <label>
                Couple parent *
                <select
                  className="mh-input"
                  value={unionPourEnfant}
                  onChange={(e) => setUnionPourEnfant(e.target.value)}
                  required
                >
                  <option value="">— Mariage —</option>
                  {unions.map((u) => {
                    const noms = (u.conjoints || []).map((c) => getMembreFromConjoint(c).nom).join(' ♥ ')
                    return (
                      <option key={u.id} value={u.id}>
                        {noms || `Union #${u.id}`}
                      </option>
                    )
                  })}
                </select>
              </label>
              <div className="mh-arbre-form-grid">
                <label>
                  Nom de l&apos;enfant *
                  <input
                    className="mh-input"
                    value={nouvelEnfantInline.nom}
                    onChange={(e) => setNouvelEnfantInline({ ...nouvelEnfantInline, nom: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Genre
                  <select
                    className="mh-input"
                    value={nouvelEnfantInline.genre}
                    onChange={(e) =>
                      setNouvelEnfantInline({ ...nouvelEnfantInline, genre: e.target.value })
                    }
                  >
                    {GENRES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.icon} {g.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" className="mh-btn mh-btn-primary">
                Ajouter et lier au couple
              </button>
              <button type="button" className="mh-btn" onClick={() => setModeForm(null)} style={{ marginLeft: 8 }}>
                Annuler
              </button>
            </form>
          </div>
        )}

        {modeForm === 'edit' && membreSelec && (
          <div className="mh-arbre-form-panel">
            <h3>Modifier — {membreSelec.nom}</h3>
            <form onSubmit={modifierPersonne} className="mh-arbre-form-grid">
              <label>
                Nom
                <input
                  className="mh-input"
                  value={formPers.nom}
                  onChange={(e) => setFormPers({ ...formPers, nom: e.target.value })}
                  required
                />
              </label>
              <label>
                Rôle dans l&apos;arbre
                <select
                  className="mh-input"
                  value={formPers.type_arbre}
                  onChange={(e) => setFormPers({ ...formPers, type_arbre: e.target.value })}
                >
                  <option value="ENFANT">Enfant</option>
                  <option value="CONJOINT">Époux / Épouse</option>
                  <option value="ASCENDANT">Aïeul (racine)</option>
                </select>
              </label>
              <label>
                Genre
                <select
                  className="mh-input"
                  value={formPers.genre}
                  onChange={(e) => setFormPers({ ...formPers, genre: e.target.value })}
                >
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.icon} {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Naissance
                <input
                  type="date"
                  className="mh-input"
                  value={formPers.date_naissance}
                  onChange={(e) => setFormPers({ ...formPers, date_naissance: e.target.value })}
                />
              </label>
              <label>
                Décès
                <input
                  type="date"
                  className="mh-input"
                  value={formPers.date_deces}
                  onChange={(e) => setFormPers({ ...formPers, date_deces: e.target.value })}
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Biographie
                <textarea
                  className="mh-input"
                  rows={2}
                  value={formPers.biographie}
                  onChange={(e) => setFormPers({ ...formPers, biographie: e.target.value })}
                />
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="mh-btn mh-btn-primary">
                  Enregistrer
                </button>
                <button type="button" className="mh-btn" onClick={() => setModeForm(null)}>
                  Fermer
                </button>
              </div>
            </form>
          </div>
        )}

        {membreSelec && modeForm !== 'edit' && (
          <div className="mh-arbre-fiche">
            <ArbrePhotoPicker membre={membreSelec} size={64} onUpdated={apresPhotoMiseAJour} />
            <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>
              {membreSelec.nom}
              <span style={{ fontSize: '0.75rem', color: '#a89ec4', marginLeft: 8 }}>
                {estEnfant(membreSelec) ? 'Enfant' : estConjoint(membreSelec) ? 'Époux/Épouse' : ''}
              </span>
            </p>
            <div className="mh-arbre-fiche-actions">
              <button type="button" className="mh-btn mh-btn-primary" onClick={() => ouvrirEdition(membreSelec)}>
                ✏️ Modifier
              </button>
              {(estEnfant(membreSelec) || membreSelec.type_arbre === 'ASCENDANT') && (
                <button type="button" className="mh-btn" onClick={() => ouvrirMariagePour(membreSelec)}>
                  💕 Ajouter épouse / mariage
                </button>
              )}
              <button
                type="button"
                className="mh-btn"
                style={{ color: '#ff8a7a' }}
                onClick={() => supprimerMembre(membreSelec.id)}
              >
                Supprimer
              </button>
            </div>

            {unionsDuMembre.map((u) => {
              const conjoints = (u.conjoints || []).map(getMembreFromConjoint)
              return (
                <div key={u.id} style={{ marginTop: '1rem', borderTop: '1px solid rgba(139,124,240,0.2)', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#e87ab8' }}>{texteUnion(conjoints)}</p>
                  <button
                    type="button"
                    className="mh-btn"
                    style={{ fontSize: '0.75rem', marginTop: 4 }}
                    onClick={() => supprimerUnion(u.id)}
                  >
                    Supprimer ce mariage
                  </button>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                    Rattacher un enfant existant :
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                      <select
                        className="mh-input"
                        style={{ flex: 1 }}
                        value={enfantPourUnion}
                        onChange={(e) => setEnfantPourUnion(e.target.value)}
                      >
                        <option value="">— Enfant —</option>
                        {listeEnfants.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nom}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="mh-btn mh-btn-primary"
                        onClick={() => lierEnfantExistant(u.id)}
                      >
                        Lier
                      </button>
                    </div>
                  </label>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
                    {[...(u.enfants || [])]
                      .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
                      .map((e) => {
                        const enfant = e.enfant || listeEnfants.find((m) => m.id === e.enfant_id)
                        if (!enfant) return null
                        return (
                          <li
                            key={enfant.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
                          >
                            <button
                              type="button"
                              className="mh-btn"
                              style={{ padding: '2px 6px' }}
                              onClick={() => deplacerEnfant(u.id, enfant.id, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="mh-btn"
                              style={{ padding: '2px 6px' }}
                              onClick={() => deplacerEnfant(u.id, enfant.id, 1)}
                            >
                              ↓
                            </button>
                            <span>👶 {enfant.nom}</span>
                          </li>
                        )
                      })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {loading ? (
          <p className="mh-feed-loading">Chargement…</p>
        ) : membres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '3rem' }}>🌳</p>
            <p>Commencez par un couple (aïeux) ou un enfant.</p>
          </div>
        ) : (
          <ArbreGenealogique
            forest={forest}
            membres={membres}
            unions={unions}
            selectedId={membreSelec?.id}
            onSelect={(m) => {
              setMembreSelec(m)
              setModeForm(null)
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
