import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import FamilyBackground from '../components/FamilyBackground'
import AuthIllustration from '../components/AuthIllustration'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeUrl = searchParams.get('code') || ''
  const modeUrl = searchParams.get('mode')
  const roleUrl = searchParams.get('role') || 'MEMBRE'
  const lienInvite = !!(codeUrl || modeUrl === 'rejoindre')

  const [mode, setMode] = useState(lienInvite ? 'rejoindre' : 'creer')
  const [famillePreview, setFamillePreview] = useState(null)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: searchParams.get('email') || '',
    password: '',
    nom_famille: '',
    code: codeUrl
  })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const rejoindre = mode === 'rejoindre'

  useEffect(() => {
    const code = String(form.code || codeUrl).trim().toUpperCase()
    if (!code || mode !== 'rejoindre') {
      setFamillePreview(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        const rep = await api.get('/auth/verifier-code', { params: { code } })
        setFamillePreview(rep.data)
        setErreur('')
      } catch {
        setFamillePreview(null)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [form.code, codeUrl, mode])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')

    try {
      let reponse
      if (rejoindre) {
        const code = String(form.code || '').trim().toUpperCase()
        if (!code) {
          setErreur('Entrez le code d\'invitation.')
          setLoading(false)
          return
        }
        reponse = await api.post('/auth/rejoindre', {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          code,
          role: roleUrl
        })
      } else {
        reponse = await api.post('/auth/inscription', {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          nom_famille: form.nom_famille
        })
      }
      localStorage.setItem('token', reponse.data.token)
      localStorage.setItem('utilisateur', JSON.stringify(reponse.data.utilisateur))
      const code =
        reponse.data.utilisateur?.code_invitation ||
        reponse.data.code_invitation ||
        (rejoindre ? String(form.code).trim().toUpperCase() : null)
      if (code) localStorage.setItem('mh_family_invite_code', code)
      navigate('/dashboard')
    } catch (err) {
      setErreur(err.userMessage || err.response?.data?.message || "Erreur lors de l'inscription")
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

          {!lienInvite && (
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`mh-chip ${!rejoindre ? 'mh-chip--active' : ''}`}
                onClick={() => setMode('creer')}
              >
                Créer
              </button>
              <button
                type="button"
                className={`mh-chip ${rejoindre ? 'mh-chip--active' : ''}`}
                onClick={() => setMode('rejoindre')}
              >
                Rejoindre
              </button>
            </div>
          )}

          <h2>{rejoindre ? 'Rejoindre une famille' : 'Créer un espace famille'}</h2>

          {famillePreview?.famille && (
            <p className="auth-invite-preview">
              Famille <strong>{famillePreview.famille.nom}</strong>
            </p>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {rejoindre && (
              <label className="mh-label">
                Code d&apos;invitation
                <input
                  name="code"
                  className="mh-input"
                  value={form.code}
                  onChange={handleChange}
                  required
                  readOnly={!!codeUrl}
                  style={{ textTransform: 'uppercase' }}
                />
              </label>
            )}
            <div className="auth-name-row">
              <label className="mh-label">
                Prénom
                <input name="prenom" className="mh-input" value={form.prenom} onChange={handleChange} required />
              </label>
              <label className="mh-label">
                Nom
                <input name="nom" className="mh-input" value={form.nom} onChange={handleChange} required />
              </label>
            </div>
            <label className="mh-label">
              Email
              <input type="email" name="email" className="mh-input" value={form.email} onChange={handleChange} required />
            </label>
            <label className="mh-label">
              Mot de passe
              <input type="password" name="password" className="mh-input" value={form.password} onChange={handleChange} required />
            </label>
            {!rejoindre && (
              <label className="mh-label">
                Nom de famille
                <input name="nom_famille" className="mh-input" value={form.nom_famille} onChange={handleChange} required />
              </label>
            )}
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="mh-btn mh-btn-primary auth-submit" disabled={loading}>
              {loading ? '…' : rejoindre ? 'Rejoindre' : 'Créer le compte'}
            </button>
          </form>

          <p className="auth-footer-links">
            <Link to="/login">Déjà un compte ? Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
