import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import SouvenirFeedPost from '../components/SouvenirFeedPost'
import { getStoredUser } from '../lib/userStorage'
import { peutEcrire } from '../lib/roles'
import { primaryMediaUrl } from '../lib/mediaUrl'
import { souvenirMatchesSearch } from '../lib/souvenirSearch'
import { fetchAlbumsAuto } from '../lib/platformApi'
import {
  albumCoverGradient,
  albumEmoji,
  albumMetaLine
} from '../lib/albumPresentation'

function albumSouvenirList(album) {
  return (album?.souvenirs || []).map((as) => as.souvenir).filter(Boolean)
}

function resolveSouvenirComplet(stub, allSouvenirs) {
  if (!stub) return null
  return allSouvenirs.find((s) => s.id === stub.id) || stub
}

function formatSouvenirDate(s) {
  if (!s?.date_souvenir) return ''
  try {
    return new Date(s.date_souvenir).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

export default function Albums() {
  const utilisateur = getStoredUser()
  const lectureSeule = !peutEcrire(utilisateur?.role)
  const [albums, setAlbums] = useState([])
  const [souvenirs, setSouvenirs] = useState([])
  const [reactions, setReactions] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [albumSelec, setAlbumSelec] = useState(null)
  const [souvenirFocusId, setSouvenirFocusId] = useState(null)
  const [rechercheAlbum, setRechercheAlbum] = useState('')
  const [recherchePicker, setRecherchePicker] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [pickerIds, setPickerIds] = useState([])
  const [addingSouvenirs, setAddingSouvenirs] = useState(false)
  const [form, setForm] = useState({ nom: '', description: '', prive: false })

  const [autoAlbums, setAutoAlbums] = useState(null)

  const ouvrirAutoAlbum = (label, ids) => {
    const liste = ids.map((id) => resolveSouvenirComplet({ id }, souvenirs)).filter(Boolean)
    setAlbumSelec({
      id: `auto-${label}`,
      nom: label,
      description: 'Album généré automatiquement',
      souvenirs: liste.map((s) => ({ souvenir: s })),
      _auto: true
    })
    setSouvenirFocusId(null)
    setRechercheAlbum('')
    setShowPicker(false)
  }

  const chargerAlbums = useCallback(async () => {
    try {
      setLoading(true)
      const rep = await api.get('/albums')
      setAlbums(rep.data.data || [])
    } catch (err) {
      console.error('Erreur albums:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const chargerSouvenirs = useCallback(async () => {
    try {
      const rep = await api.get('/souvenirs', { params: { limit: 100 } })
      const data = rep.data.data || []
      setSouvenirs(data)
      const reactionsData = {}
      data.forEach((s) => {
        reactionsData[s.id] = s.reactions || []
      })
      setReactions(reactionsData)
    } catch (err) {
      console.error('Erreur souvenirs:', err)
    }
  }, [])

  useEffect(() => {
    chargerAlbums()
    chargerSouvenirs()
    fetchAlbumsAuto().then(setAutoAlbums).catch(() => setAutoAlbums(null))
  }, [chargerAlbums, chargerSouvenirs])

  useEffect(() => {
    if (!albumSelec || albumSelec._auto) return
    const fresh = albums.find((a) => a.id === albumSelec.id)
    if (fresh) setAlbumSelec(fresh)
  }, [albums, albumSelec?.id])

  const fermerDetail = () => {
    setAlbumSelec(null)
    setSouvenirFocusId(null)
    setRechercheAlbum('')
    setRecherchePicker('')
    setShowPicker(false)
    setPickerIds([])
  }

  const ouvrirAlbum = (album) => {
    const fresh = albums.find((a) => a.id === album.id) || album
    setAlbumSelec(fresh)
    setSouvenirFocusId(null)
    setRechercheAlbum('')
    setRecherchePicker('')
    setShowPicker(false)
    setPickerIds([])
  }

  const creerAlbum = async (e) => {
    e.preventDefault()
    try {
      await api.post('/albums', { ...form, prive: form.prive })
      setForm({ nom: '', description: '', prive: false })
      setShowForm(false)
      await chargerAlbums()
    } catch (err) {
      console.error('Erreur creation album:', err)
      alert(err.response?.data?.message || 'Impossible de créer l’album')
    }
  }

  const ajouterSouvenirsSelection = async () => {
    if (!albumSelec || pickerIds.length === 0) return
    setAddingSouvenirs(true)
    try {
      for (const souvenir_id of pickerIds) {
        await api.post(`/albums/${albumSelec.id}/souvenirs`, { souvenir_id })
      }
      await chargerAlbums()
      setShowPicker(false)
      setPickerIds([])
      setRecherchePicker('')
    } catch (err) {
      console.error('Erreur ajout souvenir:', err)
      alert(err.response?.data?.message || 'Impossible d’ajouter les souvenirs')
    } finally {
      setAddingSouvenirs(false)
    }
  }

  const togglePickerId = (id) => {
    setPickerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const supprimerAlbum = async (id) => {
    if (!window.confirm('Supprimer cet album ?')) return
    try {
      await api.delete(`/albums/${id}`)
      fermerDetail()
      chargerAlbums()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const coverImage = (album) => {
    for (const s of albumSouvenirList(album)) {
      const full = resolveSouvenirComplet(s, souvenirs)
      const url = primaryMediaUrl(full) || full?.fichier_url
      if (url) return url
    }
    return null
  }

  const countLabel = (n) => `${n} souvenir${n > 1 ? 's' : ''}`

  const listeAlbumComplets = useMemo(() => {
    if (!albumSelec) return []
    return albumSouvenirList(albumSelec)
      .map((stub) => resolveSouvenirComplet(stub, souvenirs))
      .filter(Boolean)
  }, [albumSelec, souvenirs])

  const listeAlbumFiltree = useMemo(
    () => listeAlbumComplets.filter((s) => souvenirMatchesSearch(s, rechercheAlbum)),
    [listeAlbumComplets, rechercheAlbum]
  )

  const souvenirFocus = useMemo(
    () => listeAlbumComplets.find((s) => s.id === souvenirFocusId) || null,
    [listeAlbumComplets, souvenirFocusId]
  )

  const idsDansAlbum = useMemo(
    () => new Set(listeAlbumComplets.map((s) => s.id)),
    [listeAlbumComplets]
  )
  const souvenirsDisponibles = useMemo(
    () =>
      souvenirs
        .filter((s) => !idsDansAlbum.has(s.id))
        .filter((s) => souvenirMatchesSearch(s, recherchePicker)),
    [souvenirs, idsDansAlbum, recherchePicker]
  )

  const setReactionsFor = (souvenirId, list) => {
    setReactions((prev) => ({ ...prev, [souvenirId]: list }))
  }

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
              <label className="mh-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.prive}
                  onChange={(e) => setForm({ ...form, prive: e.target.checked })}
                />
                Album privé (visible seulement par vous)
              </label>
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
          <>
            {autoAlbums && (autoAlbums.parAnnee?.length > 0 || autoAlbums.favoris?.length > 0) && (
              <section className="mh-albums-auto-section" style={{ marginBottom: '1.5rem' }}>
                <h2 className="mh-albums-title" style={{ fontSize: '1.15rem' }}>Albums intelligents</h2>
                <div className="mh-platform-tabs">
                  {autoAlbums.parAnnee?.slice(0, 6).map((a) => (
                    <button
                      key={a.annee}
                      type="button"
                      className="mh-platform-tab"
                      onClick={() => ouvrirAutoAlbum(`Album ${a.annee}`, a.souvenir_ids)}
                    >
                      📅 {a.annee} ({a.count})
                    </button>
                  ))}
                  {autoAlbums.favoris?.length > 0 && (
                    <button
                      type="button"
                      className="mh-platform-tab"
                      onClick={() => ouvrirAutoAlbum('Favoris', autoAlbums.favoris)}
                    >
                      ⭐ Favoris ({autoAlbums.favoris.length})
                    </button>
                  )}
                </div>
              </section>
            )}
          <div className="mh-albums-grid">
            {albums.map((album, i) => {
              const img = coverImage(album)
              const n = album.souvenirs?.length || 0
              return (
                <button
                  key={album.id}
                  type="button"
                  className="mh-album-gallery-card"
                  onClick={() => ouvrirAlbum(album)}
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
          </>
        )}

        {albumSelec && (
          <div
            className="mh-album-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="album-detail-title"
            onClick={fermerDetail}
          >
            <div
              className={`mh-album-detail-panel ${souvenirFocus ? 'mh-album-detail-panel--feed' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mh-album-detail-head">
                <div>
                  <h2 id="album-detail-title" className="mh-album-detail-title">
                    {albumSelec.nom}
                  </h2>
                  <p className="mh-album-gallery-meta">{albumMetaLine(albumSelec)}</p>
                  {albumSelec.description && (
                    <p className="mh-album-detail-desc">{albumSelec.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="mh-album-detail-close"
                  aria-label="Fermer"
                  onClick={fermerDetail}
                >
                  ✕
                </button>
              </div>

              {souvenirFocus ? (
                <section className="mh-album-detail-section mh-album-feed-view">
                  <button
                    type="button"
                    className="mh-album-back-btn"
                    onClick={() => setSouvenirFocusId(null)}
                  >
                    ← Retour à l’album
                  </button>
                  <SouvenirFeedPost
                    souvenir={souvenirFocus}
                    utilisateur={utilisateur}
                    reactions={reactions[souvenirFocus.id] || []}
                    onReactionsChange={(list) => setReactionsFor(souvenirFocus.id, list)}
                    className="mh-album-feed-post"
                  />
                </section>
              ) : (
                <section className="mh-album-detail-section">
                  <h3 className="mh-album-detail-section-title">
                    Souvenirs dans cet album ({listeAlbumComplets.length})
                  </h3>

                  {listeAlbumComplets.length > 0 && (
                    <div className="mh-album-search-wrap">
                      <p className="mh-feed-toolbar-label">Rechercher dans l’album</p>
                      <div className="mh-search-bar">
                        <span aria-hidden="true">🔍</span>
                        <input
                          type="search"
                          placeholder="Titre, date, lieu, personne…"
                          value={rechercheAlbum}
                          onChange={(e) => setRechercheAlbum(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {listeAlbumComplets.length > 0 ? (
                    listeAlbumFiltree.length > 0 ? (
                      <ul className="mh-album-souvenir-list">
                        {listeAlbumFiltree.map((s) => {
                          const url = primaryMediaUrl(s) || s.fichier_url
                          return (
                            <li key={s.id}>
                              <button
                                type="button"
                                className="mh-album-souvenir-item mh-album-souvenir-item--clickable"
                                onClick={() => setSouvenirFocusId(s.id)}
                              >
                                <div className="mh-album-souvenir-thumb">
                                  {url ? (
                                    <img src={url} alt="" />
                                  ) : (
                                    <span className="mh-album-souvenir-thumb-fallback">📸</span>
                                  )}
                                </div>
                                <div className="mh-album-souvenir-text">
                                  <span className="mh-album-souvenir-titre">{s.titre}</span>
                                  <span className="mh-album-souvenir-meta">
                                    Voir comme dans le fil
                                    {formatSouvenirDate(s) ? ` · ${formatSouvenirDate(s)}` : ''}
                                  </span>
                                </div>
                                <span className="mh-album-souvenir-chevron" aria-hidden>
                                  ›
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="mh-albums-empty-inline">Aucun souvenir ne correspond à la recherche.</p>
                    )
                  ) : (
                    <p className="mh-albums-empty-inline">
                      Cet album est vide. Ajoutez des souvenirs ci-dessous.
                    </p>
                  )}
                </section>
              )}

              {!lectureSeule && !souvenirFocus && !albumSelec._auto && (
                <section className="mh-album-detail-section">
                  {!showPicker ? (
                    <button
                      type="button"
                      className="mh-albums-btn-new mh-albums-btn-add-souvenirs"
                      onClick={() => setShowPicker(true)}
                      disabled={
                        souvenirs.filter((s) => !idsDansAlbum.has(s.id)).length === 0
                      }
                    >
                      + Ajouter des souvenirs
                    </button>
                  ) : (
                    <div className="mh-album-picker">
                      <h3 className="mh-album-detail-section-title">Choisir des souvenirs</h3>
                      <div className="mh-album-search-wrap">
                        <div className="mh-search-bar">
                          <span aria-hidden="true">🔍</span>
                          <input
                            type="search"
                            placeholder="Rechercher un souvenir…"
                            value={recherchePicker}
                            onChange={(e) => setRecherchePicker(e.target.value)}
                          />
                        </div>
                      </div>
                      {souvenirsDisponibles.length === 0 ? (
                        <p className="mh-albums-empty-inline">
                          {recherchePicker.trim()
                            ? 'Aucun résultat pour cette recherche.'
                            : 'Tous les souvenirs sont déjà dans cet album.'}
                        </p>
                      ) : (
                        <ul className="mh-album-picker-list">
                          {souvenirsDisponibles.map((s) => {
                            const url = primaryMediaUrl(s) || s.fichier_url
                            const checked = pickerIds.includes(s.id)
                            return (
                              <li key={s.id}>
                                <label className="mh-album-picker-row">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePickerId(s.id)}
                                  />
                                  <span className="mh-album-picker-thumb">
                                    {url ? <img src={url} alt="" /> : <span>📸</span>}
                                  </span>
                                  <span className="mh-album-picker-label">
                                    <span className="mh-album-picker-titre">{s.titre}</span>
                                    {formatSouvenirDate(s) && (
                                      <span className="mh-album-picker-date">
                                        {formatSouvenirDate(s)}
                                      </span>
                                    )}
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      <div className="mh-album-picker-footer">
                        <button
                          type="button"
                          className="mh-btn mh-btn-secondary"
                          onClick={() => {
                            setShowPicker(false)
                            setPickerIds([])
                            setRecherchePicker('')
                          }}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          className="mh-albums-btn-new"
                          disabled={pickerIds.length === 0 || addingSouvenirs}
                          onClick={ajouterSouvenirsSelection}
                        >
                          {addingSouvenirs
                            ? 'Ajout…'
                            : `OK (${pickerIds.length} sélectionné${pickerIds.length > 1 ? 's' : ''})`}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mh-album-detail-actions">
                    <button
                      type="button"
                      className="mh-btn mh-btn-ghost-danger"
                      onClick={() => supprimerAlbum(albumSelec.id)}
                    >
                      Supprimer l’album
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
