import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import FamilyBackground from '../components/FamilyBackground'
import MemoryHavenLogo from '../components/MemoryHavenLogo'
import { buildRegisterJoinUrl } from '../lib/inviteLink'

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
    <div className="auth-page auth-page--centered mh-mirror-app">
      <FamilyBackground />

      <div className="auth-panel auth-panel--centered">
        <div className="auth-card mh-glass-card mh-mirror-surface">
          <div className="auth-card-logo auth-card-logo--hero">
            <MemoryHavenLogo size="lg" showWordmark />
          </div>

          {invitationActive && (
            <div className="auth-invite-banner">
              <p>Vous avez été invité à rejoindre votre famille. Connectez-vous si vous avez déjà un compte, ou créez votre accès une première fois.</p>
              <Link to={registerJoinTo} className="mh-btn mh-btn-secondary auth-invite-cta">
                Rejoindre ma famille
              </Link>
            </div>
          )}

          <h2>Connexion</h2>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="mh-label">
              Email
              <input
                type="email"
                name="email"
                className="mh-input"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>
            <label className="mh-label">
              Mot de passe
              <input
                type="password"
                name="password"
                className="mh-input"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </label>
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="mh-btn mh-btn-primary auth-submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {!invitationActive && (
            <p className="auth-footer-links">
              <Link to="/register">Créer un compte</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
