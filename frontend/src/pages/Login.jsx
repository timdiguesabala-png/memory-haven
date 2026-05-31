import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import AuthSceneBackground from '../components/AuthSceneBackground'
import MemoryHavenLogo from '../components/MemoryHavenLogo'
import AuthPasswordField from '../components/AuthPasswordField'
import { buildRegisterJoinUrl } from '../lib/inviteLink'
import { prefetchAllAppPages } from '../lib/prefetchPages'
import '../styles/auth-scene.css'

function IconUser() {
  return (
    <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeInvite = (searchParams.get('code') || '').trim().toUpperCase()
  const emailInvite = searchParams.get('email') || ''
  const roleInvite = searchParams.get('role') || 'MEMBRE'
  const invitationActive = !!codeInvite

  const [form, setForm] = useState({ email: emailInvite, password: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (emailInvite) {
      setForm((f) => ({ ...f, email: emailInvite }))
    }
  }, [emailInvite])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')

    try {
      const reponse = await api.post('/auth/connexion', form)
      localStorage.setItem('token', reponse.data.token)
      localStorage.setItem('utilisateur', JSON.stringify(reponse.data.utilisateur))
      const code =
        reponse.data.utilisateur?.code_invitation || reponse.data.code_invitation
      if (code) localStorage.setItem('mh_family_invite_code', code)
      prefetchAllAppPages()
      navigate('/dashboard')
    } catch (err) {
      setErreur(
        err.userMessage || err.response?.data?.message || 'Email ou mot de passe incorrect.'
      )
    } finally {
      setLoading(false)
    }
  }

  const registerJoinTo = invitationActive
    ? buildRegisterJoinUrl(codeInvite, form.email || emailInvite, roleInvite)
    : null

  return (
    <div className="auth-page auth-page--scene">
      <AuthSceneBackground />

      <div className="auth-panel auth-panel--scene">
        <div className="auth-card auth-glass-card">
          <div className="auth-card-logo auth-card-logo--hero">
            <MemoryHavenLogo size="md" showWordmark showTagline={false} />
          </div>

          <p className="auth-glass-subtitle">
            {invitationActive
              ? 'Bienvenue — connectez-vous pour retrouver les souvenirs de votre famille.'
              : 'Heureux de vous revoir. Connectez-vous à votre espace famille.'}
          </p>

          {invitationActive && (
            <div className="auth-invite-banner">
              <p>Première visite avec une invitation ? Créez votre accès en un clic.</p>
              <Link to={registerJoinTo} className="mh-btn mh-btn-secondary auth-invite-cta">
                Rejoindre ma famille
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="mh-label">
              Email
              <div className="auth-field-wrap">
                <input
                  type="email"
                  name="email"
                  className="mh-input"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
                <IconUser />
              </div>
            </label>
            <label className="mh-label">
              Mot de passe
              <AuthPasswordField value={form.password} onChange={handleChange} />
            </label>
            {erreur && <p className="auth-error">{erreur}</p>}
            <button
              type="submit"
              className="mh-btn auth-btn-glass auth-submit"
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {!invitationActive && (
            <p className="auth-glass-footer">
              Pas encore de compte ? <Link to="/register">Créer un compte</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
