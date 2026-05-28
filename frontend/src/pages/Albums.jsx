import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import AppLayout from '../components/AppLayout'
import StandardSidebar from '../components/StandardSidebar'

export default function Albums() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()

  const [albums, setAlbums] = useState([])
  const [souvenirs, setSouvenirs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [albumSelec, setAlbumSelec] = useState(null)
  const [form, setForm] = useState({ nom: '', description: '' })

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#141210' : '#FDF6EE', fontFamily: 'sans-serif' },
    nav: { background: darkMode ? '#1E1A16' : '#3D2410', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: darkMode ? '#e0e0e0' : '#FDF6EE', fontSize: '18px', fontFamily: 'Georgia,serif', fontWeight: '500', flex: 1 },
    navLinks: { display: 'flex', gap: '6px' },
    navBtn: { background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#FDF6EE', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    navBtnActive: { background: '#C8956C', color: '#3D2410', borderColor: '#C8956C', fontWeight: '500' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    navAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#C8956C', color: '#3D2410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
    btnLogout: { background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#FDF6EE', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    app: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '200px', background: darkMode ? '#262220' : '#F5E6D3', borderRight: `1px solid ${darkMode ? '#141210' : '#E8C9A0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#B08060', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#7A5035', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#C8956C' : '#C8956C', color: '#FFF', fontWeight: '500' },
    sideBadge: { marginLeft: 'auto', background: darkMode ? '#C8956C' : '#9B6240', color: '#FFF', fontSize: '10px', padding: '1px 6px', borderRadius: '8px' },
    main: { flex: 1, padding: '1.5rem', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' },
    titre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#3D2410', fontFamily: 'Georgia,serif', margin: '0 0 3px' },
    sousTitre: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#7A5035', margin: 0 },
    btnAdd: { background: '#9B6240', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '16px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    formCard: { background: darkMode ? '#262220' : '#FFF9F3', border: `1px solid ${darkMode ? '#C8956C' : '#E8C9A0'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' },
    formTitre: { fontSize: '16px', color: darkMode ? '#e0e0e0' : '#3D2410', marginBottom: '1rem' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    formChamp: { marginBottom: '10px' },
    label: { display: 'block', fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A5035', marginBottom: '4px', fontWeight: '500' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${darkMode ? '#C8956C' : '#E8C9A0'}`, fontSize: '13px', background: darkMode ? '#141210' : '#FFF', color: darkMode ? '#e0e0e0' : '#3D2410', outline: 'none', boxSizing: 'border-box' },
    btnSubmit: { background: '#9B6240', color: '#FFF', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#7A5035' },
    vide: { textAlign: 'center', padding: '4rem', color: darkMode ? '#a0a0a0' : '#7A5035' },
    grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
    albumCard: { background: darkMode ? '#1E1A16' : '#FFF9F3', border: `1px solid ${darkMode ? '#C8956C' : '#E8C9A0'}`, borderRadius: '14px', overflow: 'hidden' },
    albumCouverture: { height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    couvertureImg: { width: '100%', height: '100%', objectFit: 'cover' },
    albumCount: { position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', color: '#FFF', fontSize: '11px', padding: '3px 8px', borderRadius: '8px' },
    albumBody: { padding: '1rem' },
    albumNom: { fontSize: '15px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#3D2410', marginBottom: '3px' },
    albumDesc: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#7A5035', marginBottom: '4px' },
    albumMeta: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#B08060', marginBottom: '10px' },
    albumActions: { display: 'flex', gap: '8px', marginBottom: '8px' },
    btnAlbumAction: { background: '#9B6240', color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
    btnSupprimer: { background: 'none', border: `1px solid ${darkMode ? '#C8956C' : '#F09595'}`, color: darkMode ? '#C8956C' : '#C06060', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
    ajouterSection: { marginTop: '8px', marginBottom: '8px' },
    miniGalerie: { display: 'flex', gap: '4px', marginTop: '8px' },
    miniCard: { width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 },
    miniImg: { width: '100%', height: '100%', objectFit: 'cover' },
    miniPlaceholder: { width: '100%', height: '100%', background: '#F5E6D3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
    albumCardNew: { background: darkMode ? '#262220' : '#FFF5EB', border: `1.5px dashed ${darkMode ? '#C8956C' : '#E8C9A0'}`, borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', cursor: 'pointer', gap: '8px' },
    newIcon: { fontSize: '32px', color: '#C8956C', fontWeight: '300' },
    newText: { fontSize: '14px', color: '#9B6240', fontWeight: '500' }
  }

  useEffect(() => { chargerAlbums(); chargerSouvenirs() }, [])

  const chargerAlbums = async () => {
    try { setLoading(true); const rep = await api.get('/albums'); setAlbums(rep.data.data) } 
    catch (err) { console.error('Erreur albums:', err) } finally { setLoading(false) }
  }

  const chargerSouvenirs = async () => {
    try { const rep = await api.get('/souvenirs'); setSouvenirs(rep.data.data) } 
    catch (err) { console.error('Erreur souvenirs:', err) }
  }

  const creerAlbum = async (e) => {
    e.preventDefault()
    try { await api.post('/albums', form); setForm({ nom: '', description: '' }); setShowForm(false); chargerAlbums() } 
    catch (err) { console.error('Erreur creation album:', err) }
  }

  const ajouterSouvenirAlbum = async (album_id, souvenir_id) => {
    try { await api.post(`/albums/${album_id}/souvenirs`, { souvenir_id }); chargerAlbums(); alert('Souvenir ajouté à l\'album !') } 
    catch (err) { console.error('Erreur ajout souvenir:', err) }
  }

  const supprimerAlbum = async (id) => {
    if (!window.confirm('Supprimer cet album ?')) return
    try { await api.delete('/albums/' + id); setAlbumSelec(null); chargerAlbums() } 
    catch (err) { console.error('Erreur suppression:', err) }
  }

  const initiales = (nom, prenom) => (prenom?.[0] || '') + (nom?.[0] || '')
  const couleurs = ['#F5E6D3', '#E8D0E8', '#D0E8D0', '#D0D8E8', '#E8E0D0']

  return (
    <AppLayout
      activePath="/albums"
      sidebar={
        <StandardSidebar active="albums">
          <div className="mh-side-label">Mes albums</div>
          {albums.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className={`mh-side-item ${albumSelec?.id === a.id ? 'mh-side-item--active' : ''}`}
              onClick={() => setAlbumSelec(albumSelec?.id === a.id ? null : a)}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: couleurs[i % couleurs.length],
                  flexShrink: 0
                }}
              />
              {a.nom}
            </button>
          ))}
        </StandardSidebar>
      }
    >
        <div style={{ ...styles.main, padding: 0 }}>
          <div style={styles.header}>
            <div>
              <h1 className="mh-title">📸 Albums photo</h1>
              <p className="mh-subtitle">
                {albums.length} album{albums.length > 1 ? 's' : ''} · {utilisateur.famille}
              </p>
            </div>
            <button type="button" onClick={() => setShowForm(!showForm)} className="mh-btn mh-btn-primary">
              {showForm ? 'Annuler' : '+ Nouvel album'}
            </button>
          </div>

          {showForm && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitre}>Créer un nouvel album</h3>
              <form onSubmit={creerAlbum}>
                <div style={styles.formRow}>
                  <div style={styles.formChamp}><label style={styles.label}>Nom de l'album</label><input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Vacances 2024" style={styles.input} required /></div>
                  <div style={styles.formChamp}><label style={styles.label}>Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optionnelle" style={styles.input} /></div>
                </div>
                <button type="submit" style={styles.btnSubmit}>Créer l'album</button>
              </form>
            </div>
          )}

          {loading ? <div style={styles.loading}>Chargement...</div> : albums.length === 0 ? (
            <div style={styles.vide}><p style={{ fontSize: '48px' }}>📸</p><p>Aucun album — crée ton premier album !</p><button onClick={() => setShowForm(true)} style={{ ...styles.btnAdd, marginTop: '1rem' }}>+ Créer un album</button></div>
          ) : (
            <div style={styles.grille}>
              {albums.map((album, i) => (
                <div key={album.id} style={styles.albumCard}>
                  <div style={{ ...styles.albumCouverture, background: couleurs[i % couleurs.length] }}>
                    {album.souvenirs.length > 0 && album.souvenirs[0].souvenir.fichier_url ? <img src={album.souvenirs[0].souvenir.fichier_url} alt={album.nom} style={styles.couvertureImg} /> : <span style={{ fontSize: '40px' }}>📸</span>}
                    <div style={styles.albumCount}>{album.souvenirs.length} souvenir{album.souvenirs.length > 1 ? 's' : ''}</div>
                  </div>
                  <div style={styles.albumBody}>
                    <div style={styles.albumNom}>{album.nom}</div>
                    {album.description && <div style={styles.albumDesc}>{album.description}</div>}
                    <div style={styles.albumMeta}>Par {album.createur.prenom} {album.createur.nom}</div>
                    <div style={styles.albumActions}>
                      <button onClick={() => setAlbumSelec(albumSelec?.id === album.id ? null : album)} style={styles.btnAlbumAction}>{albumSelec?.id === album.id ? 'Fermer' : '+ Ajouter souvenir'}</button>
                      <button onClick={() => supprimerAlbum(album.id)} style={styles.btnSupprimer}>Supprimer</button>
                    </div>
                    {albumSelec?.id === album.id && (
                      <div style={styles.ajouterSection}>
                        <label style={styles.label}>Choisir un souvenir</label>
                        <select style={styles.input} onChange={e => { if (e.target.value) { ajouterSouvenirAlbum(album.id, e.target.value); e.target.value = '' } }}>
                          <option value="">Sélectionner...</option>
                          {souvenirs.map(s => <option key={s.id} value={s.id}>{s.titre} ({s.type})</option>)}
                        </select>
                      </div>
                    )}
                    {album.souvenirs.length > 0 && (
                      <div style={styles.miniGalerie}>
                        {album.souvenirs.slice(0, 4).map(as => (
                          <div key={as.souvenir.id} style={styles.miniCard}>
                            {as.souvenir.fichier_url ? <img src={as.souvenir.fichier_url} alt={as.souvenir.titre} style={styles.miniImg} /> : <div style={styles.miniPlaceholder}>📸</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div style={styles.albumCardNew} onClick={() => setShowForm(true)}><div style={styles.newIcon}>+</div><div style={styles.newText}>Nouvel album</div></div>
            </div>
          )}
        </div>
    </AppLayout>
  )
}