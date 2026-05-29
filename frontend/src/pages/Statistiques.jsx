import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function Statistiques() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()

  const [souvenirs, setSouvenirs] = useState([])
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    parType: { PHOTO: 0, AUDIO: 0, VIDEO: 0, TEXTE: 0 },
    parAnnee: {},
    topTags: [],
    membresActifs: [],
    moisPlusActifs: []
  })

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    try {
      setLoading(true)
      const [souvenirsRep, membresRep] = await Promise.all([
        api.get('/souvenirs'),
        api.get('/membres')
      ])
      setSouvenirs(souvenirsRep.data.data)
      setMembres(membresRep.data.data)
      calculerStats(souvenirsRep.data.data, membresRep.data.data)
    } catch (err) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculerStats = (souvenirsData, membresData) => {
    // Par type
    const parType = { PHOTO: 0, AUDIO: 0, VIDEO: 0, TEXTE: 0 }
    souvenirsData.forEach(s => parType[s.type]++)

    // Par année
    const parAnnee = {}
    souvenirsData.forEach(s => {
      const annee = new Date(s.date_souvenir).getFullYear()
      parAnnee[annee] = (parAnnee[annee] || 0) + 1
    })

    // Top tags
    const tagCount = {}
    souvenirsData.forEach(s => {
      if (s.tags) {
        s.tags.forEach(t => {
          const tagNom = t.tag?.libelle || t
          tagCount[tagNom] = (tagCount[tagNom] || 0) + 1
        })
      }
    })
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Membres actifs
    const auteurCount = {}
    souvenirsData.forEach(s => {
      if (s.auteur) {
        const nom = `${s.auteur.prenom} ${s.auteur.nom}`
        auteurCount[nom] = (auteurCount[nom] || 0) + 1
      }
    })
    const membresActifs = Object.entries(auteurCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Mois les plus actifs
    const moisCount = {}
    souvenirsData.forEach(s => {
      const date = new Date(s.date_souvenir)
      const moisAnnee = `${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`
      moisCount[moisAnnee] = (moisCount[moisAnnee] || 0) + 1
    })
    const moisPlusActifs = Object.entries(moisCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    setStats({
      total: souvenirsData.length,
      parType,
      parAnnee,
      topTags,
      membresActifs,
      moisPlusActifs
    })
  }

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#1E1C2C' : '#E8E2F4', fontFamily: 'sans-serif' },
    nav: { background: darkMode ? '#16213e' : '#2A2640', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: darkMode ? '#e0e0e0' : '#F5F0FA', fontSize: '18px', fontFamily: 'Georgia,serif', fontWeight: '500', flex: 1 },
    navLinks: { display: 'flex', gap: '6px' },
    navBtn: { background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F5F0FA', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    navBtnActive: { background: '#7B6BB8', color: '#2A2640', borderColor: '#7B6BB8', fontWeight: '500' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    navAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#7B6BB8', color: '#2A2640', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
    btnLogout: { background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F5F0FA', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    app: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '200px', background: darkMode ? '#221F32' : '#C8B8DC', borderRight: `1px solid ${darkMode ? '#1E1C2C' : '#C5B8E0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#7A7394', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#4A4568', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#e94560' : '#7B6BB8', color: '#FFF', fontWeight: '500' },
    main: { flex: 1, padding: '1.5rem', overflowY: 'auto' },
    header: { marginBottom: '1.5rem' },
    titre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#2A2640', fontFamily: 'Georgia,serif', margin: '0 0 3px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { background: darkMode ? '#16213e' : '#F8F6FC', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}`, borderRadius: '12px', padding: '1rem', textAlign: 'center' },
    statNum: { fontFamily: 'Georgia,serif', fontSize: '28px', color: '#5B4D9E', display: 'block' },
    statLabel: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A7394', marginTop: '4px' },
    section: { background: darkMode ? '#16213e' : '#F8F6FC', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' },
    sectionTitle: { fontSize: '16px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '1rem', borderLeft: `3px solid #5B4D9E`, paddingLeft: '10px' },
    typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
    typeItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: darkMode ? '#1E1C2C' : '#B8A8CC', borderRadius: '8px', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}` },
    anneeItem: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
    barContainer: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px' },
    bar: { height: '8px', background: '#5B4D9E', borderRadius: '4px', transition: 'width 0.3s' },
    barCount: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#4A4568', minWidth: '30px' },
    tagsList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    tagItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: darkMode ? '#1E1C2C' : '#C8B8DC', padding: '6px 12px', borderRadius: '20px' },
    membresList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    membreItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: darkMode ? '#1E1C2C' : '#B8A8CC', borderRadius: '8px', border: `1px solid ${darkMode ? '#e94560' : '#C5B8E0'}` },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' }
  }

  const initiales = (nom, prenom) => (prenom?.[0] || '') + (nom?.[0] || '')
  const maxSouvenirs = Math.max(...Object.values(stats.parAnnee), 1)

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
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>Stats</button>
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
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>📊 Stats</div>
        </div>

        <div style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.titre}>📊 Statistiques de la famille</h1>
          </div>

          {loading ? (
            <div style={styles.loading}>Chargement des statistiques...</div>
          ) : (
            <>
              <div style={styles.statsRow}>
                <div style={styles.statCard}><span style={styles.statNum}>{stats.total}</span><div style={styles.statLabel}>Souvenirs</div></div>
                <div style={styles.statCard}><span style={styles.statNum}>{membres.length}</span><div style={styles.statLabel}>Membres</div></div>
                <div style={styles.statCard}><span style={styles.statNum}>{Object.keys(stats.parAnnee).length}</span><div style={styles.statLabel}>Années</div></div>
                <div style={styles.statCard}><span style={styles.statNum}>{stats.topTags.length}</span><div style={styles.statLabel}>Tags uniques</div></div>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📸 Par type de souvenir</h3>
                <div style={styles.typeGrid}>
                  <div style={styles.typeItem}><span>📷 Photos</span><strong>{stats.parType.PHOTO}</strong></div>
                  <div style={styles.typeItem}><span>🎙️ Audios</span><strong>{stats.parType.AUDIO}</strong></div>
                  <div style={styles.typeItem}><span>🎬 Vidéos</span><strong>{stats.parType.VIDEO}</strong></div>
                  <div style={styles.typeItem}><span>📝 Textes</span><strong>{stats.parType.TEXTE}</strong></div>
                </div>
              </div>

              {Object.keys(stats.parAnnee).length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>📅 Par année</h3>
                  {Object.entries(stats.parAnnee)
                    .sort((a, b) => b[0] - a[0])
                    .map(([annee, count]) => (
                      <div key={annee} style={styles.anneeItem}>
                        <span style={{ width: '60px' }}>{annee}</span>
                        <div style={styles.barContainer}>
                          <div style={{ ...styles.bar, width: `${(count / maxSouvenirs) * 100}%` }}></div>
                          <span style={styles.barCount}>{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {stats.moisPlusActifs.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>📆 Mois les plus actifs</h3>
                  {stats.moisPlusActifs.map(([mois, count]) => (
                    <div key={mois} style={styles.anneeItem}>
                      <span style={{ width: '140px' }}>{mois}</span>
                      <div style={styles.barContainer}>
                        <div style={{ ...styles.bar, width: `${(count / stats.total) * 100}%` }}></div>
                        <span style={styles.barCount}>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stats.topTags.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>🏷️ Tags les plus utilisés</h3>
                  <div style={styles.tagsList}>
                    {stats.topTags.map(([tag, count]) => (
                      <div key={tag} style={styles.tagItem}>
                        <span>#{tag}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.membresActifs.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>👪 Membres les plus actifs</h3>
                  <div style={styles.membresList}>
                    {stats.membresActifs.map(([nom, count]) => (
                      <div key={nom} style={styles.membreItem}>
                        <span>{nom}</span>
                        <strong>{count} souvenir{count > 1 ? 's' : ''}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}