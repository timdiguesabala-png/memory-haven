import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import AppLayout from '../components/AppLayout'
import StandardSidebar from '../components/StandardSidebar'
import UserAvatar from '../components/UserAvatar'
import ArbrePhotoPicker from '../components/ArbrePhotoPicker'
import {
  getArbreMemberInitials,
  getArbreMemberPhoto
} from '../services/arbreApi'

export default function Arbre() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const { darkMode } = useTheme()

  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [membreSelec, setMembreSelec] = useState(null)
  const [form, setForm] = useState({ nom: '', date_naissance: '', date_deces: '', biographie: '', parent_id: '' })

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#12101A' : '#F8F6FC', fontFamily: 'sans-serif' },
    nav: { background: darkMode ? '#1A1828' : '#2A2640', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: darkMode ? '#e0e0e0' : '#F8F6FC', fontSize: '18px', fontFamily: 'Georgia,serif', fontWeight: '500', flex: 1 },
    navLinks: { display: 'flex', gap: '6px' },
    navBtn: { background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F8F6FC', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    navBtnActive: { background: '#7B6BB8', color: '#2A2640', borderColor: '#7B6BB8', fontWeight: '500' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    navAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#7B6BB8', color: '#2A2640', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
    btnLogout: { background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F8F6FC', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    app: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '200px', background: darkMode ? '#221F32' : '#EDE8F5', borderRight: `1px solid ${darkMode ? '#12101A' : '#C5B8E0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#7A7394', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#4A4568', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#7B6BB8' : '#7B6BB8', color: '#FFF', fontWeight: '500' },
    statCard: { background: darkMode ? '#1A1828' : '#F8F6FC', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '8px', padding: '10px', marginBottom: '6px', textAlign: 'center' },
    statNum: { fontSize: '22px', fontFamily: 'Georgia,serif', color: '#5B4D9E', fontWeight: '500' },
    statLabel: { fontSize: '11px', color: darkMode ? '#a0a0a0' : '#7A7394', marginTop: '2px' },
    btnSideAdd: { width: '100%', background: '#5B4D9E', color: '#FFF', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '12px' },
    main: { flex: 1, padding: '1.5rem', overflowY: 'auto' },
    header: { marginBottom: '1.5rem' },
    titre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#2A2640', fontFamily: 'Georgia,serif', margin: '0 0 3px' },
    sousTitre: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#4A4568', margin: 0 },
    formCard: { background: darkMode ? '#221F32' : '#F8F6FC', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' },
    formTitre: { fontSize: '16px', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '1rem' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    formChamp: { marginBottom: '10px' },
    label: { display: 'block', fontSize: '12px', color: darkMode ? '#a0a0a0' : '#4A4568', marginBottom: '4px', fontWeight: '500' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, fontSize: '13px', background: darkMode ? '#12101A' : '#FFF', color: darkMode ? '#e0e0e0' : '#2A2640', outline: 'none', boxSizing: 'border-box' },
    btnSubmit: { background: '#5B4D9E', color: '#FFF', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' },
    vide: { textAlign: 'center', padding: '4rem', color: darkMode ? '#a0a0a0' : '#4A4568' },
    arbreWrap: { overflowX: 'auto', padding: '1rem 0' },
    arbre: { display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' },
    noeudWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
    noeud: { background: darkMode ? '#1A1828' : '#F8F6FC', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px', marginBottom: '4px' },
    fichePhoto: { display: 'flex', justifyContent: 'center', marginBottom: '10px' },
    noeudInfo: { flex: 1 },
    noeudNom: { fontSize: '14px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#2A2640' },
    noeudAnnees: { fontSize: '11px', color: darkMode ? '#a0a0a0' : '#7A7394', marginTop: '2px' },
    fichePopup: { background: darkMode ? '#1A1828' : '#FFF', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '12px', marginBottom: '8px', minWidth: '200px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
    ficheHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    ficheLigne: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#4A4568', marginBottom: '4px' },
    btnSupprimerFiche: { background: 'none', border: 'none', color: '#C06060', cursor: 'pointer', fontSize: '12px' },
    btnAjouterEnfant: { background: '#5B4D9E', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', marginTop: '8px' },
    enfantsWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    ligneVerticale: { width: '2px', height: '30px', background: darkMode ? '#7B6BB8' : '#C5B8E0' },
    enfantsRow: { display: 'flex', gap: '1.5rem', position: 'relative' }
  }

  useEffect(() => { chargerArbre() }, [])

  const chargerArbre = async () => {
    try { setLoading(true); const rep = await api.get('/arbre'); setMembres(rep.data.data) } 
    catch (err) { console.error('Erreur arbre:', err) } finally { setLoading(false) }
  }

  const ajouterMembre = async (e) => {
    e.preventDefault()
    try {
      await api.post('/arbre', {
        nom: form.nom, date_naissance: form.date_naissance || null,
        date_deces: form.date_deces || null, biographie: form.biographie || null,
        parent_id: form.parent_id || null
      })
      setForm({ nom: '', date_naissance: '', date_deces: '', biographie: '', parent_id: '' })
      setShowForm(false); chargerArbre()
    } catch (err) { console.error('Erreur ajout:', err) }
  }

  const supprimerMembre = async (id) => {
    if (!window.confirm('Supprimer ce membre ?')) return
    try { await api.delete('/arbre/' + id); chargerArbre() } 
    catch (err) { console.error('Erreur suppression:', err) }
  }

  const racines = membres.filter(m => !m.parent_id)
  const enfants = (parentId) => membres.filter(m => m.parent_id === parentId)

  const afficherAnnees = (membre) => {
    const naissance = membre.date_naissance ? new Date(membre.date_naissance).getFullYear() : null
    const deces = membre.date_deces ? new Date(membre.date_deces).getFullYear() : null
    if (naissance && deces) return `${naissance} - ${deces}`
    if (naissance && !deces) return `Né(e) en ${naissance}`
    return ''
  }

  const couleurs = [{ bg: '#C5B8E0', color: '#3D3268' }, { bg: '#C8D8E8', color: '#203060' }, { bg: '#C8E0C8', color: '#2A6030' }, { bg: '#E8C8D8', color: '#601840' }, { bg: '#D8C8E0', color: '#402060' }]

  const apresPhotoMiseAJour = (updated) => {
    setMembres((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, photo_url: updated.photo_url } : m))
    )
    setMembreSelec((s) =>
      s?.id === updated.id ? { ...s, photo_url: updated.photo_url } : s
    )
  }

  const NoeudArbre = ({ membre, niveau }) => {
    const sesEnfants = enfants(membre.id)
    const couleur = couleurs[niveau % couleurs.length]

    return (
      <div style={styles.noeudWrap}>
        <div style={styles.noeud} onClick={() => setMembreSelec(membreSelec?.id === membre.id ? null : membre)}>
          <UserAvatar
            initials={getArbreMemberInitials(membre.nom)}
            avatarUrl={getArbreMemberPhoto(membre)}
            size={48}
            className="mh-arbre-noeud-photo"
            fallbackStyle={{ background: couleur.bg, color: couleur.color }}
          />
          <div style={styles.noeudInfo}>
            <div style={styles.noeudNom}>{membre.nom}</div>
            {afficherAnnees(membre) && <div style={styles.noeudAnnees}>{afficherAnnees(membre)}</div>}
          </div>
        </div>

        {membreSelec?.id === membre.id && (
          <div style={styles.fichePopup} onClick={(e) => e.stopPropagation()}>
            <div style={styles.fichePhoto}>
              <ArbrePhotoPicker
                membre={membreSelec}
                size={72}
                onUpdated={apresPhotoMiseAJour}
              />
            </div>
            <div style={styles.ficheHeader}><strong>{membre.nom}</strong><button type="button" onClick={() => supprimerMembre(membre.id)} style={styles.btnSupprimerFiche}>🗑️ Supprimer</button></div>
            {membre.date_naissance && <p style={styles.ficheLigne}>📅 Naissance : {new Date(membre.date_naissance).toLocaleDateString('fr-FR')}</p>}
            {membre.date_deces && <p style={styles.ficheLigne}>⚰️ Décès : {new Date(membre.date_deces).toLocaleDateString('fr-FR')}</p>}
            {membre.biographie && <p style={styles.ficheLigne}>📖 {membre.biographie}</p>}
            <button type="button" onClick={() => { setForm({ ...form, parent_id: String(membre.id) }); setShowForm(true); setMembreSelec(null) }} style={styles.btnAjouterEnfant}>+ Ajouter un enfant</button>
          </div>
        )}

        {sesEnfants.length > 0 && (
          <div style={styles.enfantsWrap}>
            <div style={styles.ligneVerticale}></div>
            <div style={styles.enfantsRow}>{sesEnfants.map(enfant => <NoeudArbre key={enfant.id} membre={enfant} niveau={niveau + 1} />)}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <AppLayout
      activePath="/arbre"
      sidebar={
        <StandardSidebar active="arbre">
          <div className="mh-side-label">Stats</div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">{membres.length}</div>
            <div className="mh-stat-label">Membres</div>
          </div>
          <button type="button" className="mh-btn mh-btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </StandardSidebar>
      }
    >
        <div style={{ ...styles.main, padding: 0 }}>
          <div style={styles.header}>
            <h1 className="mh-title">🌳 Arbre généalogique</h1>
            <p className="mh-subtitle">
              {membres.length} membre{membres.length > 1 ? 's' : ''} · {utilisateur.famille}
            </p>
            <p className="mh-subtitle" style={{ marginTop: '0.35rem' }}>
              Cliquez sur un membre pour ajouter ou modifier sa photo.
            </p>
          </div>

          {showForm && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitre}>Ajouter un membre</h3>
              <form onSubmit={ajouterMembre}>
                <div style={styles.formRow}>
                  <div style={styles.formChamp}><label style={styles.label}>Nom complet *</label><input name="nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Kodjo Koffi" style={styles.input} required /></div>
                  <div style={styles.formChamp}><label style={styles.label}>Parent (optionnel)</label><select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} style={styles.input}><option value="">Aucun (racine)</option>{membres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formChamp}><label style={styles.label}>Date de naissance</label><input type="date" value={form.date_naissance} onChange={e => setForm({ ...form, date_naissance: e.target.value })} style={styles.input} /></div>
                  <div style={styles.formChamp}><label style={styles.label}>Date de décès</label><input type="date" value={form.date_deces} onChange={e => setForm({ ...form, date_deces: e.target.value })} style={styles.input} /></div>
                </div>
                <div style={styles.formChamp}><label style={styles.label}>Biographie</label><textarea value={form.biographie} onChange={e => setForm({ ...form, biographie: e.target.value })} placeholder="Quelques mots..." style={{ ...styles.input, height: '70px', resize: 'vertical' }} /></div>
                <button type="submit" style={styles.btnSubmit}>Ajouter à l'arbre</button>
              </form>
            </div>
          )}

          {loading ? <div style={styles.loading}>Chargement...</div> : membres.length === 0 ? (
            <div style={styles.vide}><p style={{ fontSize: '48px' }}>🌳</p><p>L'arbre est vide — ajoute ton premier membre !</p><button onClick={() => setShowForm(true)} style={{ ...styles.btnAdd, marginTop: '1rem' }}>+ Ajouter un membre</button></div>
          ) : (
            <div style={styles.arbreWrap}><div style={styles.arbre}>{racines.map(racine => <NoeudArbre key={racine.id} membre={racine} niveau={0} />)}</div></div>
          )}
        </div>
    </AppLayout>
  )
}