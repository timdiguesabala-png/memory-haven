import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import AppLayout from '../components/AppLayout'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker'
import UserAvatar from '../components/UserAvatar'
import { getStoredUser, updateStoredUser } from '../lib/userStorage'
import { refreshCurrentUser } from '../services/profileApi'
import { estAdmin } from '../lib/roles'

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

function extractCodeFromLink(lien) {
  if (!lien) return ''
  const m = String(lien).match(/[?&]code=([^&]+)/i)
  return m ? decodeURIComponent(m[1]).trim().toUpperCase() : ''
}

export default function Membres() {
  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())
  const { darkMode } = useTheme()

  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'MEMBRE' })
  const [erreur, setErreur] = useState('')
  const [familyCode, setFamilyCode] = useState(() => {
    return (
      localStorage.getItem('mh_family_invite_code') ||
      getStoredUser()?.code_invitation ||
      ''
    )
  })
  const [codeInput, setCodeInput] = useState(() => familyCode)
  const [codeLoading, setCodeLoading] = useState(true)

  const effectiveCode = (familyCode || codeInput || '').trim().toUpperCase()

  const lienPublic = useMemo(
    () => buildPublicInviteLink(effectiveCode, form.email, form.role),
    [effectiveCode, form.email, form.role]
  )

  const persistFamilyCode = (code) => {
    if (!code) return
    const c = String(code).trim().toUpperCase()
    setFamilyCode(c)
    setCodeInput(c)
    localStorage.setItem('mh_family_invite_code', c)
    updateStoredUser({ code_invitation: c })
  }

  const styles = {
    page: { minHeight: '100vh', background: darkMode ? '#1E1C2C' : '#E8E2F4', fontFamily: 'sans-serif' },
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
    sidebar: { width: '200px', background: darkMode ? '#221F32' : '#C8B8DC', borderRight: `1px solid ${darkMode ? '#1E1C2C' : '#C5B8E0'}`, padding: '.75rem', flexShrink: 0 },
    sideLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: darkMode ? '#a0a0a0' : '#7A7394', fontWeight: '500', marginBottom: '5px', marginTop: '12px' },
    sideItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', color: darkMode ? '#e0e0e0' : '#4A4568', fontSize: '13px', marginBottom: '2px' },
    sideItemActive: { background: darkMode ? '#7B6BB8' : '#7B6BB8', color: '#FFF', fontWeight: '500' },
    sideBadge: { marginLeft: 'auto', background: darkMode ? '#7B6BB8' : '#5B4D9E', color: '#FFF', fontSize: '10px', padding: '1px 6px', borderRadius: '8px' },
    statCard: { background: darkMode ? '#1A1828' : '#F8F6FC', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '8px', padding: '10px', marginBottom: '6px', textAlign: 'center' },
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
    formCard: { background: darkMode ? '#221F32' : '#F8F6FC', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' },
    formTitre: { fontSize: '16px', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '1rem' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    formChamp: { marginBottom: '10px' },
    label: { display: 'block', fontSize: '12px', color: darkMode ? '#a0a0a0' : '#4A4568', marginBottom: '4px', fontWeight: '500' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, fontSize: '13px', background: darkMode ? '#1E1C2C' : '#B8A8CC', color: darkMode ? '#e0e0e0' : '#2A2640', outline: 'none', boxSizing: 'border-box' },
    btnSubmit: { background: '#5B4D9E', color: '#FFF', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    erreur: { background: '#FCEBEB', color: '#A32D2D', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
    loading: { textAlign: 'center', padding: '3rem', color: darkMode ? '#a0a0a0' : '#4A4568' },
    grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
    membreCard: { background: darkMode ? '#1A1828' : '#F8F6FC', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '12px' },
    membreCardInvite: { background: darkMode ? '#221F32' : '#F3F0FA', border: `1.5px dashed ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
    membreInfo: { flex: 1 },
    membreNom: { fontSize: '15px', fontWeight: '500', color: darkMode ? '#e0e0e0' : '#2A2640', marginBottom: '2px' },
    membreEmail: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A7394', marginBottom: '6px' },
    roleBadge: { fontSize: '11px', padding: '3px 10px', borderRadius: '8px', fontWeight: '500', display: 'inline-block' },
    derniereConnexion: { fontSize: '11px', color: darkMode ? '#a0a0a0' : '#7A7394', marginTop: '4px' },
    membreActions: { display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 },
    selectRole: { padding: '5px 8px', borderRadius: '8px', border: `1px solid ${darkMode ? '#7B6BB8' : '#C5B8E0'}`, fontSize: '12px', background: darkMode ? '#1E1C2C' : '#B8A8CC', color: darkMode ? '#e0e0e0' : '#2A2640', cursor: 'pointer' },
    btnDesactiver: { background: 'none', border: 'none', color: '#C06060', cursor: 'pointer', fontSize: '12px' },
    inviteIcon: { width: '48px', height: '48px', borderRadius: '50%', background: '#C8B8DC', color: '#5B4D9E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '300', flexShrink: 0 },
    inviteText: { flex: 1 },
    inviteTitle: { fontSize: '14px', fontWeight: '500', color: '#5B4D9E', marginBottom: '2px' },
    inviteDesc: { fontSize: '12px', color: darkMode ? '#a0a0a0' : '#7A7394' }
  }

  const chargerCodeFamille = async () => {
    const cached = localStorage.getItem('mh_family_invite_code')
    if (cached) {
      persistFamilyCode(cached)
      return cached
    }

    const tryEndpoints = [
      () => api.get('/auth/mon-code').then((r) => r.data.code),
      () => api.get('/membres/code-invitation').then((r) => r.data.data?.code),
      () => refreshCurrentUser().then((r) => r.utilisateur?.code_invitation)
    ]

    for (const fn of tryEndpoints) {
      try {
        const code = await fn()
        if (code) {
          persistFamilyCode(code)
          return code
        }
      } catch {
        /* endpoint absent sur ancienne API */
      }
    }

    try {
      const rep = await api.post('/membres/inviter', {
        email: 'lien@memoryhaven.local',
        role: 'MEMBRE'
      })
      const fromLink = extractCodeFromLink(rep.data.lien)
      if (fromLink) {
        persistFamilyCode(fromLink)
        return fromLink
      }
    } catch {
      /* réservé admin */
    }

    return null
  }

  useEffect(() => {
    const init = async () => {
      setCodeLoading(true)
      try {
        const { utilisateur: u } = await refreshCurrentUser()
        setUtilisateur(u)
        if (u?.code_invitation) persistFamilyCode(u.code_invitation)
        else await chargerCodeFamille()
      } catch {
        await chargerCodeFamille()
      } finally {
        setCodeLoading(false)
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
    if (!effectiveCode) {
      setErreur('Entrez votre code d\'invitation ci-dessus (ex: FSR6E1H4)')
      return
    }
    if (!lienPublic) {
      setErreur('Code invalide')
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
    const code = effectiveCode || (await chargerCodeFamille())
    if (!code) {
      setErreur('Entrez le code d\'invitation de votre famille dans le cadre vert')
      return
    }
    persistFamilyCode(code)
    try {
      await api.post('/membres/inviter', form)
    } catch {
      /* le lien HTTPS suffit */
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

  const peutInviter = estAdmin(utilisateur.role)

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
        <div className="mh-view-header" style={styles.header}>
          <div>
            <h1 className="mh-title">👪 Gestion des membres</h1>
            <p className="mh-subtitle">
              {membres.length} membre{membres.length > 1 ? 's' : ''} · {utilisateur.famille}
            </p>
          </div>
          {peutInviter && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="mh-btn mh-btn-primary">
              {showForm ? 'Annuler' : '+ Inviter'}
            </button>
          )}
          <button type="button" onClick={chargerMembres} className="mh-btn" style={{ marginLeft: '0.5rem' }} title="Rafraîchir">
            ↻
          </button>
        </div>

        <div className="mh-stats-row">
          <div className="mh-stat-card">
            <span className="mh-stat-num">{membres.length}</span>
            <div className="mh-stat-label">Membres actifs</div>
          </div>
          <div className="mh-stat-card">
            <span className="mh-stat-num">
              {membres.filter((m) => m.role === 'ADMIN' || m.role === 'SUPER_ADMIN').length}
            </span>
            <div className="mh-stat-label">Administrateurs</div>
          </div>
        </div>

        {!peutInviter && (
          <p className="mh-form-alert" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            Seuls les <strong>administrateurs</strong> peuvent inviter de nouveaux membres.
          </p>
        )}

        {peutInviter && (
        <div className="mh-form-alert" style={{ marginBottom: '1rem', textAlign: 'left', border: '2px solid #97C459' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1rem' }}>
            📎 Lien d&apos;invitation (site public)
          </p>
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="mh-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
              Code d&apos;invitation de votre famille
            </label>
            <input
              className="mh-input"
              value={codeInput}
              onChange={(e) => {
                const v = e.target.value.toUpperCase()
                setCodeInput(v)
                if (v.length >= 4) persistFamilyCode(v)
              }}
              placeholder="Ex: FSR6E1H4"
              style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}
            />
            {codeLoading && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem' }}>Chargement du code…</p>
            )}
            {!codeLoading && !effectiveCode && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#A32D2D' }}>
                Saisissez le code affiché lors de la création du compte (ex. FSR6E1H4).
              </p>
            )}
          </div>
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
        )}

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

        {peutInviter && showForm && (
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
              {peutInviter && (
              <div style={styles.membreCardInvite} onClick={() => setShowForm(true)}>
                <div style={styles.inviteIcon}>+</div>
                <div style={styles.inviteText}>
                  <div style={styles.inviteTitle}>Inviter un membre</div>
                  <div style={styles.inviteDesc}>Copier le lien HTTPS</div>
                </div>
              </div>
              )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
