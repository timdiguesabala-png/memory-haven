import { useState, useEffect } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import SouvenirCard from '../components/SouvenirCard'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'

export default function Recherche() {
  const utilisateur = getStoredUser()
  const [souvenirs, setSouvenirs] = useState([])
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtres, setFiltres] = useState({
    type: 'TOUS',
    dateDebut: '',
    dateFin: '',
    lieu: ''
  })

  useEffect(() => {
    chargerSouvenirs()
  }, [])

  const chargerSouvenirs = async () => {
    try {
      setLoading(true)
      setErreur('')
      const rep = await api.get('/souvenirs')
      setSouvenirs(rep.data.data)
      setResultats(rep.data.data)
    } catch (err) {
      setErreur(err.userMessage || 'Impossible de charger les souvenirs')
    } finally {
      setLoading(false)
    }
  }

  const rechercher = () => {
    let results = [...souvenirs]

    if (recherche.trim()) {
      const searchLower = recherche.toLowerCase()
      results = results.filter(
        (s) =>
          s.titre.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.lieu?.toLowerCase().includes(searchLower) ||
          s.auteur?.prenom?.toLowerCase().includes(searchLower) ||
          s.auteur?.nom?.toLowerCase().includes(searchLower)
      )
    }

    if (filtres.type !== 'TOUS') {
      results = results.filter((s) => s.type === filtres.type)
    }

    if (filtres.dateDebut) {
      const debut = new Date(filtres.dateDebut)
      results = results.filter((s) => new Date(s.date_souvenir) >= debut)
    }

    if (filtres.dateFin) {
      const fin = new Date(filtres.dateFin)
      fin.setHours(23, 59, 59, 999)
      results = results.filter((s) => new Date(s.date_souvenir) <= fin)
    }

    if (filtres.lieu.trim()) {
      const lieuLower = filtres.lieu.toLowerCase()
      results = results.filter((s) => s.lieu?.toLowerCase().includes(lieuLower))
    }

    setResultats(results)
  }

  useEffect(() => {
    rechercher()
  }, [recherche, filtres, souvenirs])

  const resetFiltres = () => {
    setRecherche('')
    setFiltres({ type: 'TOUS', dateDebut: '', dateFin: '', lieu: '' })
  }

  const supprimerSouvenir = peutEcrire(utilisateur.role)
    ? async (id) => {
        if (!window.confirm('Supprimer ce souvenir ?')) return
        try {
          await api.delete(`/souvenirs/${id}`)
          chargerSouvenirs()
        } catch (err) {
          alert(err.userMessage || 'Erreur suppression')
        }
      }
    : undefined

  return (
    <AppLayout activePath="/recherche">
      <div className="mh-page-content">
        <header className="mh-feed-header">
          <h1 className="mh-title">🔍 Recherche avancée</h1>
          <p className="mh-subtitle">Filtrez par texte, type, dates et lieu</p>
        </header>

        {erreur && <div className="mh-form-alert">{erreur}</div>}

        <div className="mh-search-bar" style={{ marginBottom: '1rem' }}>
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Titre, description, lieu, auteur…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>

        <div
          className="mh-arbre-form-grid"
          style={{ marginBottom: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
        >
          <select
            className="mh-input"
            value={filtres.type}
            onChange={(e) => setFiltres({ ...filtres, type: e.target.value })}
          >
            <option value="TOUS">Tous les types</option>
            <option value="PHOTO">📷 Photos</option>
            <option value="VIDEO">🎬 Vidéos</option>
            <option value="AUDIO">🎙️ Audios</option>
            <option value="DOCUMENT">📎 Documents</option>
            <option value="TEXTE">📝 Textes</option>
          </select>
          <input
            type="date"
            className="mh-input"
            value={filtres.dateDebut}
            onChange={(e) => setFiltres({ ...filtres, dateDebut: e.target.value })}
            aria-label="Date début"
          />
          <input
            type="date"
            className="mh-input"
            value={filtres.dateFin}
            onChange={(e) => setFiltres({ ...filtres, dateFin: e.target.value })}
            aria-label="Date fin"
          />
          <input
            type="text"
            className="mh-input"
            placeholder="Lieu"
            value={filtres.lieu}
            onChange={(e) => setFiltres({ ...filtres, lieu: e.target.value })}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <span className="mh-stat-pill">{resultats.length} résultat(s)</span>
          <button type="button" className="mh-btn" onClick={resetFiltres}>
            Réinitialiser
          </button>
        </div>

        {loading ? (
          <div className="mh-feed-loading">Chargement…</div>
        ) : resultats.length === 0 ? (
          <div className="mh-form-alert mh-form-alert--warning">Aucun souvenir ne correspond.</div>
        ) : (
          <div className="mh-recherche-resultats">
            {resultats.map((souvenir) => (
              <SouvenirCard
                key={souvenir.id}
                souvenir={souvenir}
                utilisateur={utilisateur}
                onSupprimer={supprimerSouvenir}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
