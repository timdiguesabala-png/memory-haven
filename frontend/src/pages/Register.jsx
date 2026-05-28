import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import FamilyBackground from '../components/FamilyBackground'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const aCode = !!searchParams.get('code')

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: searchParams.get('email') || '',
    password: '',
    nom_famille: '',
    code: searchParams.get('code') || ''
  })
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
      let reponse
      if (aCode) {
        reponse = await api.post('/auth/rejoindre', {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          code: form.code
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
      navigate('/dashboard')
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'inscription")
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
          <h2>{aCode ? 'Rejoindre la famille' : 'Créer mon espace famille'}</h2>
          <p className="auth-lead">
            {aCode
              ? 'Vous avez été invité à rejoindre un espace famille'
              : 'Commencez à préserver vos souvenirs aujourd’hui'}
          </p>

          {aCode && (
            <div className="auth-invite-box">
              Code d&apos;invitation : <strong>{form.code}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
            {!aCode && (
              <div style={{ marginTop: '0.85rem' }}>
                <label className="mh-label">Nom de votre famille</label>
                <input name="nom_famille" className="mh-input" value={form.nom_famille} onChange={handleChange} placeholder="Ex: Famille Koffi" required />
              </div>
            )}
            {erreur && <p className="auth-error" style={{ marginTop: '0.75rem' }}>{erreur}</p>}
            <button type="submit" className="mh-btn mh-btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Création…' : aCode ? 'Rejoindre la famille' : 'Créer mon compte'}
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
