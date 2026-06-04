import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthSceneBackground from '../components/AuthSceneBackground'
import MemoryHavenLogo from '../components/MemoryHavenLogo'
import { supabaseResetPassword } from '../services/supabaseAuth'
import { isSupabaseMode } from '../lib/supabaseClient'
import '../styles/auth-scene.css'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isSupabaseMode()) {
    return (
      <div className="auth-page auth-page--scene">
        <AuthSceneBackground />
        <div className="auth-panel auth-panel--scene">
          <div className="auth-card auth-glass-card">
            <p>La récupération par email nécessite le mode Supabase Auth.</p>
            <Link to="/login">Retour connexion</Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      await supabaseResetPassword(email)
      setSent(true)
    } catch (err) {
      setErreur(err.message || 'Erreur envoi email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page--scene">
      <AuthSceneBackground />
      <div className="auth-panel auth-panel--scene">
        <div className="auth-card auth-glass-card">
          <MemoryHavenLogo size="md" showWordmark showTagline={false} />
          <h2 style={{ marginTop: '1rem' }}>Mot de passe oublié</h2>
          {sent ? (
            <p className="auth-glass-subtitle">
              Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="auth-label">
                Email
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              {erreur && <p className="auth-error">{erreur}</p>}
              <button type="submit" className="mh-btn mh-btn--primary auth-submit" disabled={loading}>
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>
          )}
          <p style={{ marginTop: '1rem' }}>
            <Link to="/login">← Retour connexion</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
