import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Statistiques({ souvenirs, familleNom }) {
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    parType: { PHOTO: 0, AUDIO: 0, VIDEO: 0, TEXTE: 0 },
    parAnnee: {},
    topTags: [],
    membresActifs: []
  })

  useEffect(() => {
    if (showModal && souvenirs.length > 0) {
      calculerStats()
    }
  }, [showModal, souvenirs])

  const calculerStats = () => {
    // Par type
    const parType = { PHOTO: 0, AUDIO: 0, VIDEO: 0, TEXTE: 0 }
    souvenirs.forEach(s => parType[s.type]++)

    // Par année
    const parAnnee = {}
    souvenirs.forEach(s => {
      const annee = new Date(s.date_souvenir).getFullYear()
      parAnnee[annee] = (parAnnee[annee] || 0) + 1
    })

    // Top tags
    const tagCount = {}
    souvenirs.forEach(s => {
      if (s.tags) {
        s.tags.forEach(t => {
          const tagNom = t.tag?.libelle || t
          tagCount[tagNom] = (tagCount[tagNom] || 0) + 1
        })
      }
    })
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Membres actifs
    const auteurCount = {}
    souvenirs.forEach(s => {
      if (s.auteur) {
        const nom = `${s.auteur.prenom} ${s.auteur.nom}`
        auteurCount[nom] = (auteurCount[nom] || 0) + 1
      }
    })
    const membresActifs = Object.entries(auteurCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    setStats({
      total: souvenirs.length,
      parType,
      parAnnee,
      topTags,
      membresActifs
    })
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} style={styles.btnStats}>
        📊 Statistiques
      </button>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.header}>
              <h3 style={styles.title}>📊 Statistiques de {familleNom}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.content}>
              {/* Total */}
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats.total}</div>
                <div style={styles.statLabel}>Souvenirs</div>
              </div>

              {/* Par type */}
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>📸 Par type</h4>
                <div style={styles.typeGrid}>
                  <div style={styles.typeItem}><span>📷 Photos</span><strong>{stats.parType.PHOTO}</strong></div>
                  <div style={styles.typeItem}><span>🎙️ Audios</span><strong>{stats.parType.AUDIO}</strong></div>
                  <div style={styles.typeItem}><span>🎬 Vidéos</span><strong>{stats.parType.VIDEO}</strong></div>
                  <div style={styles.typeItem}><span>📝 Textes</span><strong>{stats.parType.TEXTE}</strong></div>
                </div>
              </div>

              {/* Par année */}
              {Object.keys(stats.parAnnee).length > 0 && (
                <div style={styles.section}>
                  <h4 style={styles.sectionTitle}>📅 Par année</h4>
                  <div style={styles.anneeGrid}>
                    {Object.entries(stats.parAnnee)
                      .sort((a, b) => b[0] - a[0])
                      .map(([annee, count]) => (
                        <div key={annee} style={styles.anneeItem}>
                          <span>{annee}</span>
                          <div style={styles.barContainer}>
                            <div style={{ ...styles.bar, width: `${(count / stats.total) * 100}%` }}></div>
                            <span style={styles.barCount}>{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Top tags */}
              {stats.topTags.length > 0 && (
                <div style={styles.section}>
                  <h4 style={styles.sectionTitle}>🏷️ Tags les plus utilisés</h4>
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

              {/* Membres actifs */}
              {stats.membresActifs.length > 0 && (
                <div style={styles.section}>
                  <h4 style={styles.sectionTitle}>👪 Membres les plus actifs</h4>
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
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  btnStats: {
    background: '#5B4D9E', color: '#FFF', border: 'none',
    padding: '8px 16px', borderRadius: '16px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500'
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: {
    background: '#F8F6FC', borderRadius: '16px', padding: '1.5rem',
    width: '100%', maxWidth: '550px', border: '1px solid #C5B8E0',
    maxHeight: '80vh', overflowY: 'auto'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '18px', color: '#2A2640', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7A7394' },
  content: {},
  statCard: { textAlign: 'center', padding: '1rem', background: '#EDE8F5', borderRadius: '12px', marginBottom: '1.5rem' },
  statNumber: { fontSize: '36px', fontWeight: 'bold', color: '#5B4D9E' },
  statLabel: { fontSize: '14px', color: '#4A4568' },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '15px', color: '#2A2640', marginBottom: '10px', borderLeft: '3px solid #5B4D9E', paddingLeft: '10px' },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  typeItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#FFF', borderRadius: '8px', border: '1px solid #C5B8E0' },
  anneeGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  anneeItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  barContainer: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px' },
  bar: { height: '8px', background: '#5B4D9E', borderRadius: '4px', transition: 'width 0.3s' },
  barCount: { fontSize: '12px', color: '#4A4568', minWidth: '30px' },
  tagsList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tagItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#EDE8F5', padding: '6px 12px', borderRadius: '20px' },
  membresList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  membreItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#FFF', borderRadius: '8px', border: '1px solid #C5B8E0' }
}