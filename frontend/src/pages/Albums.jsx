import { useState, useEffect } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/PageHeader'
import { getStoredUser } from '../lib/userStorage'

const COULEURS = ['#dce8f0', '#e8d4c4', '#dce8df', '#f0e6c8', '#e8dfd0']

export default function Albums() {
  const utilisateur = getStoredUser()
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
      setAlbums(rep.data.data)
    } catch (err) {
      console.error('Erreur albums:', err)
    } finally {
      setLoading(false)
    }
  }

  const chargerSouvenirs = async () => {
    try {
      const rep = await api.get('/souvenirs')
      setSouvenirs(rep.data.data)
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
    }
  }

  const ajouterSouvenirAlbum = async (album_id, souvenir_id) => {
    try {
      await api.post(`/albums/${album_id}/souvenirs`, { souvenir_id })
      chargerAlbums()
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

  const sousTitre =
    albums.length > 0
      ? `${albums.length} album${albums.length > 1 ? 's' : ''}`
      : undefined

  return (
    <AppLayout
      activePath="/albums"
      sidebar={
        <>
          <div className="mh-side-label">Albums</div>
          {albums.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className={`mh-side-item ${albumSelec?.id === a.id ? 'mh-side-item--active' : ''}`}
              onClick={() => setAlbumSelec(albumSelec?.id === a.id ? null : a)}
            >
              <span
                className="mh-album-dot"
                style={{ background: COULEURS[i % COULEURS.length] }}
              />
              {a.nom}
            </button>
          ))}
        </>
      }
    >
      <div className="mh-page-content">
        <PageHeader title="Albums" family={utilisateur.famille} subtitle={sousTitre}>
          <button type="button" onClick={() => setShowForm(!showForm)} className="mh-btn mh-btn-primary">
            {showForm ? 'Annuler' : '+ Album'}
          </button>
        </PageHeader>

        {showForm && (
          <div className="mh-form-panel mh-mirror-surface">
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
                  />
                </label>
                <label className="mh-label">
                  Description
                  <input
                    className="mh-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
              </div>
              <button type="submit" className="mh-btn mh-btn-primary" style={{ marginTop: '0.75rem' }}>
                Créer
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="mh-page-loading">Chargement…</div>
        ) : albums.length === 0 ? (
          <div className="mh-page-empty">
            <p>Aucun album.</p>
            <button
              type="button"
              className="mh-btn mh-btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setShowForm(true)}
            >
              + Créer un album
            </button>
          </div>
        ) : (
          <div className="mh-album-grid">
            {albums.map((album, i) => (
              <article key={album.id} className="mh-album-card mh-mirror-surface">
                <div
                  className="mh-album-cover"
                  style={{ background: COULEURS[i % COULEURS.length] }}
                >
                  {album.souvenirs.length > 0 && album.souvenirs[0].souvenir.fichier_url ? (
                    <img src={album.souvenirs[0].souvenir.fichier_url} alt="" />
                  ) : (
                    <span style={{ fontSize: '2.5rem' }} aria-hidden>
                      📸
                    </span>
                  )}
                  <span className="mh-album-count">
                    {album.souvenirs.length} souvenir{album.souvenirs.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mh-album-body">
                  <div className="mh-album-title">{album.nom}</div>
                  {album.description && <div className="mh-album-desc">{album.description}</div>}
                  <div className="mh-album-meta">
                    {album.createur.prenom} {album.createur.nom}
                  </div>
                  <div className="mh-album-actions">
                    <button
                      type="button"
                      className="mh-btn mh-btn-primary"
                      onClick={() => setAlbumSelec(albumSelec?.id === album.id ? null : album)}
                    >
                      {albumSelec?.id === album.id ? 'Fermer' : 'Ajouter'}
                    </button>
                    <button type="button" className="mh-btn mh-btn-ghost-danger" onClick={() => supprimerAlbum(album.id)}>
                      Supprimer
                    </button>
                  </div>
                  {albumSelec?.id === album.id && (
                    <label className="mh-label">
                      Souvenir
                      <select
                        className="mh-input"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            ajouterSouvenirAlbum(album.id, e.target.value)
                            e.target.value = ''
                          }
                        }}
                      >
                        <option value="">Choisir…</option>
                        {souvenirs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.titre}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {album.souvenirs.length > 0 && (
                    <div className="mh-album-mini-grid">
                      {album.souvenirs.slice(0, 4).map((as) => (
                        <div key={as.souvenir.id} className="mh-album-mini">
                          {as.souvenir.fichier_url ? (
                            <img src={as.souvenir.fichier_url} alt="" />
                          ) : (
                            <span style={{ display: 'grid', placeItems: 'center', height: '100%' }}>📸</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
            <button type="button" className="mh-album-card mh-album-card--new" onClick={() => setShowForm(true)}>
              <span style={{ fontSize: '2rem' }}>+</span>
              Nouvel album
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
