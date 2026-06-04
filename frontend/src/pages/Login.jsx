import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { isSupabaseMode } from '../lib/supabaseClient'
import { supabaseSignIn, persistSupabaseUser } from '../services/supabaseAuth'
import AuthSceneBackground from '../components/AuthSceneBackground'
import MemoryHavenLogo from '../components/MemoryHavenLogo'
import AuthPasswordField from '../components/AuthPasswordField'
import { buildRegisterJoinUrl } from '../lib/inviteLink'
import { prefetchAllAppPages } from '../lib/prefetchPages'
import { verify2FALogin } from '../lib/platformApi'
import '../styles/auth-scene.css'

function IconUser() {
  return (
    <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function finishLogin(reponse, navigate) {
  if (reponse.token) localStorage.setItem('token', reponse.token)
  const user = reponse.utilisateur
  if (user) persistSupabaseUser(user)
  else if (reponse.utilisateur) {
    localStorage.setItem('utilisateur', JSON.stringify(reponse.utilisateur))
  }
  prefetchAllAppPages()
  navigate('/accueil')
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeInvite = (searchParams.get('code') || '').trim().toUpperCase()
  const emailInvite = searchParams.get('email') || ''
  const roleInvite = searchParams.get('role') || 'MEMBRE'
  const invitationActive = !!codeInvite

  const [form, setForm] = useState({ email: emailInvite, password: '' })
  const [totpCode, setTotpCode] = useState('')
  const [pendingToken, setPendingToken] = useState(null)
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
      if (isSupabaseMode()) {
        const { utilisateur } = await supabaseSignIn(form)
        finishLogin({ utilisateur }, navigate)
        return
      }
      const reponse = await api.post('/auth/connexion', form)
      if (reponse.data.requires_2fa && reponse.data.pending_token) {
        setPendingToken(reponse.data.pending_token)
        return
      }
      finishLogin(reponse.data, navigate)
    } catch (err) {
      setErreur(
        err.userMessage || err.response?.data?.message || 'Email ou mot de passe incorrect.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handle2FA = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      const data = await verify2FALogin(pendingToken, totpCode)
      finishLogin(data, navigate)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Code 2FA invalide')
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
            {pendingToken
              ? 'Entrez le code à 6 chiffres de votre application d’authentification.'
              : invitationActive
                ? 'Bienvenue — connectez-vous pour retrouver les souvenirs de votre famille.'
                : 'Heureux de vous revoir. Connectez-vous à votre espace famille.'}
          </p>

          {invitationActive && !pendingToken && (
            <div className="auth-invite-banner">
              <p>Première visite avec une invitation ? Créez votre accès en un clic.</p>
              <Link to={registerJoinTo} className="mh-btn mh-btn-secondary auth-invite-cta">
                Rejoindre ma famille
              </Link>
            </div>
          )}

          {pendingToken ? (
            <form onSubmit={handle2FA} className="auth-form">
              <label className="mh-label">
                Code 2FA
                <input
                  className="mh-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                />
              </label>
              {erreur && <p className="auth-error">{erreur}</p>}
              <button type="submit" className="mh-btn auth-btn-glass auth-submit" disabled={loading}>
                {loading ? 'Vérification…' : 'Valider'}
              </button>
              <button
                type="button"
                className="mh-btn"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  setPendingToken(null)
                  setTotpCode('')
                }}
              >
                Retour
              </button>
            </form>
          ) : (
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
              {isSupabaseMode() && (
                <p className="auth-glass-footer" style={{ marginBottom: '0.5rem' }}>
                  <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
                </p>
              )}
              <button
                type="submit"
                className="mh-btn auth-btn-glass auth-submit"
                disabled={loading}
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          )}

          {!invitationActive && !pendingToken && (
            <p className="auth-glass-footer">
              Pas encore de compte ? <Link to="/register">Créer un compte</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

