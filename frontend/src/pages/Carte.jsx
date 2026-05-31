import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { fetchCarte } from '../lib/platformApi'

export default function Carte() {
  const [data, setData] = useState({ points: [] })
  const [loading, setLoading] = useState(true)
  const [focus, setFocus] = useState(null)

  useEffect(() => {
    fetchCarte()
      .then(setData)
      .catch(() => setData({ points: [] }))
      .finally(() => setLoading(false))
  }, [])

  const withCoords = (data.points || []).filter((p) => p.lat != null && p.lng != null)
  const mapUrl = focus
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${focus.lng - 0.5}%2C${focus.lat - 0.3}%2C${focus.lng + 0.5}%2C${focus.lat + 0.3}&layer=mapnik&marker=${focus.lat}%2C${focus.lng}`
    : withCoords.length
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${withCoords[0].lng - 1}%2C${withCoords[0].lat - 0.8}%2C${withCoords[0].lng + 1}%2C${withCoords[0].lat + 0.8}&layer=mapnik`
      : null

  return (
    <AppLayout activePath="/carte">
      <div className="mh-platform-page fade-in-up">
        <div className="mh-platform-hero">
          <h1>Carte familiale</h1>
          <p>Villes actuelles, lieux de naissance et souvenirs géolocalisés de la famille.</p>
        </div>

        {loading ? (
          <p>Chargement…</p>
        ) : (
          <div className="mh-carte-grid">
            <div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.05rem' }}>Lieux</h2>
              {(data.points || []).map((p, i) => (
                <div key={i} className="mh-carte-point">
                  <button
                    type="button"
                    style={{ all: 'unset', cursor: p.lat != null ? 'pointer' : 'default', width: '100%' }}
                    onClick={() => p.lat != null && setFocus(p)}
                  >
                    <strong>{p.label}</strong>
                    <br />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                      {p.ville || p.lieu || (p.lat != null ? `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)}` : 'Lieu texte')}
                    </span>
                  </button>
                </div>
              ))}
              {!data.points?.length && (
                <p>Ajoutez ville ou coordonnées GPS dans votre profil ou vos souvenirs.</p>
              )}
            </div>
            <div className="mh-carte-map">
              {mapUrl ? (
                <iframe title="Carte" src={mapUrl} style={{ width: '100%', height: '100%', border: 0, minHeight: 280 }} />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-soft)' }}>
                  🌍 Carte disponible lorsque des coordonnées sont renseignées
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
