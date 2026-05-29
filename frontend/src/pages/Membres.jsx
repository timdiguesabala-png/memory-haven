import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import AppLayout from '../components/AppLayout'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker'
import UserAvatar from '../components/UserAvatar'
import { getStoredUser, updateStoredUser } from '../lib/userStorage'
import { refreshCurrentUser } from '../services/profileApi'

/** Site public — NE PAS MODIFIER (liens d'invitation) */
const INVITE_SITE = 'https://memory-haven-frontend.vercel.app'

function buildPublicInviteLink(code, email = '', role = 'MEMBRE') {
  if (!code) return ''
  const params = new URLSearchParams({
    mode: 'rejoindre',
    code: String(code).trim().toUpperCase()
  })
  if (email?.trim()) params.set('email', email.trim())
  if (role) params.set('role', role)
  return `${INVITE_SITE}/register?${params.toString()}`
}

export default function Membres() {
  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())
  const { darkMode } = useTheme()

  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'MEMBRE' })
  const [erreur, setErreur] = useState('')
  const [familyCode, setFamilyCode] = useState(() => getStoredUser()?.code_invitation || '')

  const lienPublic = useMemo(
    () => buildPublicInviteLink(familyCode, form.email, form.role),
    [familyCode, form.email, form.role]
  )

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#12101A' : '#D0C2E4', fontFamily: 'sans-serif' },
    nav: { background: darkMode ? '#1A1828' : '#2A2640', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 },
    navLogo: { color: darkMode ? '#e0e0e0' : '#F5F0FA', fontSize: '18px', fontFamily: 'Georgia,serif', fontWeight: '500', flex: 1 },
    navLinks: { display: 'flex', gap: '6px' },
    navBtn: { background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F5F0FA', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    navBtnActive: { background: '#7B6BB8', color: '#2A2640', borderColor: '#7B6BB8', fontWeight: '500' },
    navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    navAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#7B6BB8', color: '#2A2640', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
    navNom: { color: darkMode ? '#e0e0e0' : '#C5B8E0', fontSize: '12px' },
    btnLogout: { background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(253,246,238,0.3)'}`, color: darkMode ? '#e0e0e0' : '#F5F0FA', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' },
    app: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
    sidebar: { width: '200px', background: darkMode ? '#221F32' : '#C8B8DC', borderRight: `1px solid ${darkMode ? '#12101A' : '#C5B8E0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#7A7394', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#4A4568', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#7B6BB8' : '#7B6BB8', color: '#FFF', fontWeight: '500' },
    sideBadge: { marginLeft: 'auto', background: darkMode ? '#7B6BB8' : '#5B4D9E', color: '#FFF', fontSize: '10px', padding: '1px 6px', borderRadius: '8px' },
    statCard: { background: darkMode ? '#1A1828' : '#D0C2E4', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '8px', padding: '10px', marginBottom: '6px', textAlign: 'center' },
    statNum: { fontSize: '22px', fontFamily: 'Georgia,serif', color: '#5B4D9E', fontWeight: '500' },
    statLabel: { fontSize: '11px', color: darkMode ? '#a0a0a0' : '#7A7394', marginTop: '2px' },
    main: { flex: 1, padding: '1.5rem', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' },
    titre: { fontSize: '22px', color: darkMode ? '#e0e0e0' : '#2A2640', fontFamily: 'Georgia,serif', margin: '0 0 3px' },
    sousTitre: { fontSize: '13px', color: darkMode ? '#a0a0a0' : '#4A4568', margin: 0 },
    btnAdd: { background: '#5B4D9E', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '16px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    successBox: { background: '#EAF3DE', border: '2px solid #97C459', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' },
    successTitle: { fontSize: '14px', fontWeight: '600', color: '#27500A', marginBottom: '8px' },
    successLink: { fontSize: '12px', color: '#1a4d08', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '8px', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #97C459' },
    btnCopier: { background: '#3B6D11', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    formCard: { background: darkMode ? '#221F32' : '#D0C2E4', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' },
    formTitre: { fontSize: '16px', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '1rem' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    formChamp: { marginBottom: '10px' },
    label: { display: 'block', fontSize: '12px', color: darkMode ? '#a0a0a0' : '#4A4568', marginBottom: '4px', fontWeight: '500' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, fontSize: '13px', background: darkMode ? '#12101A' : '#B8A8CC', color: darkMode ? '#e0e0e0' : '#2A2640', outline: 'none', boxSizing: 'border-box' },
    btnSubmit: { background: '#5B4D9E', color: '#FFF', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    erreur: { background: '#FCEBEB', color: '#A32D2D', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' },
    grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
    membreCard: { background: darkMode ? '#1A1828' : '#D0C2E4', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '12px' },
    membreCardInvite: { background: darkMode ? '#221F32' : '#F3F0FA', border: `1.5px dashed ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
    membreInfo: { flex: 1 },
    membreNom: { fontSize: '15px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '2px' },
    membreEmail: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A7394', marginBottom: '6px' },
    roleBadge: { fontSize: '11px', padding: '3px 10px', borderRadius: '8px', fontWeight: '500', display: 'inline-block' },
    derniereConnexion: { fontSize: '11px', color: darkMode ? '#a0a0a0' : '#7A7394', marginTop: '4px' },
    membreActions: { display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 },
    selectRole: { padding: '5px 8px', borderRadius: '8px', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, fontSize: '12px', background: darkMode ? '#12101A' : '#B8A8CC', color: darkMode ? '#e0e0e0' : '#2A2640', cursor: 'pointer' },
    btnDesactiver: { background: 'none', border: 'none', color: '#C06060', cursor: 'pointer', fontSize: '12px' },
    inviteIcon: { width: '48px', height: '48px', borderRadius: '50%', background: '#C8B8DC', color: '#5B4D9E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '300', flexShrink: 0 },
    inviteText: { flex: 1 },
    inviteTitle: { fontSize: '14px', fontWeight: '500', color: '#5B4D9E', marginBottom: '2px' },
    inviteDesc: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A7394' }
  }

  const chargerCodeFamille = async () => {
    const stored = getStoredUser()?.code_invitation
    if (stored) {
      setFamilyCode(stored)
      return stored
    }
    try {
      const rep = await api.get('/membres/code-invitation')
      const code = rep.data.data?.code
      if (code) {
        setFamilyCode(code)
        updateStoredUser({ code_invitation: code })
      }
      return code
    } catch {
      return null
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { utilisateur: u } = await refreshCurrentUser()
        setUtilisateur(u)
        if (u?.code_invitation) setFamilyCode(u.code_invitation)
      } catch {
        await chargerCodeFamille()
      }
      chargerMembres()
    }
    init()

    const onFocus = () => chargerMembres()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const chargerMembres = async () => {
    try {
      setLoading(true)
      const rep = await api.get('/membres')
      setMembres(rep.data.data)
    } catch (err) {
      console.error('Erreur membres:', err)
    } finally {
      setLoading(false)
    }
  }

  const copierLienPublic = async () => {
    if (!lienPublic) {
      setErreur('Code famille introuvable — reconnectez-vous')
      return
    }
    if (lienPublic.includes('localhost')) {
      setErreur('Erreur interne : lien localhost bloqué')
      return
    }
    try {
      await navigator.clipboard.writeText(lienPublic)
      alert(`Lien copié !\n\n${lienPublic}\n\nEnvoyez-le par SMS/WhatsApp.`)
    } catch {
      prompt('Copiez ce lien :', lienPublic)
    }
  }

  const inviterMembre = async (e) => {
    e.preventDefault()
    setErreur('')
    const code = familyCode || (await chargerCodeFamille())
    if (!code) {
      setErreur('Code d\'invitation introuvable')
      return
    }
    try {
      await api.post('/membres/inviter', form)
    } catch {
      /* le lien public suffit */
    }
    await copierLienPublic()
    setForm({ email: '', role: 'MEMBRE' })
    setShowForm(false)
  }

  const changerRole = async (id, role) => {
    try {
      await api.put(`/membres/${id}/role`, { role })
      chargerMembres()
    } catch (err) {
      console.error('Erreur role:', err)
    }
  }

  const desactiverMembre = async (id) => {
    if (!window.confirm('Désactiver ce membre ?')) return
    try {
      await api.put(`/membres/${id}/desactiver`)
      chargerMembres()
    } catch (err) {
      console.error('Erreur desactivation:', err)
    }
  }

  const couleurRole = (role) => {
    const couleurs = {
      SUPER_ADMIN: { bg: '#FFF0E0', color: '#8B5E30' },
      ADMIN: { bg: '#E8F0FF', color: '#4060A0' },
      MEMBRE: { bg: '#F0F8E8', color: '#4A7030' },
      LECTEUR: { bg: '#F0F0F0', color: '#666666' }
    }
    return couleurs[role] || couleurs.MEMBRE
  }

  const avatarCouleurs = [
    { bg: '#C5B8E0', color: '#3D3268' },
    { bg: '#C8D8E8', color: '#203060' },
    { bg: '#C8E0C8', color: '#2A6030' },
    { bg: '#E8C8D8', color: '#601840' },
    { bg: '#D8C8E0', color: '#402060' }
  ]

  return (
    <AppLayout
      activePath="/membres"
      sidebar={
        <>
          <div className="mh-side-label">Stats</div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">{membres.length}</div>
            <div className="mh-stat-label">Membres</div>
          </div>
          <div className="mh-stat-card">
            <div className="mh-stat-num">
              {membres.filter((m) => m.role === 'ADMIN' || m.role === 'SUPER_ADMIN').length}
            </div>
            <div className="mh-stat-label">Admins</div>
          </div>
        </>
      }
    >
      <div style={{ ...styles.main, padding: 0 }}>
        <div style={styles.header}>
          <div>
            <h1 className="mh-title">👪 Membres de la famille</h1>
            <p className="mh-subtitle">
              {membres.length} membre{membres.length > 1 ? 's' : ''} · {utilisateur.famille}
            </p>
          </div>
          <button type="button" onClick={() => setShowForm(!showForm)} className="mh-btn mh-btn-primary">
            {showForm ? 'Annuler' : '+ Inviter'}
          </button>
          <button type="button" onClick={chargerMembres} className="mh-btn" style={{ marginLeft: '0.5rem' }} title="Rafraîchir">
            ↻
          </button>
        </div>

        <div className="mh-form-alert" style={{ marginBottom: '1rem', textAlign: 'left', border: '2px solid #97C459' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1rem' }}>
            📎 Lien d&apos;invitation (site public)
          </p>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.85rem' }}>
            Code famille : <strong>{familyCode || '…'}</strong>
          </p>
          {lienPublic ? (
            <>
              <div style={styles.successLink}>{lienPublic}</div>
              <a
                href={lienPublic}
                target="_blank"
                rel="noopener noreferrer"
                className="mh-btn"
                style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
              >
                Tester le lien
              </a>
              <button type="button" onClick={copierLienPublic} style={styles.btnCopier}>
                Copier le lien HTTPS
              </button>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Chargement du code… reconnectez-vous si vide.</p>
          )}
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: '#A32D2D' }}>
            ⛔ N&apos;utilisez jamais un lien <code>localhost</code> — il ne marche pas sur téléphone.
          </p>
        </div>

        <div className="mh-card mh-profil-card fade-in-up">
          <ProfilePhotoPicker
            nom={utilisateur.nom}
            prenom={utilisateur.prenom}
            avatarUrl={utilisateur.avatar_url}
            size={72}
            onUpdated={(data) => {
              setUtilisateur((u) => ({ ...u, avatar_url: data.avatar_url }))
              chargerMembres()
            }}
          />
          <div className="mh-profil-card-text">
            <h2>
              {utilisateur.prenom} {utilisateur.nom}
            </h2>
            <p>{utilisateur.email}</p>
          </div>
        </div>

        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitre}>Inviter par email</h3>
            <form onSubmit={inviterMembre}>
              <div style={styles.formRow}>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Email du proche</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="tom@gmail.com"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formChamp}>
                  <label style={styles.label}>Rôle</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    style={styles.input}
                  >
                    <option value="MEMBRE">Membre</option>
                    <option value="ADMIN">Administrateur</option>
                    <option value="LECTEUR">Lecteur</option>
                  </select>
                </div>
              </div>
              {form.email && lienPublic && (
                <p style={{ fontSize: '0.8rem', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
                  Aperçu : {lienPublic}
                </p>
              )}
              {erreur && <p style={styles.erreur}>{erreur}</p>}
              <button type="submit" style={styles.btnSubmit}>
                Copier le lien HTTPS pour {form.email || '…'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : (
          <div style={styles.grille}>
            {membres.map((membre, i) => {
              const c = couleurRole(membre.role)
              const av = avatarCouleurs[i % avatarCouleurs.length]
              return (
                <div key={membre.id} style={styles.membreCard}>
                  <UserAvatar
                    nom={membre.nom}
                    prenom={membre.prenom}
                    avatarUrl={membre.avatar_url}
                    size={48}
                    fallbackStyle={{ background: av.bg, color: av.color }}
                    style={{ background: av.bg, color: av.color }}
                  />
                  <div style={styles.membreInfo}>
                    <div style={styles.membreNom}>
                      {membre.prenom} {membre.nom}
                    </div>
                    <div style={styles.membreEmail}>{membre.email}</div>
                    <span style={{ ...styles.roleBadge, background: c.bg, color: c.color }}>{membre.role}</span>
                    {membre.derniere_connexion && (
                      <div style={styles.derniereConnexion}>
                        📅 {new Date(membre.derniere_connexion).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                  {utilisateur.role === 'SUPER_ADMIN' && membre.id !== utilisateur.id && (
                    <div style={styles.membreActions}>
                      <select
                        value={membre.role}
                        onChange={(e) => changerRole(membre.id, e.target.value)}
                        style={styles.selectRole}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBRE">Membre</option>
                        <option value="LECTEUR">Lecteur</option>
                      </select>
                      <button type="button" onClick={() => desactiverMembre(membre.id)} style={styles.btnDesactiver}>
                        Désactiver
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <div style={styles.membreCardInvite} onClick={() => setShowForm(true)}>
              <div style={styles.inviteIcon}>+</div>
              <div style={styles.inviteText}>
                <div style={styles.inviteTitle}>Inviter un membre</div>
                <div style={styles.inviteDesc}>Copier le lien HTTPS</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
