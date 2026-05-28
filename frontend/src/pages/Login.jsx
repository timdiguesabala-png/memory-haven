import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import FamilyBackground from '../components/FamilyBackground'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    if (apiUrl.includes('onrender.com')) {
      setErreur(
        'Mauvaise API (Render). Utilisez https://memory-haven-frontend.vercel.app puis Ctrl+F5.'
      )
    }
  }, [])

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
      navigate('/dashboard')
    } catch (err) {
      if (!err.response) {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        if (apiUrl.includes('onrender.com')) {
          setErreur('API Render hors service. Ouvrez https://memory-haven-frontend.vercel.app (Ctrl+F5).')
        } else {
          setErreur(err.userMessage || 'Serveur inaccessible. Vérifiez que l’API Railway est en ligne.')
        }
      } else {
        setErreur(err.userMessage || err.response?.data?.message || 'Email ou mot de passe incorrect')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <FamilyBackground />
      <div className="auth-hero mh-glass-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-logo">🏡</div>
          <h1>Memory Haven</h1>
          <p>Votre espace famille privé pour préserver et partager vos souvenirs.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">📷</span>
              <span>Photos et vidéos en haute qualité</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🎙️</span>
              <span>Enregistrements audio des histoires</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🌳</span>
              <span>Arbre généalogique interactif</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">👪</span>
              <span>Partage privé entre proches</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card mh-glass-card">
          <h2>Bon retour !</h2>
          <p className="auth-lead">Connectez-vous à votre espace famille</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label className="mh-label">Email</label>
              <input
                type="email"
                name="email"
                className="mh-input"
                value={form.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
              />
            </div>
            <div style={{ marginBottom: '0.85rem' }}>
              <label className="mh-label">Mot de passe</label>
              <input
                type="password"
                name="password"
                className="mh-input"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="mh-btn mh-btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-divider">ou</div>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--warm4)', fontWeight: 600, textDecoration: 'none' }}>
              Créer un compte
            </Link>
            {' · '}
            <Link to="/register?mode=rejoindre" style={{ color: 'var(--warm4)', fontWeight: 600, textDecoration: 'none' }}>
              Rejoindre avec un code
            </Link>
          </p>

          <div className="auth-demo">
            <div><strong>Comptes démo</strong></div>
            <div>👩 Marie : marie@demo.local</div>
            <div>👨 Pierre : pierre@demo.local</div>
            <div>🔑 Mot de passe : demo1234</div>
            <div style={{ marginTop: '6px', fontSize: '0.72rem' }}>
              Pour les notifications : connectez Pierre, commentez un souvenir de Marie (ou l’inverse).
            </div>
            <div style={{ marginTop: '8px' }}>
              <button type="button" onClick={() => setForm({ email: 'marie@demo.local', password: 'demo1234' })}>
                Connexion Marie
              </button>
              {' · '}
              <button type="button" onClick={() => setForm({ email: 'pierre@demo.local', password: 'demo1234' })}>
                Pierre
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
