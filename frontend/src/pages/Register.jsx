import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'

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
          setErreur('Entrez le code d\'invitation reçu de votre famille')
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
      if (rejoindre) {
        const stats = reponse.data.famille_stats
        alert(
          `Bienvenue dans ${reponse.data.utilisateur?.famille || 'la famille'} !` +
            (stats ? ` ${stats.souvenirs} souvenir(s) et ${stats.membres} membre(s) vous attendent.` : '')
        )
      }
      navigate('/dashboard')
    } catch (err) {
      setErreur(err.userMessage || err.response?.data?.message || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero mh-glass-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-logo">🏡</div>
          <h1>Memory Haven</h1>
          <p>Préservez les souvenirs de votre famille pour les générations futures.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">📷</span>
              <span>Photos et vidéos de famille</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🎙️</span>
              <span>Enregistrements audio précieux</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🌳</span>
              <span>Arbre généalogique interactif</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">👪</span>
              <span>Partage privé entre membres</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card mh-glass-card">
          {!lienInvite && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`mh-chip ${!rejoindre ? 'mh-chip--active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setMode('creer')}
              >
                Créer une famille
              </button>
              <button
                type="button"
                className={`mh-chip ${rejoindre ? 'mh-chip--active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setMode('rejoindre')}
              >
                Rejoindre (code)
              </button>
            </div>
          )}

          <h2>{rejoindre ? 'Rejoindre la famille' : 'Créer mon espace famille'}</h2>
          <p className="auth-lead">
            {rejoindre
              ? 'Vous avez reçu un lien d\'invitation : complétez vos informations puis validez.'
              : 'Commencez à préserver vos souvenirs aujourd’hui'}
          </p>

          {lienInvite && (
            <div className="auth-invite-box" style={{ marginBottom: '0.85rem' }}>
              Lien d&apos;invitation détecté — vous rejoindrez la famille existante (pas une nouvelle).
            </div>
          )}

          {famillePreview?.famille && (
            <div className="mh-form-alert" style={{ marginBottom: '0.85rem', textAlign: 'left' }}>
              <strong>Famille : {famillePreview.famille.nom}</strong>
              <br />
              <span style={{ fontSize: '0.85rem' }}>
                {famillePreview.stats?.souvenirs ?? 0} souvenir(s) · {famillePreview.stats?.membres ?? 0} membre(s)
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {rejoindre && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="mh-label">Code d&apos;invitation</label>
                <input
                  name="code"
                  className="mh-input"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Ex: DEMO2026"
                  required
                  readOnly={!!codeUrl}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="mh-label">Prénom</label>
                <input name="prenom" className="mh-input" value={form.prenom} onChange={handleChange} placeholder="Afi" required />
              </div>
              <div>
                <label className="mh-label">Nom</label>
                <input name="nom" className="mh-input" value={form.nom} onChange={handleChange} placeholder="Koffi" required />
              </div>
            </div>
            <div style={{ marginTop: '0.85rem' }}>
              <label className="mh-label">Email</label>
              <input type="email" name="email" className="mh-input" value={form.email} onChange={handleChange} placeholder="votre@email.com" required />
            </div>
            <div style={{ marginTop: '0.85rem' }}>
              <label className="mh-label">Mot de passe</label>
              <input type="password" name="password" className="mh-input" value={form.password} onChange={handleChange} placeholder="Minimum 8 caractères" required />
            </div>
            {!rejoindre && (
              <div style={{ marginTop: '0.85rem' }}>
                <label className="mh-label">Nom de votre famille</label>
                <input name="nom_famille" className="mh-input" value={form.nom_famille} onChange={handleChange} placeholder="Ex: Famille Koffi" required />
              </div>
            )}
            {erreur && <p className="auth-error" style={{ marginTop: '0.75rem' }}>{erreur}</p>}
            <button type="submit" className="mh-btn mh-btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Création…' : rejoindre ? 'Rejoindre la famille' : 'Créer mon compte'}
            </button>
          </form>

          <div className="auth-divider">ou</div>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--warm4)', fontWeight: 600, textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
