import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/PageHeader'
import { fetchAccueil } from '../lib/platformApi'
import PlatformLocalNotice from '../components/PlatformLocalNotice'
import { getStoredUser } from '../lib/userStorage'
import { primaryMediaUrl } from '../lib/mediaUrl'

export default function Accueil() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const d = await fetchAccueil()
        if (!cancelled) setData(d)
      } catch {
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppLayout activePath="/accueil">
      <div className="mh-platform-page fade-in-up">
        <div className="mh-platform-hero">
          <h1>Bienvenue, {user.prenom} ✨</h1>
          <p>
            Votre mémoire numérique familiale — souvenirs, héritage, traditions et liens pour les
            générations {user.famille ? `de la famille ${user.famille}` : 'à venir'}.
          </p>
        </div>
        <PlatformLocalNotice />

        {loading ? (
          <p className="mh-feed-loading">Chargement du tableau de bord…</p>
        ) : (
          <div className="mh-platform-grid">
            <section className="mh-platform-widget" style={{ animationDelay: '0.05s' }}>
              <h2>📊 Statistiques</h2>
              <div className="mh-platform-stat-row">
                <div className="mh-platform-stat">
                  <strong>{data?.stats?.souvenirs ?? 0}</strong>
                  <span>Souvenirs</span>
                </div>
                <div className="mh-platform-stat">
                  <strong>{data?.stats?.albums ?? 0}</strong>
                  <span>Albums</span>
                </div>
                <div className="mh-platform-stat">
                  <strong>{data?.stats?.membres ?? 0}</strong>
                  <span>Membres</span>
                </div>
                <div className="mh-platform-stat">
                  <strong>{data?.stats?.commentaires ?? 0}</strong>
                  <span>Commentaires</span>
                </div>
              </div>
            </section>

            <section className="mh-platform-widget" style={{ animationDelay: '0.1s' }}>
              <h2>📄 Souvenirs récents</h2>
              <ul className="mh-platform-list">
                {(data?.souvenirsRecents || []).slice(0, 5).map((s) => (
                  <li key={s.id} className="mh-platform-list-item">
                    <button type="button" onClick={() => navigate('/dashboard')}>
                      {s.titre}
                    </button>
                  </li>
                ))}
                {!data?.souvenirsRecents?.length && (
                  <li className="mh-platform-list-item">Aucun souvenir pour le moment.</li>
                )}
              </ul>
              <button type="button" className="mh-btn mh-btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/dashboard')}>
                Voir le fil
              </button>
            </section>

            <section className="mh-platform-widget" style={{ animationDelay: '0.15s' }}>
              <h2>📸 Albums récents</h2>
              <ul className="mh-platform-list">
                {(data?.albumsRecents || []).map((a) => (
                  <li key={a.id} className="mh-platform-list-item">
                    <button type="button" onClick={() => navigate('/albums')}>
                      {a.nom} ({a.souvenirs?.length || 0})
                    </button>
                  </li>
                ))}
                {!data?.albumsRecents?.length && (
                  <li className="mh-platform-list-item">Créez votre premier album.</li>
                )}
              </ul>
            </section>

            <section className="mh-platform-widget" style={{ animationDelay: '0.2s' }}>
              <h2>🎂 Anniversaires</h2>
              <ul className="mh-platform-list">
                {(data?.anniversaires || []).map((a) => (
                  <li key={a.id} className="mh-platform-list-item">
                    <span>
                      {a.nom} — dans {a.jours_restants} jour{a.jours_restants > 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
                {!data?.anniversaires?.length && (
                  <li className="mh-platform-list-item">
                    Ajoutez des dates de naissance dans l&apos;arbre généalogique.
                  </li>
                )}
              </ul>
            </section>

            <section className="mh-platform-widget" style={{ animationDelay: '0.25s' }}>
              <h2>📅 Événements à venir</h2>
              <ul className="mh-platform-list">
                {(data?.evenements || []).map((e) => (
                  <li key={e.id} className="mh-platform-list-item">
                    <span>
                      {e.titre} —{' '}
                      {new Date(e.date_debut).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </li>
                ))}
                {!data?.evenements?.length && (
                  <li className="mh-platform-list-item">
                    Créez des événements depuis la chronologie.
                  </li>
                )}
              </ul>
              <button type="button" className="mh-btn" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/timeline')}>
                Chronologie familiale
              </button>
            </section>

            <section className="mh-platform-widget" style={{ animationDelay: '0.3s' }}>
              <h2>🌟 Découvrir</h2>
              <div className="mh-platform-stat-row">
                {[
                  { path: '/heritage', label: 'Héritage' },
                  { path: '/hommage', label: 'Hommage' },
                  { path: '/capsules', label: 'Capsules' },
                  { path: '/livre', label: 'Livre PDF' },
                  { path: '/carte', label: 'Carte' },
                  { path: '/arbre', label: 'Arbre' }
                ].map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    className="mh-platform-tab"
                    onClick={() => navigate(link.path)}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
