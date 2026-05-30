import { useState, useEffect } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'

export default function Statistiques() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    parType: { PHOTO: 0, AUDIO: 0, VIDEO: 0, TEXTE: 0, DOCUMENT: 0 },
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
      setErreur('')
      const [souvenirsRep, membresRep] = await Promise.all([
        api.get('/souvenirs'),
        api.get('/membres')
      ])
      setMembres(membresRep.data.data)
      calculerStats(souvenirsRep.data.data)
    } catch (err) {
      setErreur(err.userMessage || 'Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  const calculerStats = (souvenirsData) => {
    const parType = { PHOTO: 0, AUDIO: 0, VIDEO: 0, TEXTE: 0, DOCUMENT: 0 }
    souvenirsData.forEach((s) => {
      if (parType[s.type] !== undefined) parType[s.type]++
      else parType.TEXTE++
    })

    const parAnnee = {}
    souvenirsData.forEach((s) => {
      const annee = new Date(s.date_souvenir).getFullYear()
      parAnnee[annee] = (parAnnee[annee] || 0) + 1
    })

    const tagCount = {}
    souvenirsData.forEach((s) => {
      s.tags?.forEach((t) => {
        const tagNom = t.tag?.libelle || t
        tagCount[tagNom] = (tagCount[tagNom] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const auteurCount = {}
    souvenirsData.forEach((s) => {
      if (s.auteur) {
        const nom = `${s.auteur.prenom} ${s.auteur.nom}`
        auteurCount[nom] = (auteurCount[nom] || 0) + 1
      }
    })
    const membresActifs = Object.entries(auteurCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const moisCount = {}
    souvenirsData.forEach((s) => {
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

  const maxSouvenirs = Math.max(...Object.values(stats.parAnnee), 1)

  return (
    <AppLayout activePath="/statistiques">
      <div className="mh-page-content">
        <header className="mh-feed-header">
          <h1 className="mh-title">📊 Statistiques</h1>
          <p className="mh-subtitle">Vue d&apos;ensemble de l&apos;activité familiale</p>
        </header>

        {erreur && <div className="mh-form-alert">{erreur}</div>}

        {loading ? (
          <div className="mh-feed-loading">Chargement…</div>
        ) : (
          <>
            <div className="mh-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="mh-stat-card">
                <div className="mh-stat-num">{stats.total}</div>
                <div className="mh-stat-label">Souvenirs</div>
              </div>
              <div className="mh-stat-card">
                <div className="mh-stat-num">{membres.length}</div>
                <div className="mh-stat-label">Membres</div>
              </div>
              <div className="mh-stat-card">
                <div className="mh-stat-num">{Object.keys(stats.parAnnee).length}</div>
                <div className="mh-stat-label">Années</div>
              </div>
              <div className="mh-stat-card">
                <div className="mh-stat-num">{stats.topTags.length}</div>
                <div className="mh-stat-label">Tags</div>
              </div>
            </div>

            <section className="mh-panel-section" style={{ marginBottom: '1rem' }}>
              <h3 className="mh-side-label">Par type</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {Object.entries(stats.parType).map(([type, count]) => (
                  <li key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                    <span>{type}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            </section>

            {Object.keys(stats.parAnnee).length > 0 && (
              <section className="mh-panel-section" style={{ marginBottom: '1rem' }}>
                <h3 className="mh-side-label">Par année</h3>
                {Object.entries(stats.parAnnee)
                  .sort((a, b) => b[0] - a[0])
                  .map(([annee, count]) => (
                    <div key={annee} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <span style={{ width: '48px' }}>{annee}</span>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(139,99,64,0.15)', borderRadius: '4px' }}>
                        <div
                          style={{
                            width: `${(count / maxSouvenirs) * 100}%`,
                            height: '100%',
                            background: '#8b6340',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <span>{count}</span>
                    </div>
                  ))}
              </section>
            )}

            {stats.moisPlusActifs.length > 0 && (
              <section className="mh-panel-section" style={{ marginBottom: '1rem' }}>
                <h3 className="mh-side-label">Mois les plus actifs</h3>
                {stats.moisPlusActifs.map(([mois, count]) => (
                  <div key={mois} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>{mois}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </section>
            )}

            {stats.topTags.length > 0 && (
              <section className="mh-panel-section" style={{ marginBottom: '1rem' }}>
                <h3 className="mh-side-label">Tags populaires</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {stats.topTags.map(([tag, count]) => (
                    <span key={tag} className="mh-memory-tag">
                      #{tag} ({count})
                    </span>
                  ))}
                </div>
              </section>
            )}

            {stats.membresActifs.length > 0 && (
              <section className="mh-panel-section">
                <h3 className="mh-side-label">Membres les plus actifs</h3>
                {stats.membresActifs.map(([nom, count]) => (
                  <div key={nom} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>{nom}</span>
                    <strong>
                      {count} souvenir{count > 1 ? 's' : ''}
                    </strong>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
