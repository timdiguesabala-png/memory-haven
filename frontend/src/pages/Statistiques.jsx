import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/PageHeader'
import { StatsDonutChart, StatsBarChart, StatsTagChart, MEMBER_COLORS } from '../components/stats/StatsCharts'
import { getStoredUser } from '../lib/userStorage'
import '../styles/statistiques.css'

const YEAR_COLORS = ['#3d5a80', '#5d8a72', '#6b8fb8', '#c17f59', '#b8953a', '#9a5f42']

export default function Statistiques() {
  const utilisateur = getStoredUser()
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
        api.get('/souvenirs', { params: { limit: 100 } }),
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
      if (!Number.isNaN(annee)) parAnnee[annee] = (parAnnee[annee] || 0) + 1
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
      .slice(0, 8)

    const auteurCount = {}
    souvenirsData.forEach((s) => {
      if (s.auteur) {
        const nom = `${s.auteur.prenom} ${s.auteur.nom}`
        auteurCount[nom] = (auteurCount[nom] || 0) + 1
      }
    })
    const membresActifs = Object.entries(auteurCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    const moisCount = {}
    souvenirsData.forEach((s) => {
      const date = new Date(s.date_souvenir)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' })
      if (!moisCount[key]) moisCount[key] = { label, count: 0 }
      moisCount[key].count++
    })
    const moisPlusActifs = Object.entries(moisCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([, v]) => [v.label, v.count])

    setStats({
      total: souvenirsData.length,
      parType,
      parAnnee,
      topTags,
      membresActifs,
      moisPlusActifs
    })
  }

  const anneeItems = useMemo(
    () =>
      Object.entries(stats.parAnnee)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([annee, value], i) => ({
          label: annee,
          value,
          color: YEAR_COLORS[i % YEAR_COLORS.length]
        })),
    [stats.parAnnee]
  )

  const moisItems = useMemo(
    () =>
      stats.moisPlusActifs.map(([label, value], i) => ({
        label,
        value,
        color: YEAR_COLORS[(i + 2) % YEAR_COLORS.length]
      })),
    [stats.moisPlusActifs]
  )

  const membresItems = useMemo(
    () =>
      stats.membresActifs.map(([label, value], i) => ({
        label,
        value,
        color: MEMBER_COLORS[i % MEMBER_COLORS.length]
      })),
    [stats.membresActifs]
  )

  const maxAnnee = Math.max(...anneeItems.map((i) => i.value), 1)

  return (
    <AppLayout activePath="/statistiques">
      <div className="mh-page-content">
        <PageHeader
          title="Statistiques"
          family={utilisateur?.famille}
          subtitle="Graphiques et activité de la famille"
        />

        {erreur && <div className="mh-form-alert">{erreur}</div>}

        {loading ? (
          <div className="mh-feed-loading">Chargement…</div>
        ) : (
          <div className="mh-stats-dashboard">
            <div className="mh-stats-kpis">
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

            <div className="mh-stats-charts-grid">
              <section className="mh-stats-chart-card">
                <h3 className="mh-stats-chart-title">Répartition par type</h3>
                <StatsDonutChart data={stats.parType} />
              </section>

              {anneeItems.length > 0 && (
                <section className="mh-stats-chart-card mh-stats-chart-card--wide">
                  <h3 className="mh-stats-chart-title">Souvenirs par année</h3>
                  <StatsBarChart items={anneeItems} maxValue={maxAnnee} />
                </section>
              )}

              {moisItems.length > 0 && (
                <section className="mh-stats-chart-card mh-stats-chart-card--wide">
                  <h3 className="mh-stats-chart-title">Activité récente (par mois)</h3>
                  <StatsBarChart items={moisItems} />
                </section>
              )}

              {membresItems.length > 0 && (
                <section className="mh-stats-chart-card">
                  <h3 className="mh-stats-chart-title">Membres les plus actifs</h3>
                  <StatsBarChart items={membresItems} horizontal />
                </section>
              )}

              {stats.topTags.length > 0 && (
                <section className="mh-stats-chart-card">
                  <h3 className="mh-stats-chart-title">Tags populaires</h3>
                  <StatsTagChart tags={stats.topTags} />
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
