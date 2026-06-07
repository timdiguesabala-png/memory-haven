import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listMembresFamille,
  fetchInviteCode,
  inviterMembre as apiInviterMembre,
  changerRoleMembre,
  desactiverMembre as apiDesactiverMembre
} from '../services/membersApi'
import { isSupabaseMode } from '../lib/supabaseClient'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/PageHeader'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker'
import UserAvatar from '../components/UserAvatar'
import { getStoredUser, updateStoredUser } from '../lib/userStorage'
import { refreshCurrentUser } from '../services/profileApi'
import { cacheMembresList } from '../lib/membresProfilCache'
import { estAdmin } from '../lib/roles'
import '../styles/membre-fiche.css'

/** Site public — NE PAS MODIFIER (liens d'invitation) */
const INVITE_SITE = 'https://memory-haven-frontend.vercel.app'

function buildPublicInviteLink(code, email = '', role = 'MEMBRE') {
  if (!code) return ''
  const params = new URLSearchParams({
    code: String(code).trim().toUpperCase()
  })
  if (email?.trim()) params.set('email', email.trim())
  if (role) params.set('role', role)
  return `${INVITE_SITE}/login?${params.toString()}`
}

function extractCodeFromLink(lien) {
  if (!lien) return ''
  const m = String(lien).match(/[?&]code=([^&]+)/i)
  return m ? decodeURIComponent(m[1]).trim().toUpperCase() : ''
}

function excerptText(text, max = 140) {
  if (!text?.trim()) return ''
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

export default function Membres() {
  const navigate = useNavigate()
  const [utilisateur, setUtilisateur] = useState(() => getStoredUser())

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
  const [, setCodeLoading] = useState(true)
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

  const chargerCodeFamille = async () => {
    const cached = localStorage.getItem('mh_family_invite_code')
    if (cached) {
      persistFamilyCode(cached)
      return cached
    }

    if (isSupabaseMode()) {
      try {
        const rep = await fetchInviteCode()
        const code = rep?.data?.code
        if (code) {
          persistFamilyCode(code)
          return code
        }
      } catch {
        /* fallback */
      }
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
      const rep = await listMembresFamille()
      const list = rep.data || []
      setMembres(list)
      cacheMembresList(list)
    } catch (err) {
      console.error('Erreur membres:', err)
    } finally {
      setLoading(false)
    }
  }

  const ouvrirFicheMembre = (membre) => {
    if (Number(membre.id) === Number(utilisateur.id)) {
      navigate('/compte')
      return
    }
    navigate(`/membre/${membre.id}`)
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
    let inviteMsg = ''
    try {
      const rep = await apiInviterMembre(form)
      if (rep?.email_envoye) {
        inviteMsg = `Invitation envoyée à ${form.email}`
      } else if (rep?.email_config === false) {
        inviteMsg = 'Email non configuré — lien copié dans le presse-papier'
      }
    } catch {
      /* le lien HTTPS suffit */
    }
    await copierLienPublic()
    if (inviteMsg) {
      window.alert(inviteMsg)
    }
    setForm({ email: '', role: 'MEMBRE' })
    setShowForm(false)
  }

  const changerRole = async (id, role) => {
    try {
      await changerRoleMembre(id, role)
      chargerMembres()
    } catch (err) {
      console.error('Erreur role:', err)
    }
  }

  const desactiverMembre = async (id) => {
    if (!window.confirm('Désactiver ce membre ?')) return
    try {
      await apiDesactiverMembre(id)
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
      <div className="mh-page-content">
        <PageHeader title="Membres" family={utilisateur.famille}>
          {peutInviter && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="mh-btn mh-btn-primary">
              {showForm ? 'Annuler' : '+ Inviter'}
            </button>
          )}
          <button type="button" onClick={chargerMembres} className="mh-btn" title="Rafraîchir">
            ↻
          </button>
        </PageHeader>

        {peutInviter && (
          <div className="mh-invite-box mh-mirror-surface">
            <h3>Invitation</h3>
            <label className="mh-label">
              Code famille
              <input
                className="mh-input"
                value={codeInput}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase()
                  setCodeInput(v)
                  if (v.length >= 4) persistFamilyCode(v)
                }}
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            {lienPublic && (
              <>
                <div className="mh-invite-link">{lienPublic}</div>
                <button type="button" className="mh-btn mh-btn-primary" onClick={copierLienPublic}>
                  Copier le lien
                </button>
              </>
            )}
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
          <div className="mh-form-panel mh-mirror-surface">
            <h3>Inviter par email</h3>
            <form onSubmit={inviterMembre}>
              <div className="mh-form-row-2">
                <label className="mh-label">
                  Email
                  <input
                    type="email"
                    className="mh-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </label>
                <label className="mh-label">
                  Rôle
                  <select
                    className="mh-input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="MEMBRE">Membre</option>
                    <option value="ADMIN">Administrateur</option>
                    <option value="LECTEUR">Lecteur</option>
                  </select>
                </label>
              </div>
              {erreur && <p className="auth-error">{erreur}</p>}
              <button type="submit" className="mh-btn mh-btn-primary" style={{ marginTop: '0.75rem' }}>
                Copier le lien d&apos;invitation
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="mh-page-loading">Chargement…</div>
        ) : (
          <div className="mh-member-grid">
            {membres.map((membre, i) => {
              const c = couleurRole(membre.role)
              const av = avatarCouleurs[i % avatarCouleurs.length]
              return (
                <div
                  key={membre.id}
                  className="mh-member-card mh-mirror-surface mh-member-card--clickable"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    if (e.target.closest('.mh-member-actions')) return
                    ouvrirFicheMembre(membre)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      ouvrirFicheMembre(membre)
                    }
                  }}
                >
                  <UserAvatar
                    nom={membre.nom}
                    prenom={membre.prenom}
                    avatarUrl={membre.avatar_url}
                    size={48}
                    fallbackStyle={{ background: av.bg, color: av.color }}
                    style={{ background: av.bg, color: av.color }}
                  />
                  <div className="mh-member-info">
                    <div className="mh-member-name">
                      {membre.prenom} {membre.nom}
                    </div>
                    <div className="mh-member-email">{membre.email}</div>
                    <span className="mh-role-badge" style={{ background: c.bg, color: c.color }}>
                      {membre.role}
                    </span>
                    {membre.metier_actuel && (
                      <div className="mh-member-metier">{membre.metier_actuel}</div>
                    )}
                    {membre.biographie && (
                      <p className="mh-member-bio-excerpt">{excerptText(membre.biographie)}</p>
                    )}
                    {!membre.biographie && membre.bibliographie && (
                      <p className="mh-member-bio-excerpt">{excerptText(membre.bibliographie)}</p>
                    )}
                  </div>
                  {estAdmin(utilisateur.role) &&
                    membre.id !== utilisateur.id &&
                    (membre.role !== 'SUPER_ADMIN' || utilisateur.role === 'SUPER_ADMIN') && (
                    <div
                      className="mh-member-actions"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <select
                        className="mh-input"
                        value={membre.role}
                        onChange={(e) => changerRole(membre.id, e.target.value)}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBRE">Membre</option>
                        <option value="LECTEUR">Lecteur</option>
                      </select>
                      <button
                        type="button"
                        className="mh-btn mh-btn-ghost-danger"
                        onClick={() => desactiverMembre(membre.id)}
                      >
                        Désactiver
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
              {peutInviter && (
              <button
                type="button"
                className="mh-member-card mh-member-card--invite mh-mirror-surface"
                onClick={() => setShowForm(true)}
              >
                <span style={{ fontSize: '1.75rem', color: 'var(--haven-lavande)' }}>+</span>
                <span className="mh-member-name">Inviter un membre</span>
              </button>
              )}
          </div>
        )}
      </div>

    </AppLayout>
  )
}
