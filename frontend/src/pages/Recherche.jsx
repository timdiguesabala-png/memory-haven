import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import SouvenirCard from '../components/SouvenirCard'
import { useTheme } from '../context/ThemeContext'

export default function Recherche() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()

  const [souvenirs, setSouvenirs] = useState([])
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(true)
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
      const rep = await api.get('/souvenirs')
      setSouvenirs(rep.data.data)
      setResultats(rep.data.data)
    } catch (err) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  const rechercher = () => {
    let results = [...souvenirs]

    // Recherche texte
    if (recherche.trim()) {
      const searchLower = recherche.toLowerCase()
      results = results.filter(s =>
        s.titre.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.lieu?.toLowerCase().includes(searchLower) ||
        s.auteur?.prenom?.toLowerCase().includes(searchLower) ||
        s.auteur?.nom?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre type
    if (filtres.type !== 'TOUS') {
      results = results.filter(s => s.type === filtres.type)
    }

    // Filtre date début
    if (filtres.dateDebut) {
      results = results.filter(s => new Date(s.date_souvenir) >= new Date(filtres.dateDebut))
    }

    // Filtre date fin
    if (filtres.dateFin) {
      results = results.filter(s => new Date(s.date_souvenir) <= new Date(filtres.dateFin))
    }

    // Filtre lieu
    if (filtres.lieu) {
      results = results.filter(s => s.lieu?.toLowerCase().includes(filtres.lieu.toLowerCase()))
    }

    setResultats(results)
  }

  const resetFiltres = () => {
    setRecherche('')
    setFiltres({ type: 'TOUS', dateDebut: '', dateFin: '', lieu: '' })
    setResultats(souvenirs)
  }

  const supprimerSouvenir = async (id) => {
    if (!window.confirm('Supprimer ce souvenir ?')) return
    try {
      await api.delete('/souvenirs/' + id)
      chargerSouvenirs()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#1a1a2e' : '#F8F6FC', fontFamily: 'sans-serif' },
    nav: { background: darkMode ? '#16213e' : '#2A2640', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: darkMode ? '#e0e0e0' : '#F8F6FC', fontSize: '18px', fontFamily: 'Georgia,serif', fontWeight: '500', flex: 1 },
    navLinks: { display: 'flex', gap: '6px' },
    navBtn: { background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F8F6FC', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    navBtnActive: { background: '#7B6BB8', color: '#2A2640', borderColor: '#7B6BB8', fontWeight: '500' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    navAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#7B6BB8', color: '#2A2640', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
    btnLogout: { background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F8F6FC', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    app: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '200px', background: darkMode ? '#221F32' : '#EDE8F5', borderRight: `1px solid ${darkMode ? '#1a1a2e' : '#C5B8E0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#7A7394', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#4A4568', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#e94560' : '#7B6BB8', color: '#FFF', fontWeight: '500' },
    main: { flex: 1, padding: '1.5rem', overflowY: 'auto' },
    header: { marginBottom: '1.5rem' },
    titre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#2A2640', fontFamily: 'Georgia,serif', margin: '0 0 3px' },
    searchBar: { display: 'flex', alignItems: 'center', gap: '10px', background: darkMode ? '#16213e' : '#F8F6FC', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}`, borderRadius: '12px', padding: '8px 16px', marginBottom: '1rem' },
    searchInput: { flex: 1, border: 'none', background: 'none', fontSize: '14px', outline: 'none', color: darkMode ? '#e0e0e0' : '#2A2640', fontFamily: 'sans-serif' },
    filterRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1rem' },
    filterSelect: { padding: '8px 12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}`, background: darkMode ? '#16213e' : '#F8F6FC', color: darkMode ? '#e0e0e0' : '#2A2640', fontSize: '13px' },
    btnReset: { background: 'none', border: 'none', color: '#5B4D9E', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', padding: '8px 12px' },
    resultInfo: { background: darkMode ? '#221F32' : '#EDE8F5', padding: '10px 16px', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' },
    vide: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' }
  }

  const initiales = (nom, prenom) => (prenom?.[0] || '') + (nom?.[0] || '')

  useEffect(() => {
    rechercher()
  }, [recherche, filtres])

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.navLogo}>🏡 Famille <span style={{ color: '#C5B8E0', fontStyle: 'italic' }}>{utilisateur.famille}</span></span>
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Fil</button>
          <button style={styles.navBtn} onClick={() => navigate('/albums')}>Albums</button>
          <button style={styles.navBtn} onClick={() => navigate('/arbre')}>Arbre</button>
          <button style={styles.navBtn} onClick={() => navigate('/membres')}>Membres</button>
          <button style={styles.navBtn} onClick={() => navigate('/discussion')}>💬 Discussion</button>
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>Recherche</button>
        </div>
        <div style={styles.navRight}>
          <div style={styles.navAvatar}>{initiales(utilisateur.nom, utilisateur.prenom)}</div>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('utilisateur'); navigate('/login') }} style={styles.btnLogout}>Déconnexion</button>
        </div>
      </nav>

      <div style={styles.app}>
        <div style={styles.sidebar}>
          <div style={styles.sideLabel}>Navigation</div>
          <div style={styles.sideItem} onClick={() => navigate('/dashboard')}>📄 Fil</div>
          <div style={styles.sideItem} onClick={() => navigate('/albums')}>📸 Albums</div>
          <div style={styles.sideItem} onClick={() => navigate('/arbre')}>🌳 Arbre</div>
          <div style={styles.sideItem} onClick={() => navigate('/membres')}>👪 Membres</div>
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>🔍 Recherche</div>
        </div>

        <div style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.titre}>🔍 Recherche avancée</h1>
          </div>

          <div style={styles.searchBar}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Rechercher par titre, description, lieu, auteur..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterRow}>
            <select
              value={filtres.type}
              onChange={(e) => setFiltres({ ...filtres, type: e.target.value })}
              style={styles.filterSelect}
            >
              <option value="TOUS">Tous les types</option>
              <option value="PHOTO">📷 Photos</option>
              <option value="AUDIO">🎙️ Audios</option>
              <option value="VIDEO">🎬 Vidéos</option>
              <option value="TEXTE">📝 Textes</option>
            </select>
            <input
              type="date"
              placeholder="Date début"
              value={filtres.dateDebut}
              onChange={(e) => setFiltres({ ...filtres, dateDebut: e.target.value })}
              style={styles.filterSelect}
            />
            <input
              type="date"
              placeholder="Date fin"
              value={filtres.dateFin}
              onChange={(e) => setFiltres({ ...filtres, dateFin: e.target.value })}
              style={styles.filterSelect}
            />
            <input
              type="text"
              placeholder="Lieu"
              value={filtres.lieu}
              onChange={(e) => setFiltres({ ...filtres, lieu: e.target.value })}
              style={styles.filterSelect}
            />
          </div>

          <div style={styles.resultInfo}>
            <span>{resultats.length} résultat(s) trouvé(s)</span>
            <button onClick={resetFiltres} style={styles.btnReset}>Réinitialiser les filtres</button>
          </div>

          {loading ? (
            <div style={styles.loading}>Chargement...</div>
          ) : resultats.length === 0 ? (
            <div style={styles.vide}>
              <p>Aucun souvenir ne correspond à votre recherche</p>
            </div>
          ) : (
            resultats.map(souvenir => (
              <SouvenirCard
                key={souvenir.id}
                souvenir={souvenir}
                utilisateur={utilisateur}
                onSupprimer={supprimerSouvenir}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}