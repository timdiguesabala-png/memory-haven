import { useState, useEffect } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/PageHeader'
import SouvenirCard from '../components/SouvenirCard'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'

import { searchSouvenirs, askArchives } from '../lib/platformApi'

export default function Recherche() {
  const utilisateur = getStoredUser()
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [questionIA, setQuestionIA] = useState('')
  const [reponseIA, setReponseIA] = useState('')
  const [membresArbre, setMembresArbre] = useState([])
  const [filtres, setFiltres] = useState({
    type: 'TOUS',
    dateDebut: '',
    dateFin: '',
    lieu: '',
    tag: '',
    membre_arbre_id: ''
  })

  useEffect(() => {
    api.get('/arbre').then((rep) => setMembresArbre(rep.data.data || [])).catch(() => {})
    rechercher()
  }, [])

  const rechercher = async () => {
    try {
      setLoading(true)
      setErreur('')
      const rep = await searchSouvenirs({
        q: recherche.trim() || undefined,
        type: filtres.type !== 'TOUS' ? filtres.type : undefined,
        tag: filtres.tag.trim() || undefined,
        lieu: filtres.lieu.trim() || undefined,
        dateDebut: filtres.dateDebut || undefined,
        dateFin: filtres.dateFin || undefined,
        membre_arbre_id: filtres.membre_arbre_id || undefined,
        limit: 80
      })
      setResultats(rep || [])
    } catch {
      try {
        const rep = await api.get('/souvenirs', { params: { limit: 100 } })
        setResultats(rep.data.data || [])
        setErreur('Recherche serveur indisponible — résultats locaux limités.')
      } catch (err) {
        setErreur(err.userMessage || 'Impossible de charger les souvenirs')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(rechercher, 350)
    return () => clearTimeout(t)
  }, [recherche, filtres])

  const resetFiltres = () => {
    setRecherche('')
    setFiltres({ type: 'TOUS', dateDebut: '', dateFin: '', lieu: '', tag: '', membre_arbre_id: '' })
  }

  const askIA = async () => {
    if (!questionIA.trim()) return
    try {
      const data = await askArchives(questionIA.trim())
      setReponseIA(data.answer)
      if (data.results?.length) setResultats(data.results)
    } catch {
      setReponseIA('Assistant indisponible — mettez l’API à jour.')
    }
  }

  const supprimerSouvenir = peutEcrire(utilisateur.role)
    ? async (id) => {
        if (!window.confirm('Supprimer ce souvenir ?')) return
        try {
          await api.delete(`/souvenirs/${id}`)
          rechercher()
        } catch (err) {
          alert(err.userMessage || 'Erreur suppression')
        }
      }
    : undefined

  return (
    <AppLayout activePath="/recherche">
      <div className="mh-page-content">
        <PageHeader
          title="Recherche"
          family={utilisateur.famille}
          subtitle="Recherche avancée + assistant archives"
        />

        <div className="mh-platform-card" style={{ marginBottom: '1rem' }}>
          <p className="mh-feed-toolbar-label">Assistant archives (IA)</p>
          <div className="mh-search-bar">
            <input
              type="search"
              placeholder="Ex. souvenirs à Lomé en 2020, photos de grand-mère…"
              value={questionIA}
              onChange={(e) => setQuestionIA(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askIA()}
            />
            <button type="button" className="mh-btn mh-btn-primary" onClick={askIA}>
              Demander
            </button>
          </div>
          {reponseIA && <p style={{ marginTop: '0.65rem', fontSize: '0.92rem' }}>{reponseIA}</p>}
        </div>

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
          <select
            className="mh-input"
            value={filtres.membre_arbre_id}
            onChange={(e) => setFiltres({ ...filtres, membre_arbre_id: e.target.value })}
          >
            <option value="">Toute personne</option>
            {membresArbre.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="mh-input"
            placeholder="Tag / mot-clé"
            value={filtres.tag}
            onChange={(e) => setFiltres({ ...filtres, tag: e.target.value })}
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
          <div className="mh-feed-empty"><p>Aucun résultat.</p></div>
        ) : (
          <div className="mh-recherche-resultats">
            {resultats.map((souvenir) => (
              <SouvenirCard
                key={souvenir.id}
                souvenir={souvenir}
                utilisateur={utilisateur}
                onSupprimer={supprimerSouvenir}
                onUpdated={rechercher}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
