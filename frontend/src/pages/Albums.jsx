import { useState, useEffect } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import {
  albumCoverGradient,
  albumEmoji,
  albumMetaLine
} from '../lib/albumPresentation'

export default function Albums() {
  const utilisateur = getStoredUser()
  const lectureSeule = !peutEcrire(utilisateur?.role)
  const [albums, setAlbums] = useState([])
  const [souvenirs, setSouvenirs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [albumSelec, setAlbumSelec] = useState(null)
  const [form, setForm] = useState({ nom: '', description: '' })

  useEffect(() => {
    chargerAlbums()
    chargerSouvenirs()
  }, [])

  const chargerAlbums = async () => {
    try {
      setLoading(true)
      const rep = await api.get('/albums')
      setAlbums(rep.data.data || [])
    } catch (err) {
      console.error('Erreur albums:', err)
    } finally {
      setLoading(false)
    }
  }

  const chargerSouvenirs = async () => {
    try {
      const rep = await api.get('/souvenirs')
      setSouvenirs(rep.data.data || [])
    } catch (err) {
      console.error('Erreur souvenirs:', err)
    }
  }

  const creerAlbum = async (e) => {
    e.preventDefault()
    try {
      await api.post('/albums', form)
      setForm({ nom: '', description: '' })
      setShowForm(false)
      chargerAlbums()
    } catch (err) {
      console.error('Erreur creation album:', err)
      alert(err.response?.data?.message || 'Impossible de créer l’album')
    }
  }

  const ajouterSouvenirAlbum = async (album_id, souvenir_id) => {
    try {
      await api.post(`/albums/${album_id}/souvenirs`, { souvenir_id })
      const rep = await api.get('/albums')
      const next = rep.data.data || []
      setAlbums(next)
      const updated = next.find((a) => a.id === album_id)
      if (updated) setAlbumSelec(updated)
    } catch (err) {
      console.error('Erreur ajout souvenir:', err)
    }
  }

  const supprimerAlbum = async (id) => {
    if (!window.confirm('Supprimer cet album ?')) return
    try {
      await api.delete(`/albums/${id}`)
      setAlbumSelec(null)
      chargerAlbums()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const coverImage = (album) => {
    const first = album.souvenirs?.find((as) => as.souvenir?.fichier_url)
    return first?.souvenir?.fichier_url || null
  }

  const countLabel = (n) => `${n} souvenir${n > 1 ? 's' : ''}`

  return (
    <AppLayout activePath="/albums">
      <div className="mh-albums-page fade-in-up">
        <header className="mh-albums-header">
          <h1 className="mh-albums-title">
            <span className="mh-albums-title-icon" aria-hidden>
              🖼️
            </span>
            Albums photo
          </h1>
          {!lectureSeule && (
            <button
              type="button"
              className="mh-albums-btn-new"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Annuler' : '+ Nouvel album'}
            </button>
          )}
        </header>

        {showForm && !lectureSeule && (
          <div className="mh-albums-form-panel">
            <h3>Nouvel album</h3>
            <form onSubmit={creerAlbum}>
              <div className="mh-form-row-2">
                <label className="mh-label">
                  Nom
                  <input
                    className="mh-input"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    required
                    placeholder="Ex. Vacances Lomé 2024"
                  />
                </label>
                <label className="mh-label">
                  Description
                  <input
                    className="mh-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optionnel"
                  />
                </label>
              </div>
              <button type="submit" className="mh-albums-btn-new" style={{ marginTop: '0.75rem' }}>
                Créer l’album
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="mh-albums-loading">Chargement des albums…</div>
        ) : albums.length === 0 && lectureSeule ? (
          <div className="mh-albums-empty">
            <p>Aucun album pour le moment.</p>
          </div>
        ) : (
          <div className="mh-albums-grid">
            {albums.map((album, i) => {
              const img = coverImage(album)
              const n = album.souvenirs?.length || 0
              return (
                <button
                  key={album.id}
                  type="button"
                  className="mh-album-gallery-card"
                  onClick={() => setAlbumSelec(album)}
                >
                  <div
                    className="mh-album-gallery-visual"
                    style={{ background: albumCoverGradient(i) }}
                  >
                    {img ? (
                      <img src={img} alt="" />
                    ) : (
                      <span className="mh-album-gallery-emoji" aria-hidden>
                        {albumEmoji(album.nom, album.description)}
                      </span>
                    )}
                    <span className="mh-album-gallery-badge">{countLabel(n)}</span>
                  </div>
                  <div className="mh-album-gallery-info">
                    <h2 className="mh-album-gallery-name">{album.nom}</h2>
                    <p className="mh-album-gallery-meta">{albumMetaLine(album)}</p>
                  </div>
                </button>
              )
            })}

            {!lectureSeule && (
              <button
                type="button"
                className="mh-album-gallery-card mh-album-gallery-card--create"
                onClick={() => setShowForm(true)}
              >
                <span className="mh-album-gallery-create-plus" aria-hidden>
                  +
                </span>
                <span className="mh-album-gallery-create-label">Créer un album</span>
              </button>
            )}
          </div>
        )}

        {albumSelec && (
          <div
            className="mh-album-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="album-detail-title"
            onClick={() => setAlbumSelec(null)}
          >
            <div className="mh-album-detail-panel" onClick={(e) => e.stopPropagation()}>
              <div className="mh-album-detail-head">
                <div>
                  <h2 id="album-detail-title" className="mh-album-detail-title">
                    {albumSelec.nom}
                  </h2>
                  <p className="mh-album-gallery-meta">{albumMetaLine(albumSelec)}</p>
                  {albumSelec.description && (
                    <p style={{ fontSize: '0.88rem', marginTop: '0.35rem', color: 'var(--text-mid)' }}>
                      {albumSelec.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="mh-album-detail-close"
                  aria-label="Fermer"
                  onClick={() => setAlbumSelec(null)}
                >
                  ✕
                </button>
              </div>

              {albumSelec.souvenirs?.length > 0 ? (
                <div className="mh-album-detail-thumbs">
                  {albumSelec.souvenirs.map((as) => (
                    <div key={as.souvenir.id} className="mh-album-detail-thumb">
                      {as.souvenir.fichier_url ? (
                        <img src={as.souvenir.fichier_url} alt="" />
                      ) : (
                        <span style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                          📸
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mh-albums-empty" style={{ padding: '1.5rem 0' }}>
                  Aucun souvenir dans cet album.
                </p>
              )}

              {!lectureSeule && (
                <>
                  <label className="mh-label">
                    Ajouter un souvenir
                    <select
                      className="mh-input"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          ajouterSouvenirAlbum(albumSelec.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Choisir un souvenir…</option>
                      {souvenirs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.titre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mh-album-detail-actions">
                    <button
                      type="button"
                      className="mh-btn mh-btn-ghost-danger"
                      onClick={() => supprimerAlbum(albumSelec.id)}
                    >
                      Supprimer l’album
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
