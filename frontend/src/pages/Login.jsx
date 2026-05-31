import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import FamilyBackground from '../components/FamilyBackground'
import AuthIllustration from '../components/AuthIllustration'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="auth-page mh-mirror-app">
      <FamilyBackground />
      <div className="auth-visual mh-mirror-surface">
        <AuthIllustration />
      </div>

      <div className="auth-panel">
        <div className="auth-card mh-glass-card mh-mirror-surface">
          <p className="auth-brand">Memory Haven</p>
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

          <p className="auth-footer-links">
            <Link to="/register">Créer un compte</Link>
            <span className="auth-footer-sep">·</span>
            <Link to="/register?mode=rejoindre">Rejoindre une famille</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
